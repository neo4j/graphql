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
])("$name - Delete Subscription", ({ engine }) => {
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
                ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_LT: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 1999 });

        await deleteMovie("releasedIn", 2000);
        await deleteMovie("releasedIn", 1999);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { releasedIn: 1999 },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_LTE: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 1999 });
        await createMovie({ releasedIn: 2999 });

        await deleteMovie("releasedIn", 2000);
        await deleteMovie("releasedIn", 1999);
        await deleteMovie("releasedIn", 2999);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { releasedIn: 2000 },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { releasedIn: 1999 },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for Int 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_GT: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2000 });

        await deleteMovie("releasedIn", 2020);
        await deleteMovie("releasedIn", 2000);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { releasedIn: 2020 },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_GTE: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 1920 });
        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 2030 });

        await deleteMovie("releasedIn", 1920);
        await deleteMovie("releasedIn", 2000);
        await deleteMovie("releasedIn", 2030);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { releasedIn: 2000 },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { releasedIn: 2030 },
                },
            },
        ]);
    });

    test("subscription with where filter _LT for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { averageRating_LT: 8 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 8.0 });
        await createMovie({ averageRating: 5 });

        await deleteMovie("averageRating", 8);
        await deleteMovie("averageRating", 5);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 5 },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for Float multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { averageRating_LTE: 7 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 6.7 });
        await createMovie({ averageRating: 7.0 });
        await createMovie({ averageRating: 7.1 });

        await deleteMovie("averageRating", 6.7);
        await deleteMovie("averageRating", 7);
        await deleteMovie("averageRating", 7.1);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 6.7 },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 7 },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { averageRating_GT: 7.9 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 8 });
        await createMovie({ averageRating: 7.9 });

        await deleteMovie("averageRating", 8);
        await deleteMovie("averageRating", 2.9);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 8 },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Float multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { averageRating_GTE: 5 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.1 });
        await createMovie({ averageRating: 5.3 });
        await createMovie({ averageRating: 6.2 });

        await deleteMovie("averageRating", 4.1);
        await deleteMovie("averageRating", 5.3);
        await deleteMovie("averageRating", 6.2);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 5.3 },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 6.2 },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Float multiple results no decimals", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { averageRating_GTE: 4.2 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.1 });
        await createMovie({ averageRating: 5 });
        await createMovie({ averageRating: 6.2 });

        await deleteMovie("averageRating", 4.1);
        await deleteMovie("averageRating", 5);
        await deleteMovie("averageRating", 6.2);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 5 },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { averageRating: 6.2 },
                },
            },
        ]);
    });

    test("subscription with where filter _LT for BigInt 1 result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { fileSize_LT: ${bigInts.m} }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.s });

        await deleteMovie("fileSize", bigInts.m);
        await deleteMovie("fileSize", bigInts.s);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { fileSize: bigInts.s },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for BigInt multiple result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { fileSize_LTE: ${bigInts.m} }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.s });
        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.l });

        await deleteMovie("fileSize", bigInts.s);
        await deleteMovie("fileSize", bigInts.m);
        await deleteMovie("fileSize", bigInts.l);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { fileSize: bigInts.s },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { fileSize: bigInts.m },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for BigInt 1 result", async () => {
        const bigInts = {
            m: "9223372036854775708",
            l: "9223372036854775710",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { fileSize_GT: ${bigInts.m} }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.l });
        await createMovie({ fileSize: bigInts.m });

        await deleteMovie("fileSize", bigInts.l);
        await deleteMovie("fileSize", bigInts.m);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { fileSize: bigInts.l },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for BigInt multiple result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { fileSize_GTE: ${bigInts.m} }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.s });
        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.l });

        await deleteMovie("fileSize", bigInts.s);
        await deleteMovie("fileSize", bigInts.m);
        await deleteMovie("fileSize", bigInts.l);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { fileSize: bigInts.m },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { fileSize: bigInts.l },
                },
            },
        ]);
    });

    test("subscription with where filter _LT for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { title_LT: "test" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _LTE for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { title_LTE: "test" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GT for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { title_GT: "abc" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GTE for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { title_GTE: "abc" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter _LT for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { id_LT: 50 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 42 });
        await createMovie({ id: 24 });

        await deleteMovie("id", 42);
        await deleteMovie("id", 24);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _LTE for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { id_LTE: 50 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 40 });
        await createMovie({ id: 20 });

        await deleteMovie("id", 40);
        await deleteMovie("id", 20);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GT for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { id_GT: 2 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 5 });
        await createMovie({ id: 3 });

        await deleteMovie("id", 5);
        await deleteMovie("id", 3);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GTE for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { id_GTE: 1 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        id
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: 4 });
        await createMovie({ id: 2 });

        await deleteMovie("id", 4);
        await deleteMovie("id", 2);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter _LT for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_LT: true }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", isFavorite: false });
        await createMovie({ title: "movie2", isFavorite: false });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _LTE for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_LTE: false }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", isFavorite: false });
        await createMovie({ title: "movie2", isFavorite: false });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GT for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_GT: false }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", isFavorite: false });
        await createMovie({ title: "movie2", isFavorite: false });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter _GTE for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_GTE: false }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie1", isFavorite: false });
        await createMovie({ title: "movie2", isFavorite: false });

        await deleteMovie("title", "movie1");
        await deleteMovie("title", "movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter _GT for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_GT: "dummy" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "bad_type_movie25", similarTitles: ["test"] });
        await createMovie({ title: "bad_type_movie26", similarTitles: ["test"] });

        await deleteMovie("title", "bad_type_movie25");
        await deleteMovie("title", "bad_type_movie26");

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

    async function deleteMovie(fieldName: string, value: number | string): Promise<Response> {
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
