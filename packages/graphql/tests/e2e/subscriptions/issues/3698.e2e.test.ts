/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import supertest from "supertest";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("https://github.com/neo4j/graphql/issues/3698", () => {
    const testHelper = new TestHelper({ cdc: true });
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeGenre: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        await testHelper.assertCDCEnabled();
    });

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeGenre = testHelper.createUniqueType("Genre");

        typeDefs = `
        interface IProduct {
            id: String!

            title: String!
            genre: [${typeGenre}!]!
            info: String!
        }

        type ${typeMovie} implements IProduct @node @subscription {
            id: String!
            title: String!
            genre: [${typeGenre}!]! @relationship(type: "HAS_GENRE", direction: OUT)
            info: String! @customResolver(requires: "id title")
        }

        type ${typeGenre} @node {
            name: String!
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
                subscriptions: await testHelper.getSubscriptionEngine(),
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
