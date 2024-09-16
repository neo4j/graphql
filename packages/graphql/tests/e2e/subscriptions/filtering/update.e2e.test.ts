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
])("$name - Update Subscriptions", ({ engine }) => {
    const testHelper = new TestHelper();
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let subscriptionEngine: Neo4jGraphQLSubscriptionsEngine;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");
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

         type ${typeActor} {
             name: String
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

    test("update subscription with where filter _NOT 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_NOT: "movie5" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie5" });
        await createMovie({ title: "movie6" });

        await updateMovie("title", "movie5", "movie7");
        await updateMovie("title", "movie6", "movie8");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie8" },
                },
            },
        ]);
    });
    test("update subscription with where filter _NOT multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_NOT: "movie2" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie5" });
        await createMovie({ title: "movie6" });

        await updateMovie("title", "movie5", "movie7");
        await updateMovie("title", "movie6", "movie8");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie7" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie8" },
                },
            },
        ]);
    });
    test("update subscription with where filter _NOT empty result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_NOT: "movie5" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie5" });

        await updateMovie("title", "movie5", "movie7");

        // forcing a delay to ensure events do not exist
        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test("create subscription with where OR", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { OR: [{ title: "movie1"}, {title: "movie2"}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("title", "movie1", "movie1.1");
        await updateMovie("title", "movie2", "movie1.2");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1.1" },
                },
            },

            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1.2" },
                },
            },
        ]);
    });
    test("create subscription with where AND match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { AND: [{ title: "movie2"}, {releasedIn: 2000}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("title", "movie1", "movie1.3");
        await updateMovie("title", "movie2", "movie1.4");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1.4" },
                },
            },
        ]);
    });
    test("create subscription with where OR match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { OR: [{ title: "movie2", releasedIn: 2020}, {releasedIn: 2000}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("title", "movie1", "movie1.5");
        await updateMovie("title", "movie2", "movie1.6");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1.6" },
                },
            },
        ]);
    });
    test("create subscription with where OR match 2", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { OR: [{ title: "movie2", releasedIn: 2000}, {title: "movie1", releasedIn: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("title", "movie1", "movie1.7");
        await updateMovie("title", "movie2", "movie1.8");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1.7" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1.8" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title: "movie3", OR: [{ releasedIn: 2001}, {title: "movie2", releasedIn: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie3", releasedIn: 2001 });

        await updateMovie("title", "movie1", "movie4");
        await updateMovie("title", "movie2", "movie5");
        await updateMovie("title", "movie3", "movie6");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie6" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR match nothing", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title: "movie2", OR: [{ releasedIn: 2001}, {title: "movie2", releasedIn: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie3", releasedIn: 2001 });

        await updateMovie("title", "movie1", "movie4");
        await updateMovie("title", "movie2", "movie5");
        await updateMovie("title", "movie3", "movie6");

        // forcing a delay to ensure events do not exist
        await delay(3);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("create subscription with where property + OR with filters match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_GTE: 2000, OR: [{ title_NOT_STARTS_WITH: "movie", releasedIn: 2001}, {title: "movie4", releasedIn: 1000}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
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

        await updateMovie("title", "movie1", "movie5");
        await updateMovie("title", "movie2", "movie6");
        await updateMovie("title", "movie3", "movie7");
        await updateMovie("title", "movie4", "movie8");
        await updateMovie("title", "dummy-movie", "movie9");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie9" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR with filters match 2", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_GTE: 2000, OR: [{ title_STARTS_WITH: "moviee", releasedIn: 2001}, {title: "amovie"}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
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

        await updateMovie("title", "movie1", "movie6");
        await updateMovie("title", "amovie", "movie7");
        await updateMovie("title", "movie3", "movie8");
        await updateMovie("title", "movie4", "movie9");
        await updateMovie("title", "movie5", "movie10");
        await updateMovie("title", "moviee1", "movie11");
        await updateMovie("title", "moviee2", "movie12");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie11" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie7" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR with filters match none", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_GTE: 2000, OR: [{ title_STARTS_WITH: "moviee", releasedIn: 2001}, {title: "amovie", releasedIn_GT: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
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

        await updateMovie("title", "movie1", "movie6");
        await updateMovie("title", "amovie", "movie7");
        await updateMovie("title", "movie3", "movie8");
        await updateMovie("title", "movie4", "movie9");
        await updateMovie("title", "movie5", "movie10");
        await updateMovie("title", "moviee2", "movie11");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([]);
    });
    test("create subscription with where OR single element match", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { OR: [{ title: "movie1"}] }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("title", "movie1", "movie3");
        await updateMovie("title", "movie2", "movie4");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
        ]);
    });
    test("create subscription with where OR single element no match", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { OR: [{ title: "movie1"}] }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie3", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("title", "movie3", "movie5");
        await updateMovie("title", "movie2", "movie4");

        // forcing a delay to ensure events do not exist
        await delay(3);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([]);
    });
    test("create subscription with where OR nested match 1", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: {
                OR: [
                    { title: "movie1" },
                    { AND: [
                        { title: "movie2" },
                        { title: "movie3" }
                    ]}
                ]
            }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("title", "movie1", "movie3");
        await updateMovie("title", "movie2", "movie4");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
        ]);
    });
    test("create subscription with where OR nested match some", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: {
                OR: [
                    { title: "movie1" },
                    { AND: [
                        { title: "movie2" },
                        { releasedIn: 2000 }
                    ]}
                ]
            }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 2002 });

        await updateMovie("title", "movie1", "movie3");
        await updateMovie("releasedIn", 2000, 2222);
        await updateMovie("releasedIn", 2002, 2422);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
        ]);
    });
    test("create subscription with where OR nested match all", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: {
                OR: [
                    { title: "movie1" },
                    { AND: [
                        { title: "movie2" },
                        { releasedIn_GTE: 2000 }
                    ]}
                ]
            }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 2002 });

        await updateMovie("title", "movie1", "movie3");
        await updateMovie("releasedIn", 2000, 2222);
        await updateMovie("releasedIn", 2002, 2422);

        await wsClient.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
        ]);
    });

    // all but boolean types
    test("subscription with IN on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_IN: ["abc", "sth"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "abc" });
        await createMovie({ title: "something" });

        await updateMovie("title", "abc", "abcd");
        await updateMovie("title", "something", "abc");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "abcd" },
                },
            },
        ]);
    });
    test("subscription with IN on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_IN: ["id1", "id11"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `);

        await createMovie({ id: "id1" });
        await createMovie({ id: "id111" });

        await updateMovie("id", "id1", "id2");
        await updateMovie("id", "id111", "id222");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "id2" },
                },
            },
        ]);
    });
    test("subscription with IN on ID as Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_IN: [42, 420] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `);

        await createMovie({ id: 420 });
        await createMovie({ id: 42 });

        await updateMovie("id", 420, 421);
        await updateMovie("id", 42, 420);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "420" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "421" },
                },
            },
        ]);
    });
    test("subscription with IN on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_IN: [2020, 2021] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2022 });

        await updateMovie("releasedIn", 2020, 2022);
        await updateMovie("releasedIn", 2022, 2020);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 2022 },
                },
            },
        ]);
    });
    test("subscription with IN on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_IN: [4.2, 4.20] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.2 });
        await createMovie({ averageRating: 10 });

        await updateMovie("averageRating", 4.2, 5);
        await updateMovie("averageRating", 10, 4.2);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 5 },
                },
            },
        ]);
    });
    test("subscription with IN on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { fileSize_IN: ["922372036854775608"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: "922372036854775608" });
        await createMovie({ fileSize: "100" });

        await updateMovie("fileSize", "922372036854775608", "922372036854775607");
        await updateMovie("fileSize", "100", "101");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: "922372036854775607" },
                },
            },
        ]);
    });

    test("subscription with NOT_IN on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title_NOT_IN: ["abcd", "sth"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "abcd" });
        await createMovie({ title: "some_movie" });

        await updateMovie("title", "abcd", "abc");
        await updateMovie("title", "some_movie", "sth");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "sth" },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_NOT_IN: ["id1", "id111"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `);

        await createMovie({ id: "id11" });
        await createMovie({ id: "id1" });

        await updateMovie("id", "id11", "id33");
        await updateMovie("id", "id1", "id3");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "id33" },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on ID as Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { id_NOT_IN: [420, 42] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        id
                    }
                }
            }
        `);

        await createMovie({ id: 4 });
        await createMovie({ id: 42 });

        await updateMovie("id", 4, 41);
        await updateMovie("id", 42, 421);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { id: "41" },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_NOT_IN: [2020, 2000] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2001 });
        await createMovie({ releasedIn: 2000 });

        await updateMovie("releasedIn", 2001, 2000);
        await updateMovie("releasedIn", 2000, 2021);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { releasedIn: 2000 },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_NOT_IN: [4.20, 9.2] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.21 });
        await createMovie({ averageRating: 9.2 });

        await updateMovie("averageRating", 4.21, 4.2);
        await updateMovie("averageRating", 9.2, 9);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { averageRating: 4.2 },
                },
            },
        ]);
    });
    test("subscription with NOT_IN on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { fileSize_NOT_IN: ["922372036854775608"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: "922372036854775608" });
        await createMovie({ fileSize: "100" });

        await updateMovie("fileSize", "922372036854775608", "922372036854775607");
        await updateMovie("fileSize", "100", "101");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { fileSize: "101" },
                },
            },
        ]);
    });

    test("subscription with IN on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_IN: [true] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong1", isFavorite: true });
        await createMovie({ title: "some_movie_wrong2", isFavorite: true });

        await updateMovie("title", "some_movie_wrong1", "some_movie_wrong11");
        await updateMovie("title", "some_movie_wrong2", "some_movie_wrong22");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_IN on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_NOT_IN: [true] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong3", isFavorite: true });
        await createMovie({ title: "some_movie_wrong4", isFavorite: true });

        await updateMovie("title", "some_movie_wrong3", "some_movie_wrong33");
        await updateMovie("title", "some_movie_wrong4", "some_movie_wrong44");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with IN on Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_IN: ["fight club"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong5", similarTitles: ["fight club"] });
        await createMovie({ title: "some_movie_wrong6" });

        await updateMovie("title", "some_movie_wrong5", "some_movie_wrong55");
        await updateMovie("title", "some_movie_wrong6", "some_movie_wrong66");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_IN on Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_NOT_IN: ["blue"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "some_movie_wrong7", similarTitles: ["blue bus"] });
        await createMovie({ title: "some_movie_wrong8" });

        await updateMovie("title", "some_movie_wrong7", "some_movie_wrong77");
        await updateMovie("title", "some_movie_wrong8", "some_movie_wrong88");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    // NOT operator tests
    test("update subscription with where filter NOT 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { NOT: { title: "movie5" } }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie5" });
        await createMovie({ title: "movie6" });

        await updateMovie("title", "movie5", "movie7");
        await updateMovie("title", "movie6", "movie8");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie8" },
                },
            },
        ]);
    });
    test("update subscription with where filter NOT multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { NOT: { title: "movie2" } }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie5" });
        await createMovie({ title: "movie6" });

        await updateMovie("title", "movie5", "movie7");
        await updateMovie("title", "movie6", "movie8");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie7" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie8" },
                },
            },
        ]);
    });
    test("create subscription with where property + OR match nothing, NOT", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title: "movie2", OR: [{ releasedIn: 2001}, {title: "movie2", releasedIn: 2020}] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie3", releasedIn: 2001 });

        await updateMovie("title", "movie1", "movie4");
        await updateMovie("title", "movie2", "movie5");
        await updateMovie("title", "movie3", "movie6");

        // forcing a delay to ensure events do not exist
        await delay(3);
        expect(wsClient.errors).toEqual([]);
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
