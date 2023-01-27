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

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();

        await server.close();
        await driver.close();
    });

    test("subscription with INCLUDES on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { similarTitles_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        similarTitles
                    }
                }
            }
        `);

        await createMovie({ similarTitles: ["dummy", "movie"] });
        await createMovie({ similarTitles: ["mock"] });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { similarTitles: ["dummy", "movie"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { similarIds_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: ["1", "12"] });
        await createMovie({ similarIds: ["11"] });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { similarIds: ["1", "12"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { similarIds_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: [42] });
        await createMovie({ similarIds: [4, 2] });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { similarIds: ["42"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { allDates_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        allDates
                    }
                }
            }
        `);

        await createMovie({ allDates: [2020, 2019] });
        await createMovie({ allDates: [2019] });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { allDates: [2020, 2019] },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { allDates: [2019] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { allRatings_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        allRatings
                    }
                }
            }
        `);

        await createMovie({ allRatings: [6, 5.4] });
        await createMovie({ allRatings: [5.0] });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { allRatings: [6, 5.4] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { allSizes_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        allSizes
                    }
                }
            }
        `);

        await createMovie({
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ allSizes: ["123"] });

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: {
                        allSizes: ["9223372036854775608", "922372036854775608"],
                    },
                },
            },
        ]);
    });


    test("subscription with INCLUDES on String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { similarTitles_INCLUDES: ["movie"] }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ similarTitles: ["dummy", "movie"] });
        await createMovie({ similarTitles: ["mock"] });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with INCLUDES on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { isFavorite_INCLUDES: true }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ isFavorite: true });
        await createMovie({ isFavorite: false });

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
});
