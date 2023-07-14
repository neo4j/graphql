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
import { Neo4jGraphQL } from "@neo4j/graphql";
import type { TestGraphQLServer } from "./setup/apollo-server";
import { ApolloTestServer } from "./setup/apollo-server";
import { WebSocketTestClient } from "./setup/ws-client";
import neo4j from "./setup/neo4j";
import type { Neo4jGraphQLSubscriptionsAMQPPlugin } from "../../src";
import { UniqueType } from "../utils/graphql-types";
import createPlugin from "./setup/plugin";
import getRabbitConnectionOptions from "./setup/rabbitmq";

describe("Apollo and RabbitMQ Subscription", () => {
    let driver: Driver;

    const typeMovie = new UniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    let plugin: Neo4jGraphQLSubscriptionsAMQPPlugin;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        const connectionOptions = getRabbitConnectionOptions();
        plugin = createPlugin(connectionOptions);

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

        let nextEventPromise = wsClient.waitForNextEvent(); // NOTE: not awaited on purpose
        await createMovie("movie1");
        await nextEventPromise;
        nextEventPromise = wsClient.waitForNextEvent(); // NOTE: not awaited on purpose
        await createMovie("movie2");
        await nextEventPromise;

        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                    event: "CREATE",
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                    event: "CREATE",
                },
            },
        ]);
    });

    test("create subscription with where", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: "movie1" }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        const nextEventPromise = wsClient.waitForNextEvent(); // NOTE: not awaited on purpose
        await createMovie("movie2");
        await createMovie("movie1");

        await nextEventPromise;

        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
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
