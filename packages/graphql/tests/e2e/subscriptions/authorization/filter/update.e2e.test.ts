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
import { Neo4jGraphQL } from "../../../../../src/classes";
import { UniqueType } from "../../../../utils/graphql-types";
import type { TestGraphQLServer } from "../../../setup/apollo-server";
import { ApolloTestServer } from "../../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../../setup/ws-client";
import Neo4j from "../../../setup/neo4j";
import { createJwtHeader } from "../../../../utils/create-jwt-request";

describe("Subscriptions authorization with update events", () => {
    let neo4j: Neo4j;
    let driver: Driver;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let User: UniqueType;
    let key: string;

    beforeEach(async () => {
        key = "secret";

        User = new UniqueType("User");

        const typeDefs = `#graphql
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${User}
                @subscriptionsAuthorization(
                    filter: [
                        { where: { node: { id: "$jwt.sub" }, jwt: { roles_INCLUDES: "user" } } }
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                ) {
                id: ID!
            }
        `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: new TestSubscriptionsPlugin(),
            },
            features: {
                authorization: { key },
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: {
                database: neo4j.getIntegrationDatabaseName(),
            },
            token: req.headers.authorization,
        }));
        await server.start();
    });

    afterEach(async () => {
        await wsClient.close();

        await server.close();
        await driver.close();
    });

    test("authorization filters out user without matching id", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", roles: ["user"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.updated} {
                    ${User.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");

        await updateUser("user1", "user1-new");
        await updateUser("user2", "user2-new");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [User.operations.subscribe.updated]: {
                    [User.operations.subscribe.payload.updated]: { id: "user1-new" },
                },
            },
        ]);
    });

    test("returns nothing with wrong role", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", roles: ["wrong"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.updated} {
                    ${User.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");

        await updateUser("user1", "user1-new");
        await updateUser("user2", "user2-new");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test("returns both events with admin role", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", roles: ["admin"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.updated} {
                    ${User.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");

        await updateUser("user1", "user1-new");
        await updateUser("user2", "user2-new");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [User.operations.subscribe.updated]: {
                    [User.operations.subscribe.payload.updated]: { id: "user1-new" },
                },
            },
            {
                [User.operations.subscribe.updated]: {
                    [User.operations.subscribe.payload.updated]: { id: "user2-new" },
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

    async function updateUser(id1: string, id2: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${User.operations.update}(where: { id: "${id1}" }, update: { id: "${id2}" }) {
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
