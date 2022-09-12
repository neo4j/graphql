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
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie1", similarTitles: ["dummy", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie2", similarTitles: ["mock"] });

        await updateMovie("title", "movie1", "movie1.1");
        await updateMovie("title", "movie2", "movie2.2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1.1" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarIds_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie5", similarIds: ["1", "12"] });
        await createMovie({ id: generateRandom(), title: "movie6", similarIds: ["11"] });

        await updateMovie("title", "movie5", "movie5.5");
        await updateMovie("title", "movie6", "movie6.6");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie5.5" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarIds_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie9", similarIds: [42] });
        await createMovie({ id: generateRandom(), title: "movie10", similarIds: [4, 2] });

        await updateMovie("title", "movie9", "movie9.9");
        await updateMovie("title", "movie10", "movie10.0");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie9.9" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allDates_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie13", allDates: [2020, 2019] });
        await createMovie({ id: generateRandom(), title: "movie14", allDates: [2019] });

        await updateMovie("title", "movie13", "movie13.3");
        await updateMovie("title", "movie14", "movie14.4");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie13.3" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie14.4" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allRatings_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie17", allRatings: [6, 5.4] });
        await createMovie({ id: generateRandom(), title: "movie18", allRatings: [5.0] });

        await updateMovie("title", "movie17", "movie17.7");
        await updateMovie("title", "movie18", "movie18.8");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie17.7" },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allSizes_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({
            id: generateRandom(),
            title: "movie21",
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ id: generateRandom(), title: "movie22", allSizes: ["123"] });

        await updateMovie("title", "movie21", "movie21.1");
        await updateMovie("title", "movie22", "movie22.2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie21.1" },
                },
            },
        ]);
    });

    test("subscription with NOT_INCLUDES on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_NOT_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie3", similarTitles: ["movie", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie4", similarTitles: ["mock"] });

        await updateMovie("title", "movie3", "movie3.3");
        await updateMovie("title", "movie4", "movie4.4");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie4.4" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarIds_NOT_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie7", similarIds: ["1", "12"] });
        await createMovie({ id: generateRandom(), title: "movie8", similarIds: ["11"] });

        await updateMovie("title", "movie7", "movie7.7");
        await updateMovie("title", "movie8", "movie8.8");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie8.8" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarIds_NOT_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie11", similarIds: [2, 4, 42] });
        await createMovie({ id: generateRandom(), title: "movie12", similarIds: [4, 2] });

        await updateMovie("title", "movie11", "movie11.1");
        await updateMovie("title", "movie12", "movie12.2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie12.2" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allDates_NOT_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie15", allDates: [2020, 2018] });
        await createMovie({ id: generateRandom(), title: "movie16", allDates: [] });

        await updateMovie("title", "movie15", "movie15.5");
        await updateMovie("title", "movie16", "movie16.6");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie15.5" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie16.6" },
                },
            },
        ]);
    });
    test("subscription with NOT_INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allRatings_NOT_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ id: generateRandom(), title: "movie19", allRatings: [6, 5.4] });
        await createMovie({ id: generateRandom(), title: "movie20", allRatings: [5.4] });

        await updateMovie("title", "movie19", "movie19.9");
        await updateMovie("title", "movie20", "movie20.0");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allSizes_NOT_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({
            id: generateRandom(),
            title: "movie22",
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ id: generateRandom(), title: "movie23", allSizes: ["123"] });

        await updateMovie("title", "movie22", "movie22.2");
        await updateMovie("title", "movie23", "movie23.3");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie23.3" },
                },
            },
        ]);
    });

    test("subscription with INCLUDES on String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_INCLUDES: ["movie"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie24", similarTitles: ["dummy", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie25", similarTitles: ["mock"] });

        await updateMovie("title", "movie24", "movie24.4");
        await updateMovie("title", "movie25", "movie25.5");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with INCLUDES on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_INCLUDES: true }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie26", isFavorite: true });
        await createMovie({ id: generateRandom(), title: "movie27", isFavorite: false });

        await updateMovie("title", "movie26", "movie26.6");
        await updateMovie("title", "movie27", "movie27.7");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_INCLUDES on String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_NOT_INCLUDES: ["movie"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie28", similarTitles: ["dummy", "movie"] });
        await createMovie({ id: generateRandom(), title: "movie29", similarTitles: ["mock"] });

        await updateMovie("title", "movie28", "movie28.8");
        await updateMovie("title", "movie29", "movie29.9");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with NOT_INCLUDES on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_NOT_INCLUDES: true }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ id: generateRandom(), title: "movie30", isFavorite: true });
        await createMovie({ id: generateRandom(), title: "movie31", isFavorite: false });

        await updateMovie("title", "movie30", "movie30.0");
        await updateMovie("title", "movie31", "movie31.1");

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
