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

describe("Delete Subscription", () => {
    let neo4j: Neo4j;
    let driver: Driver;

    const typeMovie = generateUniqueType("Movie");

    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;

    beforeAll(async () => {
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

    test("subscription with where filter STARTS_WITH for String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { title_STARTS_WITH: "movie_starts_with" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: generateRandom(), title: "movie_starts_with1" });
        await createMovie({ id: generateRandom(), title: "mvie2" });

        await deleteMovie("mvie2");
        await deleteMovie("movie_starts_with1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie_starts_with1" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_STARTS_WITH: "dummy" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: "dummy1", title: "movie1" });
        await createMovie({ id: "not-dummy1", title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_STARTS_WITH: 1 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: 1, title: "movie1" });
        await createMovie({ id: 2, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_STARTS_WITH for String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { title_NOT_STARTS_WITH: "movie" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: generateRandom(), title: "mvie1" });
        await createMovie({ id: generateRandom(), title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("mvie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "mvie1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_STARTS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_NOT_STARTS_WITH: "dummy" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: "not-dummy1", title: "movie1" });
        await createMovie({ id: "dummy2", title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_NOT_STARTS_WITH: 3 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: 2, title: "movie1" });
        await createMovie({ id: 3, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter ENDS_WITH for String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { title_ENDS_WITH: "movie_ends_with" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: generateRandom(), title: "test-movie_ends_with" });
        await createMovie({ id: generateRandom(), title: "test-movie2" });

        await deleteMovie("test-movie2");
        await deleteMovie("test-movie_ends_with");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "test-movie_ends_with" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_ENDS_WITH: "id_ends_with" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: "id_ends_with", title: "movie1" });
        await createMovie({ id: "dummy2", title: "movie-id_ends_with" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_ENDS_WITH: 3 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: 13, title: "movie1" });
        await createMovie({ id: 31, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_ENDS_WITH for String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { title_NOT_ENDS_WITH: "movie_not_ends_with" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: generateRandom(), title: "test-movie_not_ends_with" });
        await createMovie({ id: generateRandom(), title: "test-not_ends_with" });

        await deleteMovie("test-movie_not_ends_with");
        await deleteMovie("test-not_ends_with");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "test-not_ends_with" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_ENDS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_NOT_ENDS_WITH: "dummy" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: "dummy-not", title: "movie1" });
        await createMovie({ id: "2dummy", title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_NOT_ENDS_WITH: 3 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: 31, title: "movie1" });
        await createMovie({ id: 13, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter CONTAINS for String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { title_CONTAINS: "movie1" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: generateRandom(), title: "test-movie2" });
        await createMovie({ id: generateRandom(), title: "test2-movie1" });

        await deleteMovie("test-movie2");
        await deleteMovie("test2-movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "test2-movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_CONTAINS: "dummy" }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: "dummy-not", title: "movie1" });
        await createMovie({ id: 2, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_CONTAINS: 3 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ id: 31, title: "movie1" });
        await createMovie({ id: 1, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie1" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT_CONTAINS for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { title_NOT_CONTAINS: "movie1" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "test2-movie2" });
        await createMovie({ id: generateRandom(), title: "test2-movie1" });

        await deleteMovie("test2-movie2");
        await deleteMovie("test2-movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "test2-movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_CONTAINS for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { id_NOT_CONTAINS: "dummy" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not", title: "movie1" });
        await createMovie({ id: 2, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT_CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { id_NOT_CONTAINS: 3 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: 31, title: "movie1" });
        await createMovie({ id: 1, title: "movie2" });

        await deleteMovie("movie2");
        await deleteMovie("movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "movie2" },
                },
            },
        ]);
    });

    test("subscription with where filter CONTAINS for Int should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_CONTAINS: 2020 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie1", releasedIn: 2020 });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie2", releasedIn: 2021 });

        await deleteMovie("bad_type_string_movie1");
        await deleteMovie("bad_type_string_movie2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Float should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { averageRating_CONTAINS: 5 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie5", averageRating: 5.6 });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie6", averageRating: 5.2 });

        await deleteMovie("bad_type_string_movie5");
        await deleteMovie("bad_type_string_movie6");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for BigInt should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { fileSize_CONTAINS: "12" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie9", fileSize: "3412" });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie10", fileSize: "1234" });

        await deleteMovie("bad_type_string_movie9");
        await deleteMovie("bad_type_string_movie10");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Boolean should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_CONTAINS: false }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie13" });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie14" });

        await deleteMovie("bad_type_string_movie13");
        await deleteMovie("bad_type_string_movie14");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Array should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_CONTAINS: "test" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie17", similarTitles: ["test"] });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie8", similarTitles: ["test"] });

        await deleteMovie("bad_type_string_movie17");
        await deleteMovie("bad_type_string_movie18");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter STARTS_WITH for Int should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie21", releasedIn: 2020 });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie22", releasedIn: 2021 });

        await deleteMovie("bad_type_string_movie21");
        await deleteMovie("bad_type_string_movie22");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Float should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { averageRating_STARTS_WITH: 6 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie25", averageRating: 6.2 });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie26", averageRating: 6.3 });

        await deleteMovie("bad_type_string_movie25");
        await deleteMovie("bad_type_string_movie26");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for BigInt should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { fileSize_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie29", fileSize: "2020" });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie30", fileSize: "2021" });

        await deleteMovie("bad_type_string_movie29");
        await deleteMovie("bad_type_string_movie30");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Boolean should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_STARTS_WITH: "f" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie33" });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie34" });

        await deleteMovie("bad_type_string_movie33");
        await deleteMovie("bad_type_string_movie34");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Array should not work", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_STARTS_WITH: "test" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: generateRandom(), title: "bad_type_string_movie37", similarTitles: ["test"] });
        await createMovie({ id: generateRandom(), title: "bad_type_string_movie38", similarTitles: ["test"] });

        await deleteMovie("bad_type_string_movie37");
        await deleteMovie("bad_type_string_movie38");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    const generateRandom = () => Math.floor(Math.random() * 100) + 1;
    const makeTypedFieldValue = (value) => (typeof value === "string" ? `"${value}"` : value);
    async function createMovie({
        id,
        title,
        similarTitles = ["abc"],
        releasedIn = 2019,
        averageRating = 5.5,
        fileSize = "12345",
        isFavorite = false,
    }): Promise<Response> {
        const movieInput = `{ id: ${makeTypedFieldValue(
            id
        )}, title: "${title}", releasedIn: ${releasedIn}, isFavorite: ${isFavorite}, averageRating: ${averageRating}, fileSize: "${fileSize}", similarTitles: [${similarTitles?.map(
            makeTypedFieldValue
        )}] }`;

        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [${movieInput}]) {
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
