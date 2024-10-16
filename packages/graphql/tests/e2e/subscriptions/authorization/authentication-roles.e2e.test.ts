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

describe("Subscription authentication roles", () => {
    const testHelper = new TestHelper({ cdc: true });

    let typeMovie: UniqueType;

    let jwtToken: string;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    let typeDefs: string;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");

        typeDefs = `
        type JWTPayload @jwt {
            roles: [String!]!
        }
        
        type ${typeMovie} @node {
            title: String!
        }
    
        extend type ${typeMovie} @authentication(operations: [SUBSCRIBE], jwt: { roles_INCLUDES: "admin" })
        `;

        jwtToken = createBearerToken("secret", { roles: ["admin"] });

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
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

    test("auth with roles pass", async () => {
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

    test("auth with one of roles pass", async () => {
        jwtToken = createBearerToken("secret", { roles: ["super-admin", "admin"] });
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

    test("auth with different role fails", async () => {
        const wrongToken = createBearerToken("secret", { roles: ["not-admin"] });
        wsClient = new WebSocketTestClient(server.wsPath, wrongToken);
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

    test("auth with role and wrong secret fails", async () => {
        const wrongToken = createBearerToken("secret2", { roles: ["admin"] });
        wsClient = new WebSocketTestClient(server.wsPath, wrongToken);
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
