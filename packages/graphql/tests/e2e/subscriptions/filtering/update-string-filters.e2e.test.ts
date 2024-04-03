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
import type { Neo4jGraphQLSubscriptionsEngine } from "../../../../src";
import { Neo4jGraphQLSubscriptionsCDCEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsCDCEngine";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe.each([
    {
        name: "Neo4jGraphQLSubscriptionsDefaultEngine",
        engine: (_driver: Driver, _db: string) => new Neo4jGraphQLSubscriptionsDefaultEngine(),
    },
    {
        name: "Neo4jGraphQLSubscriptionsCDCEngine",
        engine: (driver: Driver, db: string) =>
            new Neo4jGraphQLSubscriptionsCDCEngine({
                driver,
                pollTime: 100,
                queryConfig: {
                    database: db,
                },
            }),
    },
])("Update Subscriptions", ({ engine }) => {
    const testHelper = new TestHelper({ cdc: true });
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;
    let subscriptionEngine: Neo4jGraphQLSubscriptionsEngine;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
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

        const driver = await testHelper.getDriver();
        subscriptionEngine = engine(driver, testHelper.database);
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
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

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        subscriptionEngine.close();
        await server.close();
        await testHelper.close();
    });

    test("subscription with where filter STARTS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { title_STARTS_WITH: "movie_starts_with" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie_starts_with1" });
        await createMovie({ title: "mvie2" });

        await updateMovie("title", "movie_starts_with1", "movie_starts_with2");
        await updateMovie("title", "mvie2", "movie8");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie_starts_with2" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_STARTS_WITH: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy1" });
        await createMovie({ id: "not-dummy1" });

        await updateMovie("id", "dummy1", "dummy2");
        await updateMovie("id", "not-dummy1", "not-dummy2");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "dummy2" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_STARTS_WITH: 1 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 1 });
        await createMovie({ id: 2 });

        await updateMovie("id", 1, 11);
        await updateMovie("id", 2, 121);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "11" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_STARTS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { title_NOT_STARTS_WITH: "movie" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "mvie1" });
        await createMovie({ title: "movie2" });

        await updateMovie("title", "mvie1", "movie");
        await updateMovie("title", "movie2", "dummy3");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_STARTS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_NOT_STARTS_WITH: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "not-dummy1" });
        await createMovie({ id: "dummy2" });

        await updateMovie("id", "dummy2", "not-dummy2");
        await updateMovie("id", "not-dummy1", "dummy2");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "dummy2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_NOT_STARTS_WITH: 32 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 2 });
        await createMovie({ id: 32 });

        await updateMovie("id", 2, 32);
        await updateMovie("id", 32, 31);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "32" },
                },
            },
        ]);
    });

    test("subscription with where filter ENDS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { title_ENDS_WITH: "movie_ends_with" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "test-movie_ends_with" });
        await createMovie({ title: "test-movie2" });

        await updateMovie("title", "test-movie_ends_with", "test-movie_ends_with2");
        await updateMovie("title", "test-movie2", "test-movie_ends_with");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "test-movie_ends_with2" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_ENDS_WITH: "id_ends_with" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "id_ends_with" });
        await createMovie({ id: "dummy2" });

        await updateMovie("id", "dummy2", "2id_ends_with");
        await updateMovie("id", "id_ends_with", "dummy_id");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "dummy_id" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_ENDS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 13 });
        await createMovie({ id: 31 });

        await updateMovie("id", 13, 22);
        await updateMovie("id", 31, 133);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "22" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_ENDS_WITH for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { title_NOT_ENDS_WITH: "movie_not_ends_with" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "test-movie_not_ends_with" });
        await createMovie({ title: "test-not_ends_with" });

        await updateMovie("title", "test-movie_not_ends_with", "test-movie1");
        await updateMovie("title", "test-not_ends_with", "test-dummy3");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "test-dummy3" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_ENDS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_NOT_ENDS_WITH: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: "2dummy" });

        await updateMovie("id", "2dummy", "not-2dummy");
        await updateMovie("id", "dummy-not", "dummy2");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "dummy2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_NOT_ENDS_WITH: 3 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 13 });

        await updateMovie("id", 31, 33);
        await updateMovie("id", 13, 23);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "33" },
                },
            },
        ]);
    });

    test("subscription with where filter CONTAINS for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { title_CONTAINS: "movie1" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "test-movie2" });
        await createMovie({ title: "test2-movie1" });

        await updateMovie("title", "test-movie2", "test-dmovie1");
        await updateMovie("title", "test2-movie1", "test-dummy6");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "test-dummy6" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_CONTAINS: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: 2 });

        await updateMovie("id", "dummy-not", "not-dummy2");
        await updateMovie("id", 2, "dummy22");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "not-dummy2" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_CONTAINS: 3 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 1 });

        await updateMovie("id", 31, 90);
        await updateMovie("id", 1, 30);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "90" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_CONTAINS for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { title_NOT_CONTAINS: "movie1" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "test2-movie2" });
        await createMovie({ title: "test2-movie1" });

        await updateMovie("title", "test2-movie1", "test-dummy7");
        await updateMovie("title", "test2-movie2", "test-dummy8");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "test-dummy8" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_CONTAINS for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_NOT_CONTAINS: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: 2 });

        await updateMovie("id", "dummy-not", 11);
        await updateMovie("id", 2, "dummy2");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "dummy2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { id_NOT_CONTAINS: 3 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 1 });

        await updateMovie("id", 31, 9);
        await updateMovie("id", 1, 3);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "3" },
                },
            },
        ]);
    });

    test("subscription with where filter CONTAINS for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { releasedIn_CONTAINS: 2020 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    releasedIn
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie1", releasedIn: 2020 });
        await createMovie({ title: "bad_type_string_movie2", releasedIn: 2021 });

        await updateMovie("title", "bad_type_string_movie1", "bad_type_string_movie3");
        await updateMovie("title", "bad_type_string_movie2", "bad_type_string_movie4");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { averageRating_CONTAINS: 5 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    averageRating
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie5", averageRating: 5.6 });
        await createMovie({ title: "bad_type_string_movie6", averageRating: 5.2 });

        await updateMovie("title", "bad_type_string_movie5", "bad_type_string_movie7");
        await updateMovie("title", "bad_type_string_movie6", "bad_type_string_movie8");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { fileSize_CONTAINS: "12" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    fileSize
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie9", fileSize: "3412" });
        await createMovie({ title: "bad_type_string_movie10", fileSize: "1234" });

        await updateMovie("title", "bad_type_string_movie9", "bad_type_string_movie11");
        await updateMovie("title", "bad_type_string_movie10", "bad_type_string_movie12");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { isFavorite_CONTAINS: false }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    isFavorite
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie13" });
        await createMovie({ title: "bad_type_string_movie14" });

        await updateMovie("title", "bad_type_string_movie13", "bad_type_string_movie15");
        await updateMovie("title", "bad_type_string_movie14", "bad_type_string_movie16");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { similarTitles_CONTAINS: "test" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    similarTitles
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie17", similarTitles: ["test"] });
        await createMovie({ title: "bad_type_string_movie8", similarTitles: ["test"] });

        await updateMovie("title", "bad_type_string_movie17", "bad_type_string_movie19");
        await updateMovie("title", "bad_type_string_movie18", "bad_type_string_movie20");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter STARTS_WITH for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { releasedIn_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    releasedIn
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie21", releasedIn: 2020 });
        await createMovie({ title: "bad_type_string_movie22", releasedIn: 2021 });

        await updateMovie("title", "bad_type_string_movie21", "bad_type_string_movie23");
        await updateMovie("title", "bad_type_string_movie22", "bad_type_string_movie24");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { averageRating_STARTS_WITH: 6 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    averageRating
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie25", averageRating: 6.2 });
        await createMovie({ title: "bad_type_string_movie26", averageRating: 6.3 });

        await updateMovie("title", "bad_type_string_movie25", "bad_type_string_movie27");
        await updateMovie("title", "bad_type_string_movie26", "bad_type_string_movie28");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { fileSize_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    fileSize
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie29", fileSize: "2020" });
        await createMovie({ title: "bad_type_string_movie30", fileSize: "2021" });

        await updateMovie("fileSize", "2020", "20201");
        await updateMovie("fileSize", "2021", "20211");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { isFavorite_STARTS_WITH: "f" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    isFavorite
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie33" });
        await createMovie({ title: "bad_type_string_movie34" });

        await updateMovie("title", "bad_type_string_movie33", "bad_type_string_movie35");
        await updateMovie("title", "bad_type_string_movie34", "bad_type_string_movie36");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { similarTitles_STARTS_WITH: "test" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    similarTitles
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie37", similarTitles: ["test"] });
        await createMovie({ title: "bad_type_string_movie38", similarTitles: ["test"] });

        await updateMovie("title", "bad_type_string_movie37", "bad_type_string_movie39");
        await updateMovie("title", "bad_type_string_movie38", "bad_type_string_movie40");

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
            .filter(([, v]) => v)
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

    async function updateMovie(
        fieldName: string,
        oldValue: number | string,
        newValue: number | string
    ): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                        mutation {
                            ${typeMovie.operations.update}(where: { ${fieldName}: ${makeTypedFieldValue(
                    oldValue
                )} }, update: { ${fieldName}: ${makeTypedFieldValue(newValue)} }) {
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
