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
import { generateUniqueType } from "../../utils/graphql-types";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../setup/ws-client";
import Neo4j from "../setup/neo4j";

describe("Update Subscriptions", () => {
    let neo4j: Neo4j;
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");
    const typeActor = generateUniqueType("Actor");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
             title: String
         }

         type ${typeActor} {
             name: String
         }
         `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                driverConfig: {
                    database: neo4j.getIntegrationDatabaseName(),
                },
            },
            plugins: {
                subscriptions: new TestSubscriptionsPlugin(),
            },
        });

        server = new ApolloTestServer(neoSchema);
        await server.start();
    });

    beforeEach(() => {
        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
    });

    afterAll(async () => {
        await server.close();
        await driver.close();
    });

    test("update subscription", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated} {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                    previousState {
                        title
                    }
                    event
                    timestamp
                }
            }
        `);

        await createMovie("movie1");
        await createMovie("movie2");

        await updateMovie("movie1", "movie3");
        await updateMovie("movie2", "movie4");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                    previousState: { title: "movie1" },
                    event: "UPDATE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie4" },
                    previousState: { title: "movie2" },
                    event: "UPDATE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
    });

    test("update subscription with where", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title: "movie5" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie("movie5");
        await createMovie("movie6");

        await updateMovie("movie5", "movie7");
        await updateMovie("movie6", "movie8");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie7" },
                },
            },
        ]);
    });

    test("update subscription with same fields after update won't be triggered", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated} {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                    event
                }
            }
        `);

        await createMovie("movie10");

        await updateMovie("movie10", "movie20");
        await updateMovie("movie20", "movie20");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie20" },
                    event: "UPDATE",
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

    async function updateMovie(oldTitle: string, newTitle: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                        mutation {
                            ${typeMovie.operations.update}(where: { title: "${oldTitle}" }, update: { title: "${newTitle}" }) {
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
