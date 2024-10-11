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
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("Subscription authentication", () => {
    const testHelper = new TestHelper({ cdc: true });
    let typeMovie: UniqueType;
    let jwtToken: string;
    const secret = "secret";

    beforeAll(() => {
        jwtToken = createBearerToken(secret, { roles: ["admin"] });
    });

    describe("auth without operations", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            typeMovie = testHelper.createUniqueType("Movie");

            const typeDefs = `
            type ${typeMovie} @node {
                title: String!
            }

            extend type ${typeMovie} @authentication
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
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
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await server.close();
            await testHelper.close();
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
            await wsClient.waitForEvents(1);
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
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
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

            await wsClient.waitForEvents(1);
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
        });

        test("authentication fails with wrong secret", async () => {
            const badJwtToken = createBearerToken("wrong-secret", { roles: ["admin"] });
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
            await wsClient.waitForEvents(1);
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
        });
    });

    describe("auth with subscribe operations - SUBSCRIBE rule", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            typeMovie = testHelper.createUniqueType("Movie");

            const typeDefs = `
            type ${typeMovie} @node {
                title: String!
            }

            extend type ${typeMovie} @authentication(operations: [SUBSCRIBE])
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
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
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await testHelper.close();
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
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
        });
    });

    describe("auth with subscribe operations - SUBSCRIBE and READ rules", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            typeMovie = testHelper.createUniqueType("Movie");
            const typeDefs = `
            type JwtPayload @jwt {
                permissions: [String!]!
            }

            type ${typeMovie} @authentication(operations: [SUBSCRIBE]) @node {
                title: String! @authentication(operations: [READ], jwt: { permissions_INCLUDES: "r" })
            }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: await testHelper.getSubscriptionEngine(),
                },
            });

            const token = createBearerToken(secret, { permissions: ["r"] });
            // eslint-disable-next-line @typescript-eslint/require-await
            server = new ApolloTestServer(neoSchema, async () => ({
                token,
                sessionConfig: {
                    database: testHelper.database,
                },
            }));
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await testHelper.close();
            await server.close();
        });

        test("authentication pass", async () => {
            const token = createBearerToken(secret, { permissions: ["r"] });
            wsClient = new WebSocketTestClient(server.wsPath, token);
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
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
        });

        test("authenticated subscription does not send events if one rule not matched", async () => {
            const token = createBearerToken(secret);
            wsClient = new WebSocketTestClient(server.wsPath, token);
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
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
        });
    });

    describe("auth with subscribe operations on field", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            typeMovie = testHelper.createUniqueType("Movie");
            const typeDefs = `
            type ${typeMovie} @node {
                title: String! 
                name: String @authentication(operations: [READ])
            }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: await testHelper.getSubscriptionEngine(),
                },
            });

            // eslint-disable-next-line @typescript-eslint/require-await
            server = new ApolloTestServer(neoSchema, async ({ req }) => ({
                token: req.headers.authorization,
                sessionConfig: {
                    database: testHelper.database,
                },
            }));
            await server.start();
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await testHelper.close();
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

        test("unauthenticated subscription sends events if authenticated field is not selected", async () => {
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
            expect(wsClient.events).toHaveLength(1);
            expect(wsClient.errors).toEqual([]);
        });

        test("unauthenticated subscription does not send events if authenticated field is selected", async () => {
            wsClient = new WebSocketTestClient(server.wsPath);
            await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                name
                            }
                        }
                    }
                    `);

            const result = await createMovie("movie1", server);

            expect(result.body.errors).toBeUndefined();
            expect(wsClient.events).toEqual([]);
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
        });
    });

    describe("auth with subscribe operations on schema", () => {
        describe("READ rule", () => {
            let server: TestGraphQLServer;
            let wsClient: WebSocketTestClient;

            beforeAll(async () => {
                typeMovie = testHelper.createUniqueType("Movie");
                const typeDefs = `
                type ${typeMovie} @node {
                    title: String! 
                    name: String 
                }
                extend schema @authentication(operations: [READ])
                `;

                const neoSchema = await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
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
            });

            afterEach(async () => {
                await wsClient.close();
            });

            afterAll(async () => {
                await server.close();
                await testHelper.close();
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

            test("unauthenticated subscription does not send events", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
                        subscription {
                            ${typeMovie.operations.subscribe.created} {
                                ${typeMovie.operations.subscribe.payload.created} {
                                    name
                                }
                            }
                        }
                        `);

                const result = await createMovie("movie1", server);

                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
        });
        describe("SUBSCRIBE rule", () => {
            let server: TestGraphQLServer;
            let wsClient: WebSocketTestClient;

            beforeAll(async () => {
                typeMovie = testHelper.createUniqueType("Movie");

                const typeDefs = `
                type ${typeMovie} @node {
                    title: String!
                }
    
                extend schema @authentication(operations: [SUBSCRIBE])
                `;

                const neoSchema = await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
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
            });

            afterEach(async () => {
                await wsClient.close();
            });

            afterAll(async () => {
                await server.close();
                await testHelper.close();
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
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
        });
    });

    describe("auth with subscribe operations - READ rules", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;
        let typeDefs: string;
        let typeMovie: UniqueType;
        let typeActor: UniqueType;
        let typePerson: UniqueType;
        let typeInfluencer: UniqueType;

        beforeEach(async () => {
            typeActor = testHelper.createUniqueType("Actor");
            typeMovie = testHelper.createUniqueType("Movie");
            typePerson = testHelper.createUniqueType("Person");
            typeInfluencer = testHelper.createUniqueType("Influencer");
            typeDefs = `
            type ${typeMovie} @node {
                title: String! @authentication(operations: [READ])
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            } 
            
            type ${typeActor} @authentication(operations: [READ]) @node {
                name: String!
                id: Int @unique
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
            
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
            
            type Directed @relationshipProperties {
                year: Int!
            }
            
            type Review @relationshipProperties {
                score: Int!
            }
        
            type ${typePerson} implements Reviewer  @node {
                name: String! 
                reputation: Int! @authentication(operations: [READ])
                id: Int @unique 
                reviewerId: Int @unique @authentication(operations: [READ])
                movies: [${typeMovie}!]! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
            }
            
            type ${typeInfluencer} implements Reviewer @authentication(operations: [READ]) @node {
                reputation: Int! @authentication(operations: [READ])
                url: String!
                reviewerId: Int
            }
            
            union Director = ${typePerson} | ${typeActor}
            
            interface Reviewer {
                reputation: Int! 
                reviewerId: Int

            }
        `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: await testHelper.getSubscriptionEngine(),
                },
            });

            // eslint-disable-next-line @typescript-eslint/require-await
            server = new ApolloTestServer(neoSchema, async () => ({
                token: jwtToken,
                sessionConfig: {
                    database: testHelper.database,
                },
            }));
            await server.start();

            wsClient = new WebSocketTestClient(server.wsPath);
        });

        afterEach(async () => {
            await wsClient.close();
            await testHelper.close();
            await server.close();
        });

        describe("standard type", () => {
            test("authentication pass - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.created} {
                    event
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `);

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

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typeMovie.operations.subscribe.created]: {
                            [typeMovie.operations.subscribe.payload.created]: { title: "Matrix" },
                            event: "CREATE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });

            test("unauthenticated subscription sends events if authenticated field is not selected - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.created} {
                    event
                    ${typeMovie.operations.subscribe.payload.created} {
                        imdbId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                imdbId
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toHaveLength(1);
                expect(wsClient.errors).toEqual([]);
            });

            test("unauthenticated subscription does not send events if authenticated field is selected - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.created} {
                    event
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
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

                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
                expect(wsClient.events).toEqual([]);
                expect(result.body.errors).toBeUndefined();
            });

            test("unauthenticated subscription does not send events - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionActor {
                ${typeActor.operations.subscribe.created} {
                    event
                    ${typeActor.operations.subscribe.payload.created} {
                        name
                    }
                }
            }
            `);

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
                                imdbId
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });

            test("authentication pass - update", async () => {
                await supertest(server.path)
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

                wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.updated} {
                    event
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                    previousState {
                        title
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title_EQ: "Matrix",
                            }
                            update: {
                                title: "Matrix 2"
                            }
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

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typeMovie.operations.subscribe.updated]: {
                            [typeMovie.operations.subscribe.payload.updated]: { title: "Matrix 2" },
                            previousState: { title: "Matrix" },
                            event: "UPDATE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });

            test("unauthenticated subscription sends events if authenticated field is not selected- update", async () => {
                await supertest(server.path)
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
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.updated} {
                    event
                    ${typeMovie.operations.subscribe.payload.updated} {
                        imdbId
                    }
                    previousState {
                        imdbId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title_EQ: "Matrix",
                            }
                            update: {
                                title: "Matrix 2"
                            }
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

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typeMovie.operations.subscribe.updated]: {
                            [typeMovie.operations.subscribe.payload.updated]: { imdbId: 1 },
                            previousState: { imdbId: 1 },
                            event: "UPDATE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });

            test("unauthenticated subscription does not send events if authenticated field is selected in previousState - update", async () => {
                await supertest(server.path)
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
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.updated} {
                    event
                    ${typeMovie.operations.subscribe.payload.updated} {
                        imdbId
                    }
                    previousState {
                        title
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title_EQ: "Matrix",
                            }
                            update: {
                                title: "Matrix 2"
                            }
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

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });

            test("unauthenticated subscription does not send events if authenticated field is selected- update", async () => {
                await supertest(server.path)
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
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.updated} {
                    event
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                    previousState {
                        imdbId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title_EQ: "Matrix",
                            }
                            update: {
                                title: "Matrix 2"
                            }
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

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });

            test("unauthenticated subscription does not send events - update", async () => {
                await supertest(server.path)
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
                                imdbId
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionActor {
                ${typeActor.operations.subscribe.created} {
                    event
                    ${typeActor.operations.subscribe.payload.created} {
                        name
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeActor.operations.update}(
                            where: {
                                name_EQ: "Keanu"
                            },
                            update: {
                                name: "Keanu Reeves"
                            }
                        ) {
                            info {
                                nodesCreated
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });

            test("authentication pass - delete", async () => {
                await supertest(server.path)
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

                wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.deleted} {
                    event
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.delete}(
                            where: {
                                title_EQ: "Matrix",
                            }
                        ) {
                             nodesDeleted
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typeMovie.operations.subscribe.deleted]: {
                            [typeMovie.operations.subscribe.payload.deleted]: { title: "Matrix" },
                            event: "DELETE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });

            test("unauthenticated subscription sends events if authenticated field is not selected - delete", async () => {
                await supertest(server.path)
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
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.deleted} {
                    event
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        imdbId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.delete}(
                            where: {
                                title_EQ: "Matrix",
                            }
                        ) {
                             nodesDeleted
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typeMovie.operations.subscribe.deleted]: {
                            [typeMovie.operations.subscribe.payload.deleted]: { imdbId: 1 },
                            event: "DELETE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });

            test("unauthenticated subscription does not send events if authenticated field is selected - delete", async () => {
                await supertest(server.path)
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

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.deleted} {
                    event
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.delete}(
                            where: {
                                title_EQ: "Matrix",
                            }
                        ) {
                             nodesDeleted
                        }
                    }
                `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toIncludeSameMembers([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });

            test("unauthenticated subscription does not send events - delete", async () => {
                await supertest(server.path)
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
                                imdbId
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionActor {
                ${typeActor.operations.subscribe.deleted} {
                    event
                    ${typeActor.operations.subscribe.payload.deleted} {
                        name
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title_EQ: "Matrix"
                            },
                            delete: {
                                actors: {
                                    where: {
                                        node: {
                                            name_EQ: "Keanu"
                                        }
                                    }
                                }
                            }  
                        ) {
                            info {
                                nodesDeleted
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
        });

        describe("interface type", () => {
            test("authentication pass - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

                await wsClient.subscribe(`
            subscription SubscriptionPerson {
                ${typePerson.operations.subscribe.created} {
                    event
                    ${typePerson.operations.subscribe.payload.created} {
                        name
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Bob",
                                                        reputation: 10
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typePerson.operations.subscribe.created]: {
                            [typePerson.operations.subscribe.payload.created]: { name: "Bob" },
                            event: "CREATE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription sends events if authenticated field is not selected - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionPerson {
                ${typePerson.operations.subscribe.created} {
                    event
                    ${typePerson.operations.subscribe.payload.created} {
                        name
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                            mutation {
                                ${typeMovie.operations.create}(
                                    input: [
                                        {
                                            reviewers: {
                                                create: [
                                                    {
                                                        node: {
                                                            ${typePerson.name}: {
                                                                name: "Bob",
                                                                reputation: 100
                                                            }
                                                        },
                                                        edge: {
                                                            score: 10
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
                                        reviewers {
                                            reputation
                                            #... on Influencer {
                                           #     url
                                           # }
                                            ... on ${typePerson.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toHaveLength(1);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription does not send events if authenticated field is selected - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionPerson {
                ${typePerson.operations.subscribe.created} {
                    event
                    ${typePerson.operations.subscribe.payload.created} {
                        reviewerId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                            mutation {
                                ${typeMovie.operations.create}(
                                    input: [
                                        {
                                            reviewers: {
                                                create: [
                                                    {
                                                        node: {
                                                            ${typePerson.name}: {
                                                                name: "Bob",
                                                                reputation: 100
                                                            }
                                                        },
                                                        edge: {
                                                            score: 10
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
                                        reviewers {
                                            ... on ${typePerson.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
            test("unauthenticated subscription does not send events - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
                    subscription SubscriptionPerson {
                        ${typeInfluencer.operations.subscribe.created} {
                            event
                            ${typeInfluencer.operations.subscribe.payload.created} {
                                url
                            }
                        }
                    }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                            mutation {
                                ${typeMovie.operations.create}(
                                    input: [
                                        {
                                            reviewers: {
                                                create: [
                                                    {
                                                        node: {
                                                            ${typeInfluencer.name}: {
                                                                url: "/bob",
                                                                reputation: 100
                                                            }
                                                        },
                                                        edge: {
                                                            score: 10
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
                                        reviewers {
                                            reputation
                                            ... on ${typePerson.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });

            test("authentication pass - update", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Bob",
                                                        reputation: 10,
                                                        reviewerId: 1
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typePerson.operations.subscribe.updated} {
                    event
                    ${typePerson.operations.subscribe.payload.updated} {
                        name
                    }
                    previousState {
                        name
                        reviewerId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typePerson.operations.update}(
                            where: {
                                name_EQ: "Bob"
                            }
                            update: {
                                name: "John"
                            }
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typePerson.operations.subscribe.updated]: {
                            [typePerson.operations.subscribe.payload.updated]: { name: "John" },
                            previousState: { name: "Bob", reviewerId: 1 },
                            event: "UPDATE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription sends events if authenticated field is not selected- update", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Bob",
                                                        reputation: 10,
                                                        reviewerId: 1
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typePerson.operations.subscribe.updated} {
                    event
                    ${typePerson.operations.subscribe.payload.updated} {
                        name
                    }
                    previousState {
                        name
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typePerson.operations.update}(
                            where: {
                                name_EQ: "Bob"
                            }
                            update: {
                                name: "John"
                            }
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typePerson.operations.subscribe.updated]: {
                            [typePerson.operations.subscribe.payload.updated]: { name: "John" },
                            previousState: { name: "Bob" },
                            event: "UPDATE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription does not send events if authenticated field is selected - update", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Bob",
                                                        reputation: 10,
                                                        reviewerId: 1
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typePerson.operations.subscribe.updated} {
                    event
                    ${typePerson.operations.subscribe.payload.updated} {
                        name
                    }
                    previousState {
                        name
                        reviewerId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typePerson.operations.update}(
                            where: {
                                name_EQ: "Bob"
                            }
                            update: {
                                name: "John"
                            }
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
            test("unauthenticated subscription does not send events - update", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob",
                                                        reputation: 1,
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeInfluencer.operations.subscribe.updated} {
                    event
                    ${typeInfluencer.operations.subscribe.payload.updated} {
                        url
                    }
                    previousState {
                        url
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeInfluencer.operations.update}(
                            where: {
                                url_EQ: "/bob"
                            }
                            update: {
                               url: "/john"
                            }
                        ) {
                            ${typeInfluencer.plural} {
                                url
                            }
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });

            test("authentication pass - delete", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob",
                                                        reputation: 1,
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeInfluencer.operations.subscribe.deleted} {
                    event
                    ${typeInfluencer.operations.subscribe.payload.deleted} {
                       reputation
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeInfluencer.operations.delete}(
                            where: {
                                url_EQ: "/bob"
                            }
                        ) {
                            nodesDeleted
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typeInfluencer.operations.subscribe.deleted]: {
                            [typeInfluencer.operations.subscribe.payload.deleted]: { reputation: 1 },
                            event: "DELETE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription sends events if authenticated field is not selected - delete", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Bob",
                                                        reputation: 10,
                                                        reviewerId: 1
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typePerson.operations.subscribe.deleted} {
                    event
                    ${typePerson.operations.subscribe.payload.deleted} {
                       name
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typePerson.operations.delete}(
                            where: {
                                name_EQ: "Bob"
                            }
                        ) {
                            nodesDeleted
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typePerson.operations.subscribe.deleted]: {
                            [typePerson.operations.subscribe.payload.deleted]: { name: "Bob" },
                            event: "DELETE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription does not send events if authenticated field is selected - delete", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Bob",
                                                        reputation: 10,
                                                        reviewerId: 1
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typePerson.operations.subscribe.deleted} {
                    event
                    ${typePerson.operations.subscribe.payload.deleted} {
                       reviewerId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typePerson.operations.delete}(
                            where: {
                                name_EQ: "Bob"
                            }
                        ) {
                            nodesDeleted
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
            test("unauthenticated subscription does not send events - delete", async () => {
                await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    reviewers: {
                                        create: [
                                            {
                                                node: {
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob",
                                                        reputation: 1,
                                                    }
                                                },
                                                edge: {
                                                    score: 10
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

                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionMovie {
                ${typeInfluencer.operations.subscribe.deleted} {
                    event
                    ${typeInfluencer.operations.subscribe.payload.deleted} {
                       url
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeInfluencer.operations.delete}(
                            where: {
                                url_EQ: "/bob"
                            }
                        ) {
                            nodesDeleted
                        }
                    }
                `,
                    })
                    .expect(200);

                expect(result.body.errors).toBeUndefined();

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
        });

        describe("union type", () => {
            test("authentication pass - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

                await wsClient.subscribe(`
            subscription SubscriptionPerson {
                ${typePerson.operations.subscribe.created} {
                    event
                    ${typePerson.operations.subscribe.payload.created} {
                        name
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    directors: {
                                        ${typePerson.name}: {
                                            create: [
                                                {
                                                    node: {
                                                        name: "Bob",
                                                        reputation: 10
                                                    },
                                                    edge: {
                                                        year: 2020
                                                    }
                                                }
                                            ]
                                        }
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

                await wsClient.waitForEvents(1);

                expect(wsClient.events).toIncludeSameMembers([
                    {
                        [typePerson.operations.subscribe.created]: {
                            [typePerson.operations.subscribe.payload.created]: { name: "Bob" },
                            event: "CREATE",
                        },
                    },
                ]);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription sends events if authenticated field is not selected - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
                    subscription SubscriptionPerson {
                        ${typePerson.operations.subscribe.created} {
                            event
                            ${typePerson.operations.subscribe.payload.created} {
                                name
                            }
                        }
                    }
                    `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                            mutation {
                                ${typeMovie.operations.create}(
                                    input: [
                                        {
                                            directors: {
                                                ${typePerson.name}: {
                                                    create: [
                                                        {
                                                            node: {
                                                                name: "Bob",
                                                                reputation: 10
                                                            },
                                                            edge: {
                                                                year: 2020
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            title: "Matrix",
                                        }
                                    ]
                                ) {
                                    ${typeMovie.plural} {
                                        title
                                        directors {
                                            ... on ${typePerson.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toHaveLength(1);
                expect(wsClient.errors).toEqual([]);
            });
            test("unauthenticated subscription does not send events if authenticated field is selected - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
            subscription SubscriptionPerson {
                ${typePerson.operations.subscribe.created} {
                    event
                    ${typePerson.operations.subscribe.payload.created} {
                        reviewerId
                    }
                }
            }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                            mutation {
                                ${typeMovie.operations.create}(
                                    input: [
                                        {
                                            directors: {
                                                ${typePerson.name}: {
                                                    create: [
                                                        {
                                                            node: {
                                                                name: "Bob",
                                                                reputation: 10
                                                            },
                                                            edge: {
                                                                year: 2020
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            title: "Matrix",
                                        }
                                    ]
                                ) {
                                    ${typeMovie.plural} {
                                        title
                                        directors {
                                            ... on ${typePerson.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
            test("unauthenticated subscription does not send events - create", async () => {
                wsClient = new WebSocketTestClient(server.wsPath);
                await wsClient.subscribe(`
                    subscription SubscriptionPerson {
                        ${typeActor.operations.subscribe.created} {
                            event
                            ${typeActor.operations.subscribe.payload.created} {
                                name
                            }
                        }
                    }
            `);

                const result = await supertest(server.path)
                    .post("")
                    .send({
                        query: `
                            mutation {
                                ${typeMovie.operations.create}(
                                    input: [
                                        {
                                            directors: {
                                                ${typeActor.name}: {
                                                    create: [
                                                        {
                                                            node: {
                                                                name: "Bob",
                                                            },
                                                            edge: {
                                                                year: 2020
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            title: "Matrix",
                                        }
                                    ]
                                ) {
                                    ${typeMovie.plural} {
                                        title
                                        directors {
                                            ... on ${typePerson.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                    })
                    .expect(200);

                await wsClient.waitForEvents(1);
                expect(result.body.errors).toBeUndefined();
                expect(wsClient.events).toEqual([]);
                expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
            });
        });
    });

    describe("auth with multiple rules with different operations", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            typeMovie = testHelper.createUniqueType("Movie");
            const typeDefs = `
            type ${typeMovie} @node {
                title: String!
            }

            extend type ${typeMovie} @authentication(operations: [SUBSCRIBE])
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
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
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await testHelper.close();
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
            expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
        });
    });

    describe("auth without subscribe operations", () => {
        let server: TestGraphQLServer;
        let wsClient: WebSocketTestClient;

        beforeAll(async () => {
            typeMovie = testHelper.createUniqueType("Movie");
            const typeDefs = `
            type ${typeMovie} @node {
                title: String!
            }

            extend type ${typeMovie} @authentication(operations: [CREATE])
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
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
        });

        afterEach(async () => {
            await wsClient.close();
        });

        afterAll(async () => {
            await testHelper.close();
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
