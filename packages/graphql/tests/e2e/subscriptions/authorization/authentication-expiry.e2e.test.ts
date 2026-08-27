/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Response } from "supertest";
import supertest from "supertest";
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("Subscription authentication with expired token", () => {
    const testHelper = new TestHelper({ cdc: true });
    let typeMovie: UniqueType;
    let jwtToken: string;
    const secret = "secret";
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        jwtToken = createBearerToken(secret, { roles: ["admin"] });
        await testHelper.assertCDCEnabled();

        typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${typeMovie} @node @subscription {
                title: String!
            }

            extend type ${typeMovie} @authentication(operations: [SUBSCRIBE, CREATE])
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

    test("subscription sends more events if jwt did not expire", async () => {
        const expJwtToken = createBearerToken(secret, {
            roles: ["admin"],
            exp: Math.floor(Date.now() / 1000) + 30,
        }); // exp in 30s
        wsClient = new WebSocketTestClient(server.wsPath, expJwtToken);
        await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

        const movieCreatedInTime = await createMovie("movie1", server);
        expect(movieCreatedInTime.body.errors).toBeUndefined();

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

        await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for 2s

        const movieCreatedAfterExpiry = await createMovie("movie2", server);
        expect(movieCreatedAfterExpiry.body.errors).toBeUndefined();

        await wsClient.waitForEvents(1);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: {
                        title: "movie1",
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: {
                        title: "movie2",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);
    });

    test("expired jwt in subscription does not send events", async () => {
        const expJwtToken = createBearerToken(secret, {
            roles: ["admin"],
            exp: Math.floor(Date.now() / 1000) + 10,
        }); // exp in 10s
        wsClient = new WebSocketTestClient(server.wsPath, expJwtToken);
        await wsClient.subscribe(`
                    subscription {
                        ${typeMovie.operations.subscribe.created} {
                            ${typeMovie.operations.subscribe.payload.created} {
                                title
                            }
                        }
                    }
                    `);

        const movieCreatedInTime = await createMovie("movie3", server);
        expect(movieCreatedInTime.body.errors).toBeUndefined();

        await wsClient.waitForEvents(1);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: {
                        title: "movie3",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);

        await new Promise((resolve) => setTimeout(resolve, 11000)); // wait for 11s to expire the token

        const movieCreatedAfterExpiry = await createMovie("movie4", server);
        expect(movieCreatedAfterExpiry.body.errors).toBeUndefined();

        await waitForMaybeEvent(wsClient);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: {
                        title: "movie3",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);
    });

    async function createMovie(title: string, graphQLServer: TestGraphQLServer, token?: string): Promise<Response> {
        const result = await supertest(graphQLServer.path)
            .post("")
            .set("authorization", token ?? jwtToken)
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

describe("Subscription authorization with expired token", () => {
    const testHelper = new TestHelper({ cdc: true });
    let typeUser: UniqueType;
    let jwtToken: string;
    const secret = "secret";
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        jwtToken = createBearerToken(secret, { roles: ["admin"] });
        await testHelper.assertCDCEnabled();

        typeUser = testHelper.createUniqueType("User");

        const typeDefs = `
            type ${typeUser} @node @subscription {
                id: ID!
            }

            extend type ${typeUser} @subscriptionsAuthorization(filter: [
    { where: { node: { id: { eq: "$jwt.sub" } } } }
])
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

    test("subscription sends more events if jwt did not expire", async () => {
        const expJwtToken = createBearerToken(secret, {
            roles: ["admin"],
            sub: "user1",
            exp: Math.floor(Date.now() / 1000) + 30,
        }); // exp in 30s
        wsClient = new WebSocketTestClient(server.wsPath, expJwtToken);
        await wsClient.subscribe(`
                    subscription {
                        ${typeUser.operations.subscribe.created} {
                            ${typeUser.operations.subscribe.payload.created} {
                                id
                            }
                        }
                    }
                    `);

        const userCreatedInTime = await createUser("user1", server);
        expect(userCreatedInTime.body.errors).toBeUndefined();

        await wsClient.waitForEvents(1);
        expect(wsClient.events).toEqual([
            {
                [typeUser.operations.subscribe.created]: {
                    [typeUser.operations.subscribe.payload.created]: {
                        id: "user1",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);

        await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for 2s

        const userCreatedAfterExpiry = await createUser("user1", server);
        expect(userCreatedAfterExpiry.body.errors).toBeUndefined();

        await wsClient.waitForEvents(1);
        expect(wsClient.events).toEqual([
            {
                [typeUser.operations.subscribe.created]: {
                    [typeUser.operations.subscribe.payload.created]: {
                        id: "user1",
                    },
                },
            },
            {
                [typeUser.operations.subscribe.created]: {
                    [typeUser.operations.subscribe.payload.created]: {
                        id: "user1",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);
    });

    test("expired jwt in subscription does not send events", async () => {
        const expJwtToken = createBearerToken(secret, {
            roles: ["admin"],
            sub: "user1",
            exp: Math.floor(Date.now() / 1000) + 10,
        }); // exp in 10s
        wsClient = new WebSocketTestClient(server.wsPath, expJwtToken);
        await wsClient.subscribe(`
                    subscription {
                        ${typeUser.operations.subscribe.created} {
                            ${typeUser.operations.subscribe.payload.created} {
                                id
                            }
                        }
                    }
                    `);
        const userCreatedInTime = await createUser("user1", server);
        expect(userCreatedInTime.body.errors).toBeUndefined();

        await wsClient.waitForEvents(1);
        expect(wsClient.events).toEqual([
            {
                [typeUser.operations.subscribe.created]: {
                    [typeUser.operations.subscribe.payload.created]: {
                        id: "user1",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);

        await new Promise((resolve) => setTimeout(resolve, 11000)); // wait for 11s to expire the token

        const userCreatedAfterExpiry = await createUser("user1", server);
        expect(userCreatedAfterExpiry.body.errors).toBeUndefined();

        await waitForMaybeEvent(wsClient);
        expect(wsClient.events).toEqual([
            {
                [typeUser.operations.subscribe.created]: {
                    [typeUser.operations.subscribe.payload.created]: {
                        id: "user1",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);
    });

    async function createUser(id: string, graphQLServer: TestGraphQLServer): Promise<Response> {
        const result = await supertest(graphQLServer.path)
            .post("")
            .set("authorization", jwtToken)
            .send({
                query: `
                    mutation {
                        ${typeUser.operations.create}(input: [{ id: "${id}" }]) {
                            ${typeUser.plural} {
                                id
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});

function waitForMaybeEvent(wsClient: WebSocketTestClient): Promise<void> {
    return wsClient.waitForEvents(1).catch(() => undefined);
}
