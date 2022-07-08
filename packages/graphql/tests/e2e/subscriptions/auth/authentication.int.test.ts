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

import type { Driver } from "neo4j-driver";
import type { Response } from "supertest";
import supertest from "supertest";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType } from "../../../utils/graphql-types";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../setup/ws-client";
import Neo4j from "../../setup/neo4j";
import { createJwtHeader } from "../../../utils/create-jwt-request";

describe("Subscription authentication", () => {
    const typeMovie = generateUniqueType("Movie");
    let neo4j: Neo4j;
    let driver: Driver;
    let jwtToken: string;

    beforeAll(async () => {
        jwtToken = createJwtHeader("secret", { roles: ["admin"] });
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });
    afterAll(async () => {
        await driver.close();
    });

    describe("auth without operations", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const typeDefs = `
            type ${typeMovie} {
                title: String!
            }

            extend type ${typeMovie} @auth(rules: [{ isAuthenticated: true }])
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            server = new ApolloTestServer(neoSchema);
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await server.close();
        });

        test("authentication pass", async () => {
            wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
            await wsClient.subscribe(`
                subscription {
                    ${typeMovie.operations.subscribe.created} {
                        ${typeMovie.operations.subscribe.payload.created} {
                            title
                        }
                    }
                }
                `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: {
                            title: "movie1",
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });

        test("unauthenticated subscription does not send events", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error, request not authenticated" })]);
        });

        test("unauthenticated subscription fails", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                        subscription {
                            ${typeMovie.operations.subscribe.created} {
                                ${typeMovie.operations.subscribe.payload.created} {
                                    title
                                }
                            }
                        }
                        `);

            await wsClient.waitForNextEvent();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error, request not authenticated" })]);
        });

        test("authentication fails with wrong secret", async () => {
            const badJwtToken = createJwtHeader("wrong-secret", { roles: ["admin"] });
            wsClient = new WebSocketTestClient(server.wsPath, badJwtToken);
            await wsClient.subscribe(`
                            subscription {
                                ${typeMovie.operations.subscribe.created} {
                                    ${typeMovie.operations.subscribe.payload.created} {
                                        title
                                    }
                                }
                            }
                            `);
            await wsClient.waitForNextEvent();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error, request not authenticated" })]);
        });
    });

    describe("auth with subscribe operations", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const typeDefs = `
            type ${typeMovie} {
                title: String!
            }

            extend type ${typeMovie} @auth(rules: [{ isAuthenticated: true, operations: [SUBSCRIBE] }])
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            server = new ApolloTestServer(neoSchema);
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await server.close();
        });

        test("authentication pass", async () => {
            wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
            await wsClient.subscribe(`
                subscription {
                    ${typeMovie.operations.subscribe.created} {
                        ${typeMovie.operations.subscribe.payload.created} {
                            title
                        }
                    }
                }
                `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: {
                            title: "movie1",
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });

        test("unauthenticated subscription does not send events", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error, request not authenticated" })]);
        });
    });

    describe("auth with multiple rules with different operations", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const typeDefs = `
            type ${typeMovie} {
                title: String!
            }

            extend type ${typeMovie} @auth(rules: [{ isAuthenticated: false, operations: [DELETE] }, { isAuthenticated: true, operations: [SUBSCRIBE] }])
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            server = new ApolloTestServer(neoSchema);
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await server.close();
        });

        test("authentication pass", async () => {
            wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
            await wsClient.subscribe(`
                subscription {
                    ${typeMovie.operations.subscribe.created} {
                        ${typeMovie.operations.subscribe.payload.created} {
                            title
                        }
                    }
                }
                `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: {
                            title: "movie1",
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });

        test("unauthenticated subscription does not send events", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error, request not authenticated" })]);
        });
    });

    describe("auth without subscribe oprations", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const typeDefs = `
            type ${typeMovie} {
                title: String!
            }

            extend type ${typeMovie} @auth(rules: [{ isAuthenticated: true, operations: [CREATE] }])
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            server = new ApolloTestServer(neoSchema);
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await server.close();
        });

        test("unauthenticated subscription pass and send events", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: {
                            title: "movie1",
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });
    });

    describe("auth with isAuthenticated set to false", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const typeDefs = `
            type ${typeMovie} {
                title: String!
            }

            extend type ${typeMovie} @auth(rules: [{ isAuthenticated: false, operations: [SUBSCRIBE] }])
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            server = new ApolloTestServer(neoSchema);
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await server.close();
        });

        test("authenticated subscription fails", async () => {
            wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
            await wsClient.subscribe(`
                subscription {
                    ${typeMovie.operations.subscribe.created} {
                        ${typeMovie.operations.subscribe.payload.created} {
                            title
                        }
                    }
                }
                `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error, request not authenticated" })]);
        });

        test("unauthenticated subscription send events", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: {
                            title: "movie1",
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });
    });

    describe("auth with allowUnauthenticated", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const typeDefs = `
            type ${typeMovie} {
                title: String!
            }

            extend type ${typeMovie} @auth(rules: [{ isAuthenticated: true, allowUnauthenticated: true, operations: [SUBSCRIBE] }])
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            server = new ApolloTestServer(neoSchema);
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await server.close();
        });

        test("authentication pass", async () => {
            wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
            await wsClient.subscribe(`
                subscription {
                    ${typeMovie.operations.subscribe.created} {
                        ${typeMovie.operations.subscribe.payload.created} {
                            title
                        }
                    }
                }
                `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: {
                            title: "movie1",
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });

        test("unauthenticated subscription pass", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([
                {
                    [typeMovie.operations.subscribe.created]: {
                        [typeMovie.operations.subscribe.payload.created]: {
                            title: "movie1",
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });
    });

    async function createMovie(title: string, graphQLServer: TestGraphQLServer): Promise<Response> {
        const result = await supertest(graphQLServer.path)
            .post("")
            .set("authorization", jwtToken)
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
