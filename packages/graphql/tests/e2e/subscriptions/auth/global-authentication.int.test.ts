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
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { TestSubscriptionsMechanism } from "../../../utils/TestSubscriptionsMechanism";
import { WebSocketTestClient } from "../../setup/ws-client";
import Neo4j from "../../setup/neo4j";
import { createJwtHeader } from "../../../utils/create-jwt-request";
import { UniqueType } from "../../../utils/graphql-types";

describe("Subscription global authentication", () => {
    let neo4j: Neo4j;
    let driver: Driver;
    let jwtToken: string;

    const secret = "secret";
    const typeMovie = new UniqueType("Movie");
    const typeDefs = `
        type ${typeMovie} {
            title: String!
        }

        extend type ${typeMovie} @auth(rules: [{ isAuthenticated: true }])
    `;

    beforeAll(async () => {
        jwtToken = createJwtHeader(secret, { roles: ["admin"] });
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });
    afterAll(async () => {
        await driver.close();
    });

    describe("should fail with no JWT token present and global authentication is enabled", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                features: {
                    subscriptions: new TestSubscriptionsMechanism(),
                },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                        globalAuthentication: true,
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

        test("global authentication for wsClient", async () => {
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

            const result = await createMovie("movie1", server, jwtToken);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toBeDefined();
            expect((wsClient.errors as any)[0].message).toBe("Unauthenticated");
        });

        test("global authentication for supertest client", async () => {
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

            const result = await createMovie("movie1", server, "");

            expect(result.body.errors).toBeDefined();
            expect(result.body.errors[0].message).toBe("Unauthenticated");
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([]);
        });
    });

    describe("should fail with invalid JWT token present and global authentication is enabled", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                features: {
                    subscriptions: new TestSubscriptionsMechanism(),
                },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                        globalAuthentication: true,
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

        test("global authentication for wsClient", async () => {
            wsClient = new WebSocketTestClient(server.wsPath, "Bearer xxx.invalidtoken.xxx");
            await wsClient.subscribe(`
                subscription {
                    ${typeMovie.operations.subscribe.created} {
                        ${typeMovie.operations.subscribe.payload.created} {
                            title
                        }
                    }
                }
                `);

            const result = await createMovie("movie1", server, jwtToken);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toBeDefined();
            expect((wsClient.errors as any)[0].message).toBe("Unauthenticated");
        });

        test("global authentication for supertest client", async () => {
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

            const result = await createMovie("movie1", server, "Bearer xxx.invalidtoken.xxx");

            expect(result.body.errors).toBeDefined();
            expect(result.body.errors[0].message).toBe("Unauthenticated");
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([]);
        });
    });

    describe("should not fail with valid JWT token present and global authentication is enabled", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                config: {
                    driverConfig: {
                        database: neo4j.getIntegrationDatabaseName(),
                    },
                },
                features: {
                    subscriptions: new TestSubscriptionsMechanism(),
                },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                        globalAuthentication: true,
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

        test("global authentication wsClient and supertest client", async () => {
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

            const result = await createMovie("movie1", server, jwtToken);

            await wsClient.waitForEvents(1);
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

    async function createMovie(
        title: string,
        graphQLServer: TestGraphQLServer,
        clientJwtToken: string
    ): Promise<Response> {
        const result = await supertest(graphQLServer.path)
            .post("")
            .set("authorization", clientJwtToken)
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
