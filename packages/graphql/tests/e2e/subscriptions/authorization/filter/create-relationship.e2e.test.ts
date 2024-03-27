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
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import { createJwtHeader } from "../../../../utils/create-jwt-request";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../../setup/apollo-server";
import { ApolloTestServer } from "../../../setup/apollo-server";
import { WebSocketTestClient } from "../../../setup/ws-client";

describe("Subscriptions authorization with relationship creation events", () => {
    const testHelper = new TestHelper();
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let User: UniqueType;
    let key: string;

    beforeEach(async () => {
        key = "secret";

        User = testHelper.createUniqueType("User");

        const typeDefs = `#graphql
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${User}
                @subscriptionsAuthorization(
                    filter: [
                        { where: { relationship: { follows: { node: { id: "$jwt.sub" } } }, jwt: { roles_INCLUDES: "user" } } }
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                ) {
                id: ID!
                follows: [${User}!]! @relationship(type: "FOLLOWS", direction: OUT)
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key },
                subscriptions: new Neo4jGraphQLSubscriptionsDefaultEngine(),
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

        await server.close();
        await testHelper.close();
    });

    test("authorization filters out user without matching id", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", roles: ["user"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.relationship_created} {
                    ${User.operations.subscribe.payload.relationship_created} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");

        await followUser("user2", "user1");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [User.operations.subscribe.relationship_created]: {
                    [User.operations.subscribe.payload.relationship_created]: { id: "user2" },
                },
            },
        ]);
    });

    test("returns nothing with wrong role", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", roles: ["wrong"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.relationship_created} {
                    ${User.operations.subscribe.payload.relationship_created} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");

        await followUser("user2", "user1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test("returns both events with admin role", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", roles: ["admin"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.relationship_created} {
                    ${User.operations.subscribe.payload.relationship_created} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");

        await followUser("user2", "user1");
        await followUser("user1", "user2");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [User.operations.subscribe.relationship_created]: {
                    [User.operations.subscribe.payload.relationship_created]: { id: "user2" },
                },
            },
            {
                [User.operations.subscribe.relationship_created]: {
                    [User.operations.subscribe.payload.relationship_created]: { id: "user1" },
                },
            },
        ]);
    });

    test("with user defined where", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", roles: ["user"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.relationship_created}(where: { ${User.operations.subscribe.payload.relationship_created}: { id: "user2" } }) {
                    ${User.operations.subscribe.payload.relationship_created} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");
        await createUser("user3");

        await followUser("user2", "user1");
        await followUser("user3", "user1");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [User.operations.subscribe.relationship_created]: {
                    [User.operations.subscribe.payload.relationship_created]: { id: "user2" },
                },
            },
        ]);
    });

    async function createUser(id: string): Promise<Response> {
        const result = await supertest(server.path)
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
        return result;
    }

    async function followUser(user: string, follows: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${User.operations.update}(where: { id: "${user}" }, connect: { follows: { where: { node: { id: "${follows}" } } } }) {
                            ${User.plural} {
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
