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
import { Neo4jGraphQLSubscriptionsCDCEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsCDCEngine";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import type { Neo4jGraphQLSubscriptionsEngine } from "../../../../src/types";
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
    // ])("$name Create Subscription", ({ engine }) => {
])("$name Create Subscription with optional filters valid for all types", ({ engine }) => {
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
            releasedIn: Int
            averageRating: Float
            fileSize: BigInt
            isFavorite: Boolean
            similarTitles: [String]
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

    test("subscription with where filter _NOT 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title_NOT: "movie1" }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter _NOT multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title_NOT: "movie0" }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter _NOT empty result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title_NOT: "movie1" }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });

        // forcing a delay to ensure events do not exist
        await delay(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("create subscription with where OR", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { OR: [{ title: "movie1"}, {title: "movie2"}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },

            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("create subscription with where AND match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { AND: [{ title: "movie2"}, {releasedIn: 2000}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("create subscription with where OR match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { OR: [{ title: "movie2", releasedIn: 2020}, {releasedIn: 2000}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("create subscription with where OR match 2", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { OR: [{ title: "movie2", releasedIn: 2000}, {title: "movie1", releasedIn: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: "movie3", OR: [{ releasedIn: 2001}, {title: "movie2", releasedIn: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie3", releasedIn: 2001 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie3" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR match nothing", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: "movie2", OR: [{ releasedIn: 2001}, {title: "movie2", releasedIn: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie3", releasedIn: 2001 });

        // forcing a delay to ensure events do not exist
        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("create subscription with where property + OR with filters match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn_GTE: 2000, OR: [{ title_NOT_STARTS_WITH: "movie", releasedIn: 2001}, {title: "movie4", releasedIn: 1000}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 2020 });
        await createMovie({ title: "movie3", releasedIn: 2000 });
        await createMovie({ title: "movie4", releasedIn: 1000 });
        await createMovie({ title: "dummy-movie", releasedIn: 2001 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "dummy-movie" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR with filters match 2", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn_GTE: 2000, OR: [{ title_STARTS_WITH: "moviee", releasedIn: 2001}, {title: "amovie"}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2000 });
        await createMovie({ title: "amovie", releasedIn: 2020 });
        await createMovie({ title: "movie3", releasedIn: 2000 });
        await createMovie({ title: "movie4", releasedIn: 1000 });
        await createMovie({ title: "movie5", releasedIn: 2001 });
        await createMovie({ title: "moviee1", releasedIn: 2001 });
        await createMovie({ title: "moviee2", releasedIn: 2021 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "moviee1" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "amovie" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR with filters match none", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn_GTE: 2000, OR: [{ title_STARTS_WITH: "moviee", releasedIn: 2001}, {title: "amovie", releasedIn_GT: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2000 });
        await createMovie({ title: "amovie", releasedIn: 2019 });
        await createMovie({ title: "movie3", releasedIn: 2000 });
        await createMovie({ title: "movie4", releasedIn: 1000 });
        await createMovie({ title: "movie5", releasedIn: 2001 });
        await createMovie({ title: "moviee2", releasedIn: 2021 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([]);
    });
    test("create subscription with where OR single element match", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { OR: [{ title: "movie1"}] }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("create subscription with where OR single element no match", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { OR: [{ title: "movie1"}] }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie3", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([]);
    });
    test("create subscription with where OR nested match 1", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: {
                OR: [
                    { title: "movie1" },
                    { AND: [
                        { title: "movie2" },
                        { title: "movie3" }
                    ]}
                ]
            }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("create subscription with where OR nested match some", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: {
                OR: [
                    { title: "movie1" },
                    { AND: [
                        { title: "movie2" },
                        { releasedIn: 2000 }
                    ]}
                ]
            }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 2002 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("create subscription with where OR nested match all", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: {
                OR: [
                    { title: "movie1" },
                    { AND: [
                        { title: "movie2" },
                        { releasedIn_GTE: 2000 }
                    ]}
                ]
            }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 2002 });

        await wsClient.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });

    // all but boolean types
    test("subscription with IN on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title_IN: ["movie", "movie1"] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title_NOT_IN: ["movie", "movie1"] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with IN on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { id_IN: ["1", "12"] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
        `);

        await createMovie({ id: "1", title: "movie1" });
        await createMovie({ id: "12", title: "movie2" });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "1" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "12" },
                },
            },
        ]);
    });
    test("subscription with IN on ID as int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { id_IN: [42, 4, 2] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
        `);

        await createMovie({ id: 42, title: "movie1" });
        await createMovie({ id: 2, title: "movie2" });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "42" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "2" },
                },
            },
        ]);
    });
    test("subscription with IN on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn_IN: [2019, 2020] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2019 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 2019 },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn_NOT_IN: [2019, 2020] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2019 });
        await createMovie({ releasedIn: 2000 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 2000 },
                },
            },
        ]);
    });
    test("subscription with IN on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { averageRating_IN: [5.9, 7] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 5.9 });
        await createMovie({ averageRating: 7.1 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 5.9 },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { averageRating_NOT_IN: [5.9, 7] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 5.9 });
        await createMovie({ averageRating: 7 });

        // forcing a delay to ensure events do not exist
        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with IN on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { fileSize_IN: [9223372036854775608, 9223372036854775508] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: "9223372036854775508" });
        await createMovie({ fileSize: "1234" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: "9223372036854775508" },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { fileSize_NOT_IN: [9223372036854775608, 9223372036854775508] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: "9223372036854775508" });
        await createMovie({ fileSize: "1234" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: "1234" },
                },
            },
        ]);
    });
    test("subscription with IN on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_IN: [true] }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong1", isFavorite: true });
        await createMovie({ title: "some_movie_wrong2", isFavorite: true });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_IN on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_NOT_IN: [true] }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong3", isFavorite: true });
        await createMovie({ title: "some_movie_wrong4", isFavorite: true });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with IN on Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_IN: ["fight club"] }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong5", similarTitles: ["fight club"] });
        await createMovie({ title: "some_movie_wrong6" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_IN on Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_NOT_IN: ["blue"] }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong7", similarTitles: ["blue bus"] });
        await createMovie({ title: "some_movie_wrong8" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    // NOT operator tests
    test("subscription with where filter NOT operator 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { title: "movie1" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT operator multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { title: "movie0" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT operator empty result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { title: "movie1" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });

        // forcing a delay to ensure events do not exist
        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("create subscription with where property + NOT with filters match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn_GTE: 2000, NOT: { title_STARTS_WITH: "movie" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 2020 });
        await createMovie({ title: "movie3", releasedIn: 2000 });
        await createMovie({ title: "movie4", releasedIn: 1000 });
        await createMovie({ title: "dummy-movie", releasedIn: 2001 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "dummy-movie" },
                },
            },
        ]);
    });
    test("create subscription with where NOT nested match ALL", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: {
                NOT: { 
                        AND: [
                            { title: "movie2" },
                            { releasedIn_GTE: 2000 }
                        ]
                    }
            }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 2002 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
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
                                title
                                releasedIn
                                averageRating
                                fileSize
                                isFavorite
                                similarTitles
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
