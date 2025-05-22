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

import type { Response } from "supertest";
import supertest from "supertest";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("Create Subscription with filters valid of number types (Int, Float, BigInt)", () => {
    const testHelper = new TestHelper({ cdc: true });
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;

    beforeAll(async () => {
        await testHelper.assertCDCEnabled();
    });

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        const typeDefs = `
         type ${typeMovie} @node @subscription {
            id: ID
            title: String
            similarTitles: [String!]
            releasedIn: Int
            averageRating: Float
            fileSize: BigInt
            isFavorite: Boolean
         }
         `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: await testHelper.getSubscriptionEngine(),
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
        await server.close();
        await testHelper.close();
    });

    test("subscription with where filter using lt for Int 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn: { lt: 2000 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 1999 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 1999 },
                },
            },
        ]);
    });

    test("subscription with where filter using lte for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn: { lte: 2000 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 1999 });
        await createMovie({ releasedIn: 2999 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 2000 },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 1999 },
                },
            },
        ]);
    });

    test("subscription with where filter using gt for Int 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn: { gt: 2000 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2000 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 2020 },
                },
            },
        ]);
    });

    test("subscription with where filter using gte for Int multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { releasedIn: { gte: 2000 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        releasedIn
                    }
                }
            }
        `);

        await createMovie({ releasedIn: 1920 });
        await createMovie({ releasedIn: 2000 });
        await createMovie({ releasedIn: 2030 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 2000 },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { releasedIn: 2030 },
                },
            },
        ]);
    });

    test("subscription with where filter using lt for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { averageRating: { lt: 8 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 8.0 });
        await createMovie({ averageRating: 5 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 5 },
                },
            },
        ]);
    });

    test("subscription with where filter using lte for Float multiple result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { averageRating: { lte: 7 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 6.7 });
        await createMovie({ averageRating: 7.0 });
        await createMovie({ averageRating: 7.1 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 6.7 },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 7 },
                },
            },
        ]);
    });

    test("subscription with where filter using gt for Float 1 result", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { averageRating: {gt: 7.9} }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 8 });
        await createMovie({ averageRating: 7.9 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 8 },
                },
            },
        ]);
    });
    test("subscription with where filter using gte for Float multiple results", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { averageRating: {gte: 5} }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.1 });
        await createMovie({ averageRating: 5.3 });
        await createMovie({ averageRating: 6.2 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 5.3 },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 6.2 },
                },
            },
        ]);
    });
    test("subscription with where filter using gte for Float multiple results no decimals", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { averageRating: {gte: 4.2} }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        averageRating
                    }
                }
            }
        `);

        await createMovie({ averageRating: 4.1 });
        await createMovie({ averageRating: 5 });
        await createMovie({ averageRating: 6.2 });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 5 },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { averageRating: 6.2 },
                },
            },
        ]);
    });

    test("subscription with where filter using lt for BigInt 1 result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { fileSize: { lt: ${bigInts.m} } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.s });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: bigInts.s },
                },
            },
        ]);
    });

    test("subscription with where filter using lte for BigInt multiple result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { fileSize: { lte: ${bigInts.m} } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.s });
        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.l });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: bigInts.s },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: bigInts.m },
                },
            },
        ]);
    });

    test("subscription with where filter using gt for BigInt 1 result", async () => {
        const bigInts = {
            m: "9223372036854775708",
            l: "9223372036854775710",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { fileSize: { gt: ${bigInts.m} } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.l });
        await createMovie({ fileSize: bigInts.m });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: bigInts.l },
                },
            },
        ]);
    });

    test("subscription with where filter using gte for BigInt multiple result", async () => {
        const bigInts = {
            s: "9223372036854775608",
            m: "9223372036854775708",
            l: "9223372036854775807",
        };
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { fileSize: { gte: ${bigInts.m} } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        fileSize
                    }
                }
            }
        `);

        await createMovie({ fileSize: bigInts.s });
        await createMovie({ fileSize: bigInts.m });
        await createMovie({ fileSize: bigInts.l });

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: bigInts.m },
                },
            },
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { fileSize: bigInts.l },
                },
            },
        ]);
    });

    test("subscription with where filter using lt for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: { lt: "test" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using lte for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: { lte: "test" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using gt for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: { gt: "abc" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using gte for String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { title: { gte: "abc" } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using lt for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { id: { lt: 50 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ id: 42 });
        await createMovie({ id: 24 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using lte for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { id: { lte: 50 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ id: 40 });
        await createMovie({ id: 20 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using gt for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { id: { gt: 2 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ id: 5 });
        await createMovie({ id: 3 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using gte for ID as Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { id: { gte: 1 } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        id
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ id: 4 });
        await createMovie({ id: 2 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using lt for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { isFavorite: { lt: true } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({});
        await createMovie({});

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using lte for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { isFavorite: { lte: false } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({});
        await createMovie({});

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using gt for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { isFavorite: { gt: false } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({});
        await createMovie({});

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using gte for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.created}(where: { isFavorite: { gte: false } }) {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ title: "movie1" });
        await createMovie({ title: "movie2" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using gte for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles: { gte: "test" } }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarTitles
                    }
                }
            }
            `,
            onReturnError
        );

        await createMovie({ similarTitles: ["dummy"] });
        await createMovie({ similarTitles: ["test"] });

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
});
