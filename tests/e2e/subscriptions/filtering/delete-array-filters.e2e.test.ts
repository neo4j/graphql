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
import { delay } from "../../../../src/utils/utils";
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
])("Create Subscription with optional filters valid for all types", ({ engine }) => {
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
            similarIds: [ID]
            title: String
            similarTitles: [String]
            releasedIn: Int
            allDates: [Int]
            averageRating: Float
            allRatings: [Float]
            fileSize: BigInt
            allSizes: [BigInt]
            isFavorite: Boolean
         }
         `;

        const driver = await testHelper.getDriver();
        subscriptionEngine = engine(driver, testHelper.database);
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: subscriptionEngine,
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

    test("subscription with INCLUDES on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarTitles
                    }
                }
            }
        `);

        await createMovie({ similarTitles: ["dummy", "movie"] });
        await createMovie({ similarTitles: ["mock"] });

        await deleteMovie("similarTitles", ["dummy", "movie"]);
        await deleteMovie("similarTitles", ["mock"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { similarTitles: ["dummy", "movie"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: ["1", "12"] });
        await createMovie({ similarIds: ["11"] });

        await deleteMovie("similarIds", ["1", "12"]);
        await deleteMovie("similarIds", "11");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { similarIds: ["1", "12"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: [42] });
        await createMovie({ similarIds: [4, 2] });

        await deleteMovie("similarIds", [42]);
        await deleteMovie("similarIds", [4, 2]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { similarIds: ["42"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allDates_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        allDates
                    }
                }
            }
        `);

        await createMovie({ allDates: [2020, 2019] });
        await createMovie({ allDates: [2019] });

        await deleteMovie("allDates", [2020, 2019]);
        await deleteMovie("allDates", [2019]);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { allDates: [2020, 2019] },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { allDates: [2019] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allRatings_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        allRatings
                    }
                }
            }
        `);

        await createMovie({ allRatings: [6, 5.4] });
        await createMovie({ allRatings: [5.0] });

        await deleteMovie("allRatings", [6, 5.4]);
        await deleteMovie("allRatings", [5.0]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { allRatings: [6, 5.4] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allSizes_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        allSizes
                    }
                }
            }
        `);

        await createMovie({
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ allSizes: ["123"] });

        await deleteMovie("allSizes", ["9223372036854775608", "922372036854775608"]);
        await deleteMovie("allSizes", ["123"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: {
                        allSizes: ["9223372036854775608", "922372036854775608"],
                    },
                },
            },
        ]);
    });

    test("subscription with NOT_INCLUDES on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_NOT_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarTitles
                    }
                }
            }
        `);

        await createMovie({ similarTitles: ["movie", "movie"] });
        await createMovie({ similarTitles: ["mock"] });

        await deleteMovie("similarTitles", ["movie", "movie"]);
        await deleteMovie("similarTitles", ["mock"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { similarTitles: ["mock"] },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_NOT_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: ["1", "12"] });
        await createMovie({ similarIds: ["11"] });

        await deleteMovie("similarIds", ["1", "12"]);
        await deleteMovie("similarIds", ["11"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { similarIds: ["11"] },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_NOT_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: [2, 4, 42] });
        await createMovie({ similarIds: [4, 2] });

        await deleteMovie("similarIds", [2, 4, 42]);
        await deleteMovie("similarIds", [4, 2]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { similarIds: ["4", "2"] },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allDates_NOT_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        allDates
                    }
                }
            }
        `);

        await createMovie({ allDates: [2020, 2018] });
        await createMovie({ allDates: [] });

        await deleteMovie("allDates", [2020, 2018]);
        await deleteMovie("allDates", []);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { allDates: [2020, 2018] },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { allDates: [] },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allRatings_NOT_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        allRatings
                    }
                }
            }
        `);

        await createMovie({ allRatings: [6, 5.4] });
        await createMovie({ allRatings: [5.4] });

        await deleteMovie("allRatings", [6, 5.4]);
        await deleteMovie("allRatings", [5.4]);

        // forcing a delay to ensure events do not exist
        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allSizes_NOT_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        allSizes
                    }
                }
            }
        `);

        await createMovie({
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ allSizes: ["123"] });

        await deleteMovie("allSizes", ["9223372036854775608", "922372036854775608"]);
        await deleteMovie("allSizes", ["123"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { allSizes: ["123"] },
                },
            },
        ]);
    });

    test("subscription with INCLUDES on String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_INCLUDES: ["movie"] }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", similarTitles: ["dummy", "movie"] });
        await createMovie({ title: "movie2", similarTitles: ["mock"] });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with INCLUDES on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_INCLUDES: true }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", isFavorite: true });
        await createMovie({ title: "movie2", isFavorite: false });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_INCLUDES on String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_NOT_INCLUDES: ["movie"] }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", similarTitles: ["dummy", "movie"] });
        await createMovie({ title: "movie2", similarTitles: ["mock"] });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_INCLUDES on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_NOT_INCLUDES: true }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", isFavorite: true });
        await createMovie({ title: "movie2", isFavorite: false });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

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
        similarIds?: number[] | string[];
        allDates?: number[];
        allRatings?: number[];
        allSizes?: string[];
    }): Promise<Response> {
        const input = Object.entries(all)
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
                        ${typeMovie.operations.create}(input: [{ ${input} }]) {
                            ${typeMovie.plural} {
                                id
                                similarIds
                                title
                                similarTitles
                                releasedIn
                                allDates
                                averageRating
                                allRatings
                                fileSize
                                allSizes
                                isFavorite
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }

    async function deleteMovie(fieldName: string, value: number | string | number[] | string[]): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.delete}(where: { ${fieldName}: ${makeTypedFieldValue(value)} }) {
                            nodesDeleted
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
