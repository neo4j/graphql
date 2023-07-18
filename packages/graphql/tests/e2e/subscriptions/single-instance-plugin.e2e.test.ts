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
import { Neo4jGraphQL } from "../../../src/classes";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { WebSocketTestClient } from "../setup/ws-client";
import Neo4j from "../setup/neo4j";
import { Neo4jGraphQLSubscriptionsSingleInstancePlugin } from "../../../src";
import { delay } from "../../../src/utils/utils";
import { UniqueType } from "../../utils/graphql-types";

describe("Create Subscription", () => {
    let neo4j: Neo4j;
    let driver: Driver;
    let plugin: Neo4jGraphQLSubscriptionsSingleInstancePlugin;

    const typeMovie = new UniqueType("Movie");

    const subscriptionQuery = `subscription {
                            ${typeMovie.operations.subscribe.created} {
                                ${typeMovie.operations.subscribe.payload.created} {
                                    title
                                }
                                event
                                timestamp
                            }
                        }`;

    let server: TestGraphQLServer;

    let wsClient: WebSocketTestClient;
    let wsClient2: WebSocketTestClient;

    beforeAll(async () => {
        plugin = new Neo4jGraphQLSubscriptionsSingleInstancePlugin();
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }
         `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: plugin,
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

    beforeEach(() => {
        wsClient = new WebSocketTestClient(server.wsPath);
        wsClient2 = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        await wsClient2.close();
    });

    afterAll(async () => {
        await server.close();
        await driver.close();
    });

    // NOTE: This test **may** be flaky, if so, feel free to remove it
    test("listeners are properly triggered and cleaned up", async () => {
        expect(plugin.events.getMaxListeners()).toBe(0);
        expect(plugin.events.listenerCount("create")).toBe(0);

        await wsClient.subscribe(subscriptionQuery);
        await wsClient2.subscribe(subscriptionQuery);

        await delay(50); // Sorry listener count takes a bit to update
        expect(plugin.events.listenerCount("create")).toBe(2);

        await wsClient2.close();
        await delay(50); // Sorry listener count takes a bit to update
        expect(plugin.events.listenerCount("create")).toBe(1);
    });

    test("multiple listeners attached to local event plugin", async () => {
        await wsClient.subscribe(subscriptionQuery);
        await wsClient2.subscribe(subscriptionQuery);

        await createMovie("movie1");

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                    event: "CREATE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                    event: "CREATE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
    });

    test("create and triggers subscription", async () => {
        await wsClient.subscribe(subscriptionQuery);

        await createMovie("movie1");
        await createMovie("movie2");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                    event: "CREATE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                    event: "CREATE",
                    timestamp: expect.any(Number),
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
