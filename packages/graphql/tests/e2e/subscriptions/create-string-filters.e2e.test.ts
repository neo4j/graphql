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

describe("Create Subscription with filters valid on string types (String, ID)", () => {
    let neo4j: Neo4j;
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
            id: ID
            title: String
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

    test("subscription with where filter STARTS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title_STARTS_WITH: "movie" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "movie1" });
        await createMovie({ id: generateRandom(), title: "mvie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_STARTS_WITH: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: "dummy1", title: "movie1" });
        await createMovie({ id: "not-dummy1", title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_STARTS_WITH: 1 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: 1, title: "movie1" });
        await createMovie({ id: 2, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_STARTS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title_NOT_STARTS_WITH: "movie" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "mvie1" });
        await createMovie({ id: generateRandom(), title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "mvie1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_STARTS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_STARTS_WITH: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: "not-dummy1", title: "movie1" });
        await createMovie({ id: "dummy2", title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_STARTS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: 2, title: "movie1" });
        await createMovie({ id: 3, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter ENDS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title_ENDS_WITH: "movie1" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "test-movie1" });
        await createMovie({ id: generateRandom(), title: "test-movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "test-movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_ENDS_WITH: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: "not-dummy", title: "movie1" });
        await createMovie({ id: "dummy2", title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_ENDS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: 13, title: "movie1" });
        await createMovie({ id: 31, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_ENDS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title_NOT_ENDS_WITH: "movie1" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "test-movie2" });
        await createMovie({ id: generateRandom(), title: "test-movie1" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "test-movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_ENDS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_ENDS_WITH: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not", title: "movie1" });
        await createMovie({ id: "2dummy", title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_ENDS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: 31, title: "movie1" });
        await createMovie({ id: 13, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter CONTAINS for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title_CONTAINS: "movie1" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "test-movie2" });
        await createMovie({ id: generateRandom(), title: "test2-movie1" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "test2-movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_CONTAINS: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not", title: "movie1" });
        await createMovie({ id: 2, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_CONTAINS: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: 31, title: "movie1" });
        await createMovie({ id: 1, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_CONTAINS for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title_NOT_CONTAINS: "movie1" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "test2-movie2" });
        await createMovie({ id: generateRandom(), title: "test2-movie1" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "test2-movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_CONTAINS for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_CONTAINS: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not", title: "movie1" });
        await createMovie({ id: 2, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_CONTAINS: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: 31, title: "movie1" });
        await createMovie({ id: 1, title: "movie2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });

    const generateRandom = () => Math.floor(Math.random() * 100) + 1;
    const makeTypedFieldValue = (value) => (typeof value === "string" ? `"${value}"` : value);
    async function createMovie({ id, title }): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ id: ${makeTypedFieldValue(id)}, title: "${title}" }]) {
                            ${typeMovie.plural} {
                                id
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
