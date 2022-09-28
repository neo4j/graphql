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
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../setup/ws-client";
import Neo4j from "../../setup/neo4j";

describe("Create Subscription with filters valid on string types (String, ID)", () => {
    let neo4j: Neo4j;
    let driver: Driver;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;

    beforeEach(async () => {
        typeMovie = generateUniqueType("Movie");
        const typeDefs = `
         type ${typeMovie} {
            id: ID
            title: String
            similarTitles: [String]
            releasedIn: Int
            averageRating: Float
            fileSize: BigInt
            isFavorite: Boolean
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

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();

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

        await createMovie({ title: "movie1" });
        await createMovie({ title: "mvie2" });

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
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy1" });
        await createMovie({ id: "not-dummy1" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "dummy1" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_STARTS_WITH: 1 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 1 });
        await createMovie({ id: 2 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "1" },
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

        await createMovie({ title: "mvie1" });
        await createMovie({ title: "movie2" });

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
                    id
                }
            }
        }
    `);

        await createMovie({ id: "not-dummy1" });
        await createMovie({ id: "dummy2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "not-dummy1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_STARTS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 2 });
        await createMovie({ id: 3 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "2" },
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

        await createMovie({ title: "test-movie1" });
        await createMovie({ title: "test-movie2" });

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
                    id
                }
            }
        }
    `);

        await createMovie({ id: "not-dummy" });
        await createMovie({ id: "dummy2" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "not-dummy" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_ENDS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 13 });
        await createMovie({ id: 31 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "13" },
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

        await createMovie({ title: "test-movie2" });
        await createMovie({ title: "test-movie1" });

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
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: "2dummy" });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "dummy-not" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_ENDS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 13 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "31" },
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

        await createMovie({ title: "test-movie2" });
        await createMovie({ title: "test2-movie1" });

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
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: 2 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "dummy-not" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_CONTAINS: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 1 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "31" },
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

        await createMovie({ title: "test2-movie2" });
        await createMovie({ title: "test2-movie1" });

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
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: 2 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id_NOT_CONTAINS: 3 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 1 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "1" },
                },
            },
        ]);
    });

    test("subscription with where filter CONTAINS for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { releasedIn_CONTAINS: 2020 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    releasedIn
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2021 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { averageRating_CONTAINS: 5 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ averageRating: 5.6 });
        await createMovie({ averageRating: 5.2 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { fileSize_CONTAINS: "12" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ fileSize: "3412" });
        await createMovie({ fileSize: "1234" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { isFavorite_CONTAINS: false }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({});
        await createMovie({});

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { similarTitles_CONTAINS: "test" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ similarTitles: ["test"] });
        await createMovie({ similarTitles: ["test"] });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter STARTS_WITH for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { releasedIn_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2021 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { averageRating_STARTS_WITH: 6 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ averageRating: 6.2 });
        await createMovie({ averageRating: 6.3 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { fileSize_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ fileSize: "2020" });
        await createMovie({ fileSize: "2021" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { isFavorite_STARTS_WITH: "f" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({});
        await createMovie({});

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { similarTitles_STARTS_WITH: "test" }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ similarTitles: ["test"] });
        await createMovie({ similarTitles: ["test"] });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    const makeTypedFieldValue = (value) => {
        if (typeof value === "string") {
            return `"${value}"`;
        }
        if (Array.isArray(value)) {
            return `[${value.map(makeTypedFieldValue)}]`;
        }
        return value;
    };
    async function createMovie(all: {
        id?: string | number;
        title?: string;
        releasedIn?: number;
        averageRating?: number;
        fileSize?: string;
        isFavorite?: boolean;
        similarTitles?: string[];
    }): Promise<Response> {
        const movieInput = Object.entries(all)
            .filter(([_, v]) => v)
            .map(([k, v]) => {
                return `${k}: ${makeTypedFieldValue(v)}`;
            })
            .join(", ");
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ ${movieInput} }]) {
                            ${typeMovie.plural} {
                                id
                                title
                                similarTitles
                                releasedIn
                                averageRating
                                fileSize
                                isFavorite
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
