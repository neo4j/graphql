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
import { UniqueType } from "../../../utils/graphql-types";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../setup/ws-client";
import Neo4j from "../../setup/neo4j";

describe("Create Subscription with optional filters valid for all types", () => {
    let neo4j: Neo4j;
    let driver: Driver;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;

    beforeEach(async () => {
        typeMovie = new UniqueType("Movie");
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

    test("subscription with where filter NOT title 1 result", async () => {
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT title multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { title: "movie0"  }}) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

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
    test("subscription with where filter NOT empty result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { title: "movie1"  }}) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });

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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("create subscription with where property + OR with filters match 1", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn_GTE: 2000, OR: [{ NOT: { title_STARTS_WITH: "movie", releasedIn: 2001}}, {title: "movie4", releasedIn: 1000}] }) {
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with NOT title_IN on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { title_IN: ["movie", "movie1"] } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 2019 },
                },
            },
        ]);
    });
    test("subscription with NOT IN on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { releasedIn_IN: [2019, 2020] } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2019 });
        await createMovie({ releasedIn: 2000 });

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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 5.9 },
                },
            },
        ]);
    });
    test("subscription with NOT IN on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { averageRating_IN: [5.9, 7] } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 5.9 });
        await createMovie({ averageRating: 7 });

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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: "9223372036854775508" },
                },
            },
        ]);
    });
    test("subscription with NOT IN on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { NOT: { fileSize_IN: [9223372036854775608, 9223372036854775508] }}) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: "9223372036854775508" });
        await createMovie({ fileSize: "1234" });

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
    test("subscription with NOT IN on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { NOT: { isFavorite_IN: [true] } }) {
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
    test("subscription with NOT IN on Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { NOT: { similarTitles_IN: ["blue"] } }) {
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
