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

import { Driver } from "neo4j-driver";
import supertest, { Response } from "supertest";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";
import { ApolloTestServer, TestGraphQLServer } from "../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import { WebSocketClient, WebSocketTestClient } from "../setup/ws-client";
import neo4j from "../../integration/neo4j";

describe("Create Subscription", () => {
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketClient;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        driver = await neo4j();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: new TestSubscriptionsPlugin(),
            },
        });

        server = new ApolloTestServer(neoSchema);
        await server.start();
    });

    beforeEach(() => {
        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterAll(async () => {
        await server.close();
        await driver.close();
    });

    test("create subscription", async () => {
        await wsClient.subscribe(`
                            subscription {
                                ${typeMovie.operations.subscribe.created} {
                                    ${typeMovie.operations.subscribe.payload.created} {
                                        title
                                    }
                                    event
                                }
                            }
                            `);

        await createMovie("movie1");
        await createMovie("movie2");

        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                    event: "CREATE",
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.fieldNames.subscriptions.created]: { title: "movie2" },
                    event: "CREATE",
                },
            },
        ]);
    });

    test("create subscription with where", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: "movie1" }) {
                    ${typeMovie.fieldNames.subscriptions.created} {
                        title
                    }
                }
            }
        `);

        await createMovie("movie1");
        await createMovie("movie2");

        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.fieldNames.subscriptions.created]: { title: "movie1" },
                },
            },
        ]);
    });

    async function createMovie(title: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ title: "${title}" }]) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
