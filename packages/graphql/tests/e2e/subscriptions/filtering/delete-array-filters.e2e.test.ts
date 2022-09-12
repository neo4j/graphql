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
import { generateUniqueType } from "../../../utils/graphql-types";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../../setup/ws-client";
import Neo4j from "../../setup/neo4j";

describe("Create Subscription with optional filters valid for all types", () => {
    let neo4j: Neo4j;
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
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

    test("subscription with INCLUDES on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", similarTitles: ["dummy", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie2", similarTitles: ["mock"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", similarIds: ["1", "12"] });
        await createMovie({ id: generateRandom(), title: "movie2", similarIds: ["11"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", similarIds: [42] });
        await createMovie({ id: generateRandom(), title: "movie2", similarIds: [4, 2] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allDates_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", allDates: [2020, 2019] });
        await createMovie({ id: generateRandom(), title: "movie2", allDates: [2019] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allRatings_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", allRatings: [6, 5.4] });
        await createMovie({ id: generateRandom(), title: "movie2", allRatings: [5.0] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allSizes_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({
            id: generateRandom(),
            title: "movie1",
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ id: generateRandom(), title: "movie2", allSizes: ["123"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with NOT_INCLUDES on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_NOT_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", similarTitles: ["movie", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie2", similarTitles: ["mock"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_NOT_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", similarIds: ["1", "12"] });
        await createMovie({ id: generateRandom(), title: "movie2", similarIds: ["11"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { similarIds_NOT_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", similarIds: [2, 4, 42] });
        await createMovie({ id: generateRandom(), title: "movie2", similarIds: [4, 2] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allDates_NOT_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", allDates: [2020, 2018] });
        await createMovie({ id: generateRandom(), title: "movie2", allDates: [] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allRatings_NOT_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", allRatings: [6, 5.4] });
        await createMovie({ id: generateRandom(), title: "movie2", allRatings: [5.4] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.deleted}(where: { allSizes_NOT_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.deleted} {
                        title
                    }
                }
            }
        `);

        await createMovie({
            id: generateRandom(),
            title: "movie1",
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ id: generateRandom(), title: "movie2", allSizes: ["123"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
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
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie1", similarTitles: ["dummy", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie2", similarTitles: ["mock"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

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
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie1", isFavorite: true });
        await createMovie({ id: generateRandom(), title: "movie2", isFavorite: false });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

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
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie1", similarTitles: ["dummy", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie2", similarTitles: ["mock"] });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

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
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie1", isFavorite: true });
        await createMovie({ id: generateRandom(), title: "movie2", isFavorite: false });

        await deleteMovie("movie1");
        await deleteMovie("movie2");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    const generateRandom = () => Math.floor(Math.random() * 100) + 1;
    const makeTypedFieldValue = (value) => (typeof value === "string" ? `"${value}"` : value);
    async function createMovie({
        id,
        similarIds = ["a", 2],
        title,
        similarTitles = ["test"],
        releasedIn = 2022,
        allDates = [2042],
        averageRating = 9.5,
        allRatings = [9.9],
        fileSize = "2147483647",
        allSizes = ["42147483647"],
        isFavorite = false,
    }): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ id: ${makeTypedFieldValue(
                    id
                )}, similarIds: [${similarIds.map(
                    makeTypedFieldValue
                )}], title: "${title}", similarTitles: [${similarTitles.map(
                    makeTypedFieldValue
                )}], releasedIn: ${releasedIn}, allDates: [${allDates.map(
                    makeTypedFieldValue
                )}], averageRating: ${averageRating}, allRatings: [${allRatings.map(
                    makeTypedFieldValue
                )}], fileSize: "${fileSize}", allSizes: [${allSizes.map(
                    makeTypedFieldValue
                )}], isFavorite: ${isFavorite} }]) {
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

    async function deleteMovie(title: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.delete}(where: { title: "${title}" }) {
                            nodesDeleted
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
