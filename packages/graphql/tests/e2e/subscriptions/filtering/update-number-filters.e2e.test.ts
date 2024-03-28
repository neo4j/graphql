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
])("$name - Update Subscriptions", ({ engine }) => {
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

    test("subscription with where filter _LT for Int 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_LT: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 1999 });

        await updateMovie("releasedIn", 2000, 2001);
        await updateMovie("releasedIn", 1999, 1998);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 1998 },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_LTE: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 1999 });
        await createMovie({ releasedIn: 2999 });

        await updateMovie("releasedIn", 2000, 1920);
        await updateMovie("releasedIn", 1999, 1997);
        await updateMovie("releasedIn", 2999, 2998);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 1920 },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 1997 },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for Int 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_GT: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2000 });

        await updateMovie("releasedIn", 2020, 2021);
        await updateMovie("releasedIn", 2000, 2001);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 2021 },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_GTE: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 1920 });
        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 2030 });

        await updateMovie("releasedIn", 1920, 2020);
        await updateMovie("releasedIn", 2000, 2021);
        await updateMovie("releasedIn", 2030, 1999);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 2021 },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 1999 },
                },
            },
        ]);
    });

    test("subscription with where filter _LT for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_LT: 8 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 8.0 });
        await createMovie({ averageRating: 5.0 });

        await updateMovie("averageRating", 8, 7.5);
        await updateMovie("averageRating", 5, 9);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 9 },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for Float multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_LTE: 7 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 6.7 });
        await createMovie({ averageRating: 7.0 });
        await createMovie({ averageRating: 7.1 });

        await updateMovie("averageRating", 6.7, 7.2);
        await updateMovie("averageRating", 7, 7.9);
        await updateMovie("averageRating", 7.1, 6.7);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 7.2 },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 7.9 },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_GT: 7.9 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 8 });
        await createMovie({ averageRating: 7.9 });

        await updateMovie("averageRating", 8.0, 7.9);
        await updateMovie("averageRating", 7.9, 7.2);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 7.9 },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Float multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_GTE: 5 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.1 });
        await createMovie({ averageRating: 5.3 });
        await createMovie({ averageRating: 6.2 });

        await updateMovie("averageRating", 4.1, 7.9);
        await updateMovie("averageRating", 5.3, 7.7);
        await updateMovie("averageRating", 6.2, 7.2);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 7.7 },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 7.2 },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Float multiple results no decimals", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_GTE: 4.2 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.1 });
        await createMovie({ averageRating: 5 });
        await createMovie({ averageRating: 6.2 });

        await updateMovie("averageRating", 4.1, 7.9);
        await updateMovie("averageRating", 5, 5.9);
        await updateMovie("averageRating", 6.2, 6.7);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 5.9 },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 6.7 },
                },
            },
        ]);
    });

    test("subscription with where filter _LT for BigInt 1 result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
            dummyS: "9222372036854775807",
            dummyM: "9223272036854775807",
            dummyL: "9223372036852775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { fileSize_LT: ${bigInts.m} }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.s });

        await updateMovie("fileSize", bigInts.m, bigInts.dummyL);
        await updateMovie("fileSize", bigInts.s, bigInts.m);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: bigInts.m },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for BigInt multiple result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
            dummyS: "9222372036854775807",
            dummyM: "9223272036854775807",
            dummyL: "9223372036852775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { fileSize_LTE: ${bigInts.dummyM} }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.dummyS });
        await createMovie({ fileSize: bigInts.dummyM });
        await createMovie({ fileSize: bigInts.l });

        await updateMovie("fileSize", bigInts.dummyS, bigInts.s);
        await updateMovie("fileSize", bigInts.dummyM, bigInts.dummyS);
        await updateMovie("fileSize", bigInts.l, bigInts.dummyL);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: bigInts.s },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: bigInts.dummyS },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for BigInt 1 result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775710",
            dummyS: "9222372036854775807",
            dummyM: "9223272036854775807",
            dummyL: "9223372036852775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { fileSize_GT: ${bigInts.m} }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.l });
        await createMovie({ fileSize: bigInts.m });

        await updateMovie("fileSize", bigInts.l, bigInts.s);
        await updateMovie("fileSize", bigInts.m, bigInts.dummyS);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: bigInts.s },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for BigInt multiple result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
            dummyS: "9222372036854775807",
            dummyM: "9223272036854775807",
            dummyL: "9223372036852775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { fileSize_GTE: ${bigInts.m} }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.s });
        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.l });

        await updateMovie("fileSize", bigInts.s, bigInts.s);
        await updateMovie("fileSize", bigInts.m, bigInts.s);
        await updateMovie("fileSize", bigInts.l, bigInts.dummyM);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: bigInts.s },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: bigInts.dummyM },
                },
            },
        ]);
    });

    test("subscription with where filter _LT for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_LT: "bad_type_movie1" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie1" });
        await createMovie({ title: "bad_type_movie2" });

        await updateMovie("title", "bad_type_movie1", "bad_type_movie3");
        await updateMovie("title", "bad_type_movie2", "bad_type_movie4");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _LTE for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_LTE: "bad_type_movie" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie5" });
        await createMovie({ title: "bad_type_movie6" });

        await updateMovie("title", "bad_type_movie5", "bad_type_movie7");
        await updateMovie("title", "bad_type_movie6", "bad_type_movie8");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GT for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_GT: "a_bad_type_movie1" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie9" });
        await createMovie({ title: "bad_type_movie10" });

        await updateMovie("title", "bad_type_movie9", "bad_type_movie11");
        await updateMovie("title", "bad_type_movie10", "bad_type_movie12");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GTE for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_GTE: "a_bad_type_movie1" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie13" });
        await createMovie({ title: "bad_type_movie14" });

        await updateMovie("title", "bad_type_movie13", "bad_type_movie15");
        await updateMovie("title", "bad_type_movie14", "bad_type_movie16");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter _LT for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_LT: 50 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 42 });
        await createMovie({ id: 24 });

        await updateMovie("id", 42, 420);
        await updateMovie("id", 24, 240);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _LTE for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_LTE: 50 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 40 });
        await createMovie({ id: 20 });

        await updateMovie("id", 40, 400);
        await updateMovie("id", 20, 200);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GT for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_GT: 2 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 5 });
        await createMovie({ id: 3 });

        await updateMovie("id", 5, 50);
        await updateMovie("id", 3, 30);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GTE for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_GTE: 1 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 4 });
        await createMovie({ id: 2 });

        await updateMovie("id", 4, 40);
        await updateMovie("id", 2, 20);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter _LT for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_LT: true }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie25", isFavorite: false });
        await createMovie({ title: "bad_type_movie26", isFavorite: true });

        await updateMovie("title", "bad_type_movie25", "bad_type_movie255");
        await updateMovie("title", "bad_type_movie26", "bad_type_movie266");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _LTE for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_LTE: false }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie27", isFavorite: false });
        await createMovie({ title: "bad_type_movie28", isFavorite: false });

        await updateMovie("title", "bad_type_movie27", "bad_type_movie277");
        await updateMovie("title", "bad_type_movie28", "bad_type_movie288");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GT for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_GT: false }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie29", isFavorite: false });
        await createMovie({ title: "bad_type_movie30", isFavorite: false });

        await updateMovie("title", "bad_type_movie29", "bad_type_movie299");
        await updateMovie("title", "bad_type_movie30", "bad_type_movie300");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GTE for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_GTE: false }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie31", isFavorite: false });
        await createMovie({ title: "bad_type_movie32", isFavorite: false });

        await updateMovie("title", "bad_type_movie31", "bad_type_movie311");
        await updateMovie("title", "bad_type_movie32", "bad_type_movie322");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter _LT for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_LT: "test" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie25", similarTitles: ["dummy"] });
        await createMovie({ title: "bad_type_movie26", similarTitles: ["dummy"] });

        await updateMovie("title", "bad_type_movie25", "bad_type_movie255");
        await updateMovie("title", "bad_type_movie26", "bad_type_movie266");

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
                                    title
                                    similarTitles
                                    releasedIn
                                    averageRating
                                    fileSize
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
                                    title
                                    releasedIn
                                    averageRating
                                    fileSize
                                }
                            }
                        }
                    `,
            })
            .expect(200);
        return result;
    }
});
