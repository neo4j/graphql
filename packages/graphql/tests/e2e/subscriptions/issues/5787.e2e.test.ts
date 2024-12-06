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

import type { Response } from "supertest";
import supertest from "supertest";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("https://github.com/neo4j/graphql/issues/5787", () => {
    describe("With onlyGraphQLEvents", () => {
        const testHelper = new TestHelper({ cdc: true, onlyGraphQLEvents: true });
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;
        let typeMovie: UniqueType;

        beforeAll(async () => {
            await testHelper.assertCDCEnabled();
        });

        beforeEach(async () => {
            typeMovie = testHelper.createUniqueType("Movie");

            const typeDefs = `
         type ${typeMovie} @node {
             title: String
         }

         `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
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
            await server.close();
            await testHelper.close();
        });

        test("non-graphql subscriptions are not filtered by default", async () => {
            await wsClient.subscribe(`
                            subscription {
                                ${typeMovie.operations.subscribe.created} {
                                    ${typeMovie.operations.subscribe.payload.created} {
                                        title
                                    }
                                    event
                                    timestamp
                                }
                            }
                            `);

            await createMovie("movie1");
            await createMovieWithCypher("movie2");

            await wsClient.waitForEvents(1);

            expect(wsClient.errors).toEqual([]);
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                        event: "CREATE",
                        timestamp: expect.any(Number),
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

        async function createMovieWithCypher(title: string): Promise<void> {
            await testHelper.executeCypher(`CREATE(:${typeMovie} {title: "${title}"})`);
        }
    });

    describe("Without onlyGraphQLEvents", () => {
        const testHelper = new TestHelper({ cdc: true, onlyGraphQLEvents: false });
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;
        let typeMovie: UniqueType;

        beforeAll(async () => {
            await testHelper.assertCDCEnabled();
        });

        beforeEach(async () => {
            typeMovie = testHelper.createUniqueType("Movie");

            const typeDefs = `
         type ${typeMovie} @node {
             title: String
         }

         `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
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
            await server.close();
            await testHelper.close();
        });

        test("non-graphql subscriptions are not filtered by default", async () => {
            await wsClient.subscribe(`
                            subscription {
                                ${typeMovie.operations.subscribe.created} {
                                    ${typeMovie.operations.subscribe.payload.created} {
                                        title
                                    }
                                    event
                                    timestamp
                                }
                            }
                            `);

            await createMovie("movie1");
            await createMovieWithCypher("movie2");

            await wsClient.waitForEvents(2);

            expect(wsClient.errors).toEqual([]);
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                        event: "CREATE",
                        timestamp: expect.any(Number),
                    },
                },
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                        event: "CREATE",
                        timestamp: expect.any(Number),
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

        async function createMovieWithCypher(title: string): Promise<void> {
            await testHelper.executeCypher(`CREATE(:${typeMovie} {title: "${title}"})`);
        }
    });
});
