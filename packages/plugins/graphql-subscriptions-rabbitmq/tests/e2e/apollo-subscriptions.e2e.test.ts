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
// import { Neo4jGraphQL } from "../../../src/classes";
// import { generateUniqueType } from "../../utils/graphql-types";
import { ApolloTestServer, TestGraphQLServer } from "./setup/apollo-server";
import { WebSocketTestClient } from "./setup/ws-client";
import neo4j from "./setup/neo4j";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { Neo4jGraphQLSubscriptionsRabbitMQ } from "../../src";
import { generateUniqueType } from "../utils/graphql-types";
import createPlugin from "./setup/plugin";

describe("Apollo and RabbitMQ Subscription", () => {
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    let plugin: Neo4jGraphQLSubscriptionsRabbitMQ;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        plugin = await createPlugin();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: plugin,
            },
        });

        server = new ApolloTestServer(neoSchema);
        await server.start();
        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await plugin.close();
        await plugin.connection?.close();
        await server.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("create subscription", async () => {
        await wsClient.subscribe(`
                            subscription {
                                ${typeMovie.operations.subscribe.created} {
                                    ${typeMovie.operations.subscribe.payload.created} {
                                        title
                                    }
                                    event
                                }
                            }
                            `);

        createMovie("movie1"); // Note, this is not awaited on purpose
        await wsClient.waitForNextEvent();
        createMovie("movie2"); // Note, this is not awaited on purpose
        await wsClient.waitForNextEvent();

        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                    event: "CREATE",
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.fieldNames.subscriptions.created]: { title: "movie2" },
                    event: "CREATE",
                },
            },
        ]);
    });

    test("create subscription with where", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: "movie1" }) {
                    ${typeMovie.fieldNames.subscriptions.created} {
                        title
                    }
                }
            }
        `);

        createMovie("movie2"); // Note, this is not awaited on purpose
        createMovie("movie1"); // Note, this is not awaited on purpose
        await wsClient.waitForNextEvent();

        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.fieldNames.subscriptions.created]: { title: "movie1" },
                },
            },
        ]);
    });

    async function createMovie(title: string): Promise<Response> {
        const result = await supertest(server.path)
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
        return result;
    }
});
