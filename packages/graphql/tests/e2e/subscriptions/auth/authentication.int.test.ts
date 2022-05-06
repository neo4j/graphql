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

describe("Subscription auth", () => {
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let jwtToken: string;

    beforeAll(async () => {
        jwtToken = createJwtHeader("secret", { roles: ["admin"] });
        const typeDefs = `
         type ${typeMovie} {
             title: String!
         }

         extend type ${typeMovie} @auth(rules: [{ isAuthenticated: true }])
         `;

        driver = await neo4j();

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

        const result = await createMovie("movie1");

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

    test("authentication fails", async () => {
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

        const result = await createMovie("movie1");

        expect(result.body.errors).toBeUndefined();
        expect(wsClient.events).toEqual([]);
        expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Error" })]);
    });

    async function createMovie(title: string): Promise<Response> {
        const result = await supertest(server.path)
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
