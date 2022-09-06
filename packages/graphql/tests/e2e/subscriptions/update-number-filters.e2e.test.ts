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
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../setup/ws-client";
import Neo4j from "../setup/neo4j";

describe("Update Subscriptions", () => {
    let neo4j: Neo4j;
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
        const typeDefs = `
         type ${typeMovie} {
            title: String
            releasedIn: Int
            averageRating: Float
            fileSize: BigInt
         }
         `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
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

    test("subscription with where filter _LT for Int 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_LT: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 1999 });

        await updateMovie("releasedIn", 2000, 2001);
        await updateMovie("releasedIn", 1999, 1998);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_LTE: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2000 });
        await createMovie({ title: "movie2", releasedIn: 1999 });
        await createMovie({ title: "movie3", releasedIn: 2999 });

        await updateMovie("releasedIn", 2000, 1920);
        await updateMovie("releasedIn", 1999, 1997);
        await updateMovie("releasedIn", 2999, 2998);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for Int 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_GT: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 2020 });
        await createMovie({ title: "movie2", releasedIn: 2000 });

        await updateMovie("releasedIn", 2020, 2021);
        await updateMovie("releasedIn", 2000, 2001);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { releasedIn_GTE: 2000 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", releasedIn: 1920 });
        await createMovie({ title: "movie2", releasedIn: 2000 });
        await createMovie({ title: "movie3", releasedIn: 2030 });

        await updateMovie("releasedIn", 1920, 2020);
        await updateMovie("releasedIn", 2000, 2021);
        await updateMovie("releasedIn", 2030, 1999);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
        ]);
    });

    test("subscription with where filter _LT for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_LT: 8 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", averageRating: 8.0 });
        await createMovie({ title: "movie2", averageRating: 5.0 });

        await updateMovie("averageRating", 8, 7.5);
        await updateMovie("averageRating", 5, 9);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter _LTE for Float multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_LTE: 7 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", averageRating: 6.7 });
        await createMovie({ title: "movie2", averageRating: 7.0 });
        await createMovie({ title: "movie3", averageRating: 7.1 });

        await updateMovie("averageRating", 6.7, 7.2);
        await updateMovie("averageRating", 7, 7.9);
        await updateMovie("averageRating", 7.1, 6.7);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter _GT for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_GT: 7.9 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", averageRating: 8 });
        await createMovie({ title: "movie2", averageRating: 7.9 });

        await updateMovie("averageRating", 8.0, 7.9);
        await updateMovie("averageRating", 7.9, 7.2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Float multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_GTE: 5 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", averageRating: 4.1 });
        await createMovie({ title: "movie2", averageRating: 5.3 });
        await createMovie({ title: "movie3", averageRating: 6.2 });

        await updateMovie("averageRating", 4.1, 7.9);
        await updateMovie("averageRating", 5.3, 7.7);
        await updateMovie("averageRating", 6.2, 7.2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
        ]);
    });
    test("subscription with where filter _GTE for Float multiple results no decimals", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { averageRating_GTE: 4.2 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", averageRating: 4.1 });
        await createMovie({ title: "movie2", averageRating: 5 });
        await createMovie({ title: "movie3", averageRating: 6.2 });

        await updateMovie("averageRating", 4.1, 7.9);
        await updateMovie("averageRating", 5, 5.9);
        await updateMovie("averageRating", 6.2, 6.7);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
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
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", fileSize: bigInts.m });
        await createMovie({ title: "movie2", fileSize: bigInts.s });

        await updateMovie("fileSize", bigInts.m, bigInts.dummyL);
        await updateMovie("fileSize", bigInts.s, bigInts.m);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
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
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", fileSize: bigInts.dummyS });
        await createMovie({ title: "movie2", fileSize: bigInts.dummyM });
        await createMovie({ title: "movie3", fileSize: bigInts.l });

        await updateMovie("fileSize", bigInts.dummyS, bigInts.s);
        await updateMovie("fileSize", bigInts.dummyM, bigInts.dummyS);
        await updateMovie("fileSize", bigInts.l, bigInts.dummyL);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
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
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", fileSize: bigInts.l });
        await createMovie({ title: "movie2", fileSize: bigInts.m });

        await updateMovie("fileSize", bigInts.l, bigInts.s);
        await updateMovie("fileSize", bigInts.m, bigInts.dummyS);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1" },
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
                        title
                    }
                }
            }
        `);

        await createMovie({ title: "movie1", fileSize: bigInts.s });
        await createMovie({ title: "movie2", fileSize: bigInts.m });
        await createMovie({ title: "movie3", fileSize: bigInts.l });

        await updateMovie("fileSize", bigInts.s, bigInts.s);
        await updateMovie("fileSize", bigInts.m, bigInts.s);
        await updateMovie("fileSize", bigInts.l, bigInts.dummyM);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
        ]);
    });

    // ======================================
    test.skip("bad data in db", async () => {
        // IMPORTANT: skipping this test for now bc. `session.run` seems to be using another db than the one that the lib uses.

        // TODO: test BigInt with db having bad data (field having values that contain letters)
        // - currently anything going through the library gets converted as: "<all_letters>"=0
        // - might be fixed with 4.4.8 version of neo4j-driver
        // attempt creating a movie through Cypher with fileSize=bigInts.m and make sure the update does not take it into account

        // TODO: replicate this test on delete action

        const session = await neo4j.getSession();

        const bigInts = {
            s: "9223372036854775608",
            m: "bbcdefghsgtfgjlkgdb",
            l: "9223372036854775807",
        };
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.updated}(where: { fileSize_GTE: "${bigInts.m}" }) {
                ${typeMovie.operations.subscribe.payload.updated} {
                    title
                }
            }
        }
    `);

        try {
            await session.run(`
            CREATE (:Movie {title: "Bad Movie", releasedIn: 2022, averageRating: 9.9, fileSize: 0})
        `);
        } finally {
            await session.close();
        }

        await createMovie({ title: "movie1", fileSize: bigInts.s });
        await createMovie({ title: "movie2", fileSize: bigInts.m });
        await createMovie({ title: "movie3", fileSize: bigInts.l });

        await updateMovie("fileSize", "0", "123456789");
        await updateMovie("fileSize", bigInts.m, "123456789");
        await updateMovie("fileSize", bigInts.s, "1234567891115");
        await updateMovie("fileSize", bigInts.l, "222233456789");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie1" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie2" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "Bad Movie" },
                },
            },
        ]);
    });

    const makeTypedFieldValue = (value) => (typeof value === "string" ? `"${value}"` : value);
    async function createMovie({
        title,
        releasedIn = 2022,
        averageRating = 9.5,
        fileSize = "2147483647",
    }): Promise<Response> {
        const movieInput = `{ title: "${title}", releasedIn: ${releasedIn}, averageRating: ${averageRating}, fileSize: "${fileSize}" }`;
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                        mutation {
                            ${typeMovie.operations.create}(input: [${movieInput}]) {
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
