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
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../setup/ws-client";
import Neo4j from "../../setup/neo4j";
import { createJwtHeader } from "../../../utils/create-jwt-request";
import { cleanNodes } from "../../../utils/clean-nodes";

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

    describe("auth with subscribe operations - connections", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;
        let typeDefs: string;
        let typeMovie: UniqueType;
        let typeActor: UniqueType;
        let typePerson: UniqueType;
        let typeInfluencer: UniqueType;

        beforeEach(async () => {
            typeActor = generateUniqueType("Actor");
            typeMovie = generateUniqueType("Movie");
            typePerson = generateUniqueType("Person");
            typeInfluencer = generateUniqueType("Influencer");
            typeDefs = `
            type ${typeMovie} {
                title: String!
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            }
            extend type ${typeMovie} @auth(rules: [{ isAuthenticated: true, operations: [SUBSCRIBE] }])
            
            type ${typeActor} {
                name: String!
                id: Int @unique
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
            
            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
            
            interface Directed @relationshipProperties {
                year: Int!
            }
            
            interface Review {
                score: Int!
            }
        
            type ${typePerson} implements Reviewer {
                name: String!
                reputation: Int!
                id: Int @unique
                reviewerId: Int @unique
                movies: [${typeMovie}!]! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
            }
            
            type ${typeInfluencer} implements Reviewer {
                reputation: Int!
                url: String!
                reviewerId: Int
            }
            
            union Director = ${typePerson} | ${typeActor}
            
            interface Reviewer {
                reputation: Int!
                reviewerId: Int

            }
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

            wsClient = new WebSocketTestClient(server.wsPath);
        });

        afterEach(async () => {
            await wsClient.close();
            const session = driver.session();
            await cleanNodes(session, [typeActor, typeMovie, typePerson, typeInfluencer]);
            await server.close();
        });

        const movieSubscriptionQuery = ({ typeMovie, typePerson, typeInfluencer }) => `
        subscription SubscriptionMovie {
            ${typeMovie.operations.subscribe.relationship_created} {
                relationshipFieldName
                event
                ${typeMovie.operations.subscribe.payload.relationship_created} {
                    title
                }
                createdRelationship {
                    reviewers {
                        score
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                            }
                            ... on ${typeInfluencer.name}EventPayload {
                                url
                            }
                            reputation
                        }
                    }
                    actors {
                        screenTime
                        node {
                            name
                        }
                    }
                    directors {
                        year
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                                reputation
                            }
                            ... on ${typeActor.name}EventPayload {
                                name
                            }
                        }
                    }
                }
            }
        }
        `;

        test("authentication pass - create", async () => {
            wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
            await wsClient.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

            const result = await supertest(server.path)
                .post("")
                .send({
                    query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    actors: {
                                        create: [
                                            {
                                            node: {
                                                name: "Keanu"
                                            },
                                            edge: {
                                                screenTime: 1000
                                            }
                                        }
                                    ]
                                    },
                                    title: "Matrix",
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

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toIncludeSameMembers([
                {
                    [typeMovie.operations.subscribe.relationship_created]: {
                        [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                        event: "CREATE_RELATIONSHIP",
                        relationshipFieldName: "actors",
                        createdRelationship: {
                            actors: {
                                screenTime: 1000,
                                node: {
                                    name: "Keanu",
                                },
                            },
                            directors: null,
                            reviewers: null,
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });

        test("unauthenticated subscription does not send events - create", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

            const result = await supertest(server.path)
                .post("")
                .send({
                    query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    actors: {
                                        create: [
                                            {
                                            node: {
                                                name: "Keanu"
                                            },
                                            edge: {
                                                screenTime: 1000
                                            }
                                        }
                                    ]
                                    },
                                    title: "Matrix",
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

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error, request not authenticated" })]);
        });

        test("authentication pass - create_relationship", async () => {
            await supertest(server.path)
                .post("")
                .send({
                    query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1
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

            wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
            await wsClient.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

            const result = await supertest(server.path)
                .post("")
                .send({
                    query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                            {
                              name: "Keanu",
                              movies: {
                                connect: [
                                  {
                                    where: {
                                      node: {
                                        title: "Matrix",
                                        imdbId: 1
                                      }
                                    },
                                    edge: {
                                      screenTime: 250
                                    },
                                  }
                                ]
                              }
                            }
                        ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
                })
                .expect(200);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toIncludeSameMembers([
                {
                    [typeMovie.operations.subscribe.relationship_created]: {
                        [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                        event: "CREATE_RELATIONSHIP",
                        relationshipFieldName: "actors",
                        createdRelationship: {
                            actors: {
                                screenTime: 250,
                                node: {
                                    name: "Keanu",
                                },
                            },
                            directors: null,
                            reviewers: null,
                        },
                    },
                },
            ]);
            expect(wsClient.errors).toEqual([]);
        });

        test("unauthenticated subscription does not send events - create_relationship", async () => {
            await supertest(server.path)
                .post("")
                .send({
                    query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1
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

            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

            const result = await supertest(server.path)
                .post("")
                .send({
                    query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                            {
                              name: "Keanu",
                              movies: {
                                connect: [
                                  {
                                    where: {
                                      node: {
                                        title: "Matrix",
                                        imdbId: 1
                                      }
                                    },
                                    edge: {
                                      screenTime: 250
                                    },
                                  }
                                ]
                              }
                            }
                        ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
                })
                .expect(200);

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
