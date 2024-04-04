/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import supertest from "supertest";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("https://github.com/neo4j/graphql/issues/3698", () => {
    const testHelper = new TestHelper();
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeGenre: UniqueType;
    let typeDefs: string;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeGenre = testHelper.createUniqueType("Genre");

        typeDefs = `
        interface IProduct {
            id: String!

            title: String!
            genre: ${typeGenre}!
            info: String!
        }

        type ${typeMovie} implements IProduct {
            id: String!
            title: String!
            genre: ${typeGenre}! @relationship(type: "HAS_GENRE", direction: OUT)
            info: String! @customResolver(requires: "id title")
        }

        type ${typeGenre} {
            name: String! @unique
            product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
        }
           
          
        `;

        const resolvers = {
            [typeMovie.name]: {
                info: ({ id, title }) => {
                    return `${id}, ${title}`;
                },
            },
        };
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers,
            features: {
                subscriptions: new Neo4jGraphQLSubscriptionsDefaultEngine(),
            },
        });
        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: {
                database: testHelper.database,
            },
            token: req.headers.authorization,
        }));
        await server.start();

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();

        await testHelper.close();
        await server.close();
    });

    const movieSubscriptionQuery = (typeMovie: UniqueType) => `
subscription SubscriptionMovie {
    ${typeMovie.operations.subscribe.created} {
        event
        ${typeMovie.operations.subscribe.payload.created} {
            title
        }
        
    }
}
`;

    test("connect via create subscription sends events both ways", async () => {
        await wsClient.subscribe(movieSubscriptionQuery(typeMovie));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    genre: {
                                        create: {
                                            node: {
                                                name: "Action"
                                            },
                                        }
                                    },
                                    title: "Matrix",
                                    id: "1"
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    event: "CREATE",
                    [typeMovie.operations.subscribe.payload.created]: {
                        title: "Matrix",
                    },
                },
            },
        ]);
    });
});
