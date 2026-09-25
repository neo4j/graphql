/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Response } from "supertest";
import supertest from "supertest";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { createJwtHeader } from "../../../utils/create-jwt-header";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

const secret = "secret";

function waitForMaybeEvent(wsClient: WebSocketTestClient): Promise<void> {
    return wsClient.waitForEvents(1).catch(() => undefined);
}

describe("Subscription authentication with @authentication(SUBSCRIBE)", () => {
    const testHelper = new TestHelper({ cdc: true });
    let typeMovie: UniqueType;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        await testHelper.assertCDCEnabled();

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${typeMovie} @node @subscription {
                title: String!
            }

            extend type ${typeMovie} @authentication(operations: [SUBSCRIBE], jwt: { roles: { includes: "admin" } })
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
                subscriptions: await testHelper.getSubscriptionEngine(),
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: { database: testHelper.database },
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

    test("a validly signed admin token receives the event", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, createBearerToken(secret, { roles: ["admin"] }));
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: { eq: "admin-token-movie" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie("admin-token-movie");
        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "admin-token-movie" },
                },
            },
        ]);
    });

    test("a forged connectionParams.jwt with admin roles receives no event", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, undefined, { jwt: { roles: ["admin"] } });
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created} {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie("forged-jwt-movie");
        await waitForMaybeEvent(wsClient);

        expect(wsClient.events).toEqual([]);
        expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
    });

    test("a wrong-key token receives no event", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, createBearerToken("wrong-secret", { roles: ["admin"] }));
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created} {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie("wrong-key-movie");
        await waitForMaybeEvent(wsClient);

        expect(wsClient.events).toEqual([]);
        expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
    });

    test("no credentials receives no event", async () => {
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

        await createMovie("no-credentials-movie");
        await waitForMaybeEvent(wsClient);

        expect(wsClient.events).toEqual([]);
        expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
    });

    async function createMovie(title: string): Promise<Response> {
        return supertest(server.path)
            .post("")
            .set("authorization", createBearerToken(secret, { roles: ["admin"] }))
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
    }
});

describe("Subscription authorization with a $jwt.sub filter", () => {
    const testHelper = new TestHelper({ cdc: true });
    let User: UniqueType;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        await testHelper.assertCDCEnabled();

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${User}
                @node
                @subscription
                @subscriptionsAuthorization(filter: [{ where: { node: { id: { eq: "$jwt.sub" } } } }]) {
                id: ID!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
                subscriptions: await testHelper.getSubscriptionEngine(),
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: { database: testHelper.database },
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

    test("a forged connectionParams.jwt does not satisfy the $jwt.sub filter", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, undefined, { jwt: { sub: "forged-user" } });
        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.created} {
                    ${User.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
        `);

        await createUser("forged-user");
        await createUser("other-user");
        await waitForMaybeEvent(wsClient);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test("a validly signed token with a matching sub receives the matching event", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, createJwtHeader(secret, { sub: "user1" }));
        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.created} {
                    ${User.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");
        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [User.operations.subscribe.created]: {
                    [User.operations.subscribe.payload.created]: { id: "user1" },
                },
            },
        ]);
    });

    async function createUser(id: string): Promise<Response> {
        return supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${User.operations.create}(input: [{ id: "${id}" }]) {
                            ${User.plural} {
                                id
                            }
                        }
                    }
                `,
            })
            .expect(200);
    }
});

describe("Subscription authorization with a $context.connectionParams filter", () => {
    const testHelper = new TestHelper({ cdc: true });
    let typeMovie: UniqueType;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        await testHelper.assertCDCEnabled();

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${typeMovie}
                @node
                @subscription
                @subscriptionsAuthorization(
                    filter: [
                        {
                            requireAuthentication: false
                            where: { node: { title: { eq: "$context.connectionParams.allowedTitle" } } }
                        }
                    ]
                ) {
                title: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
                subscriptions: await testHelper.getSubscriptionEngine(),
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: { database: testHelper.database },
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

    // A $context.connectionParams operand on a public (requireAuthentication: false) rule intentionally
    // resolves against client-supplied connection params and is evaluated as configured.
    test("a client-supplied $context.connectionParams operand filters as configured", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, undefined, { allowedTitle: "movie1" });
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created} {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie("movie1");
        await createMovie("movie2");
        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });

    async function createMovie(title: string): Promise<Response> {
        return supertest(server.path)
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
    }
});

describe("Subscription authentication with a developer-injected top-level context.jwt", () => {
    const testHelper = new TestHelper({ cdc: true });
    let typeMovie: UniqueType;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        await testHelper.assertCDCEnabled();

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${typeMovie} @node @subscription {
                title: String!
            }

            extend type ${typeMovie} @authentication(operations: [SUBSCRIBE], jwt: { roles: { includes: "admin" } })
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
                subscriptions: await testHelper.getSubscriptionEngine(),
            },
        });

        server = new ApolloTestServer(
            neoSchema,
            // eslint-disable-next-line @typescript-eslint/require-await
            async ({ req }) => ({
                sessionConfig: { database: testHelper.database },
                token: req.headers.authorization,
            }),
            false,
            // The developer sets a jwt they have verified themselves on the trusted, non-client
            // top-level context channel (a sibling of connectionParams).
            (ctx) => ({ ...ctx, jwt: { roles: ["admin"] } })
        );
        await server.start();
    });

    afterEach(async () => {
        await wsClient.close();
    });

    afterAll(async () => {
        await server.close();
        await testHelper.close();
    });

    test("a developer-injected top-level context.jwt receives the event with no client credential", async () => {
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

        await createMovie("movie1");
        await waitForMaybeEvent(wsClient);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });

    async function createMovie(title: string): Promise<Response> {
        return supertest(server.path)
            .post("")
            .set("authorization", createBearerToken(secret, { roles: ["admin"] }))
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
    }
});
