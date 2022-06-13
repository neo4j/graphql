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

import { Driver } from "neo4j-driver";
import supertest, { Response } from "supertest";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType } from "../../../utils/graphql-types";
import { ApolloTestServer, TestGraphQLServer } from "../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../setup/ws-client";
import neo4j from "../../setup/neo4j";
import { createJwtHeader } from "../../../utils/create-jwt-request";

describe("Subscription auth where", () => {
    const typeMovie = generateUniqueType("Movie");
    const typeUser = generateUniqueType("User");

    let driver: Driver;
    let jwtToken: string;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        jwtToken = createJwtHeader("secret", { title: "movie2" });
        driver = await neo4j();
        const typeDefs = `
            type ${typeMovie} {
                title: String!
            }
            type ${typeUser} {
                name: String!
            }

            extend type ${typeUser} @auth(rules: [{ operations: [SUBSCRIBE], where: { name: "arthur" } }])
            extend type ${typeMovie} @auth(rules: [{ operations: [SUBSCRIBE], where: { title: "$jwt.title" } }])
            `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
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
        await driver.close();
    });

    test("only return events matching the static where statement", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
        await wsClient.subscribe(`
            subscription {
                ${typeUser.operations.subscribe.created} {
                    ${typeUser.operations.subscribe.payload.created} {
                        name
                    }
                }
            }
            `);

        await createUser("user1");
        await createUser("arthur");

        expect(wsClient.events).toEqual([
            {
                [typeUser.operations.subscribe.created]: {
                    [typeUser.operations.subscribe.payload.created]: {
                        name: "arthur",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);
    });

    test("only return events matching the jwt where statement", async () => {
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

        await createMovie("movie1");
        await createMovie("movie2");

        expect(wsClient.events).toEqual([
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

    async function createMovie(title: string): Promise<Response> {
        return server.runQuery({
            query: `mutation {
                        ${typeMovie.operations.create}(input: [{ title: "${title}" }]) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }`,
            jwtToken,
        });
    }

    async function createUser(name: string): Promise<Response> {
        return server.runQuery({
            query: `mutation {
                    ${typeUser.operations.create}(input: [{ name: "${name}" }]) {
                        ${typeUser.plural} {
                            name
                        }
                    }
                }`,
            jwtToken,
        });
    }
});
