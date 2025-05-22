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

describe("Create Subscription with filters valid on string types (String, ID)", () => {
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
    test("subscription with where filter using startsWith for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title: { startsWith: "movie" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "movie1" });
        await createMovie({ title: "mvie2" });

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

    test("subscription with where filter using startsWith for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id: { startsWith: "dummy" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy1" });
        await createMovie({ id: "not-dummy1" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "dummy1" },
                },
            },
        ]);
    });

    test("subscription with where filter using startsWith for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id: { startsWith: 1 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 1 });
        await createMovie({ id: 2 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "1" },
                },
            },
        ]);
    });

    test("subscription with where filter using endsWith for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title: { endsWith: "movie1" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "test-movie1" });
        await createMovie({ title: "test-movie2" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "test-movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter using endsWith for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id: { endsWith: "dummy" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "not-dummy" });
        await createMovie({ id: "dummy2" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "not-dummy" },
                },
            },
        ]);
    });

    test("subscription with where filter using endsWith for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id: { endsWith: 3 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 13 });
        await createMovie({ id: 31 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "13" },
                },
            },
        ]);
    });

    test("subscription with where filter using contains for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { title: { contains: "movie1" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "test-movie2" });
        await createMovie({ title: "test2-movie1" });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { title: "test2-movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter using contains for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id: { contains: "dummy" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: 2 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "dummy-not" },
                },
            },
        ]);
    });

    test("subscription with where filter using contains for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { id: { contains: 3 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 1 });

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: { id: "31" },
                },
            },
        ]);
    });

    test("subscription with where filter using contains for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { releasedIn: { contains: 2020 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    releasedIn
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2021 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using contains for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { averageRating: { contains: 5 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ averageRating: 5.6 });
        await createMovie({ averageRating: 5.2 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using contains for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { fileSize: { contains: "12" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ fileSize: "3412" });
        await createMovie({ fileSize: "1234" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using contains for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { isFavorite: { contains: false } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
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

    test("subscription with where filter using contains for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { similarTitles: { contains: "test" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ similarTitles: ["test"] });
        await createMovie({ similarTitles: ["test"] });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using startsWith for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { releasedIn: { startsWith: 2 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2021 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using startsWith for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { averageRating: { startsWith: 6 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ averageRating: 6.2 });
        await createMovie({ averageRating: 6.3 });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using startsWith for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { fileSize: { startsWith: 2 } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ fileSize: "2020" });
        await createMovie({ fileSize: "2021" });

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter using startsWith for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { isFavorite: { startsWith: "f" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
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

    test("subscription with where filter using startsWith for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.created}(where: { similarTitles: { startsWith: "test" } }) {
                ${typeMovie.operations.subscribe.payload.created} {
                    id
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ similarTitles: ["test"] });
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
