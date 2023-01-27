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

describe("Delete Subscription", () => {
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

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();

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

        await createMovie({ title: "movie_starts_with1" });
        await createMovie({ title: "mvie2" });

        await deleteMovie("title", "mvie2");
        await deleteMovie("title", "movie_starts_with1");

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
                id
            }
        }
    }
`);

        await createMovie({ id: "dummy1", title: "movie1" });
        await createMovie({ id: "not-dummy1", title: "movie2" });

        await deleteMovie("id", "dummy1");
        await deleteMovie("id", "not-dummy1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "dummy1" },
                },
            },
        ]);
    });
    test("subscription with where filter STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_STARTS_WITH: 1 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                id
            }
        }
    }
`);

        await createMovie({ id: 1 });
        await createMovie({ id: 2 });

        await deleteMovie("id", 1);
        await deleteMovie("id", 2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "1" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT STARTS_WITH for String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { NOT: { title_STARTS_WITH: "movie" } }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ title: "mvie1" });
        await createMovie({ title: "movie2" });

        await deleteMovie("title", "movie2");
        await deleteMovie("title", "mvie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "mvie1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT STARTS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { NOT: { id_STARTS_WITH: "dummy" } }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                id
            }
        }
    }
`);

        await createMovie({ id: "not-dummy1" });
        await createMovie({ id: "dummy2" });

        await deleteMovie("id", "not-dummy1");
        await deleteMovie("id", "dummy2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "not-dummy1" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT STARTS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { NOT: { id_STARTS_WITH: 3 } }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                id
            }
        }
    }
`);

        await createMovie({ id: 2 });
        await createMovie({ id: 3 });

        await deleteMovie("id", 2);
        await deleteMovie("id", 3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "2" },
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

        await createMovie({ title: "test-movie_ends_with" });
        await createMovie({ title: "test-movie2" });

        await deleteMovie("title", "test-movie2");
        await deleteMovie("title", "test-movie_ends_with");

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
                id
            }
        }
    }
`);

        await createMovie({ id: "id_ends_with" });
        await createMovie({ id: "dummy2" });

        await deleteMovie("id", "id_ends_with");
        await deleteMovie("id", "dummy2");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "id_ends_with" },
                },
            },
        ]);
    });
    test("subscription with where filter ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_ENDS_WITH: 3 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                id
            }
        }
    }
`);

        await createMovie({ id: 13 });
        await createMovie({ id: 31 });

        await deleteMovie("id", 13);
        await deleteMovie("id", 31);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "13" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT ENDS_WITH for String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { NOT: { title_ENDS_WITH: "movie_not_ends_with" } }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                title
            }
        }
    }
`);

        await createMovie({ title: "test-movie_not_ends_with" });
        await createMovie({ title: "test-not_ends_with" });

        await deleteMovie("title", "test-movie_not_ends_with");
        await deleteMovie("title", "test-not_ends_with");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "test-not_ends_with" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT ENDS_WITH for ID as String", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { NOT: { id_ENDS_WITH: "dummy" } }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                id
            }
        }
    }
`);

        await createMovie({ id: "dummy-not", title: "movie1" });
        await createMovie({ id: "2dummy", title: "movie2" });

        await deleteMovie("id", "dummy-not");
        await deleteMovie("id", "2dummy");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "dummy-not" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT ENDS_WITH for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { NOT: { id_ENDS_WITH: 3 } }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                id
            }
        }
    }
`);

        await createMovie({ id: 31 });
        await createMovie({ id: 13 });

        await deleteMovie("id", 31);
        await deleteMovie("id", 13);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "31" },
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

        await createMovie({ title: "test-movie2" });
        await createMovie({ title: "test2-movie1" });

        await deleteMovie("title", "test-movie2");
        await deleteMovie("title", "test2-movie1");

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
                id
            }
        }
    }
`);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: 2 });

        await deleteMovie("id", "dummy-not");
        await deleteMovie("id", 2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "dummy-not" },
                },
            },
        ]);
    });
    test("subscription with where filter CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
    subscription {
        ${typeMovie.operations.subscribe.deleted}(where: { id_CONTAINS: 3 }) {
            ${typeMovie.operations.subscribe.payload.deleted} {
                id
            }
        }
    }
`);

        await createMovie({ id: 31 });
        await createMovie({ id: 1 });

        await deleteMovie("id", 31);
        await deleteMovie("id", 1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "31" },
                },
            },
        ]);
    });

    test("subscription with where filter NOT CONTAINS for String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { NOT: { title_CONTAINS: "movie1" } }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
            }
        }
    `);

        await createMovie({ title: "test2-movie2" });
        await createMovie({ title: "test2-movie1" });

        await deleteMovie("title", "test2-movie2");
        await deleteMovie("title", "test2-movie1");

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "test2-movie2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT CONTAINS for ID as String", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { NOT: { id_CONTAINS: "dummy" } }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: "dummy-not" });
        await createMovie({ id: 2 });

        await deleteMovie("id", "dummy-not");
        await deleteMovie("id", 2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "2" },
                },
            },
        ]);
    });
    test("subscription with where filter NOT CONTAINS for ID as Int", async () => {
        await wsClient.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { NOT: { id_CONTAINS: 3  }}) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    id
                }
            }
        }
    `);

        await createMovie({ id: 31 });
        await createMovie({ id: 1 });

        await deleteMovie("id", 31);
        await deleteMovie("id", 1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { id: "1" },
                },
            },
        ]);
    });

    test("subscription with where filter CONTAINS for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_CONTAINS: 2020 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    releasedIn
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2021 });

        await deleteMovie("releasedIn", 2020);
        await deleteMovie("releasedIn", 2021);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { averageRating_CONTAINS: 5 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    averageRating
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ averageRating: 5.6 });
        await createMovie({ averageRating: 5.2 });

        await deleteMovie("averageRating", 5.6);
        await deleteMovie("averageRating", 5.2);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { fileSize_CONTAINS: "12" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    fileSize
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ fileSize: "3412" });
        await createMovie({ fileSize: "1234" });

        await deleteMovie("fileSize", "3412");
        await deleteMovie("fileSize", "1234");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_CONTAINS: false }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    isFavorite
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ isFavorite: false, title: "bad_type_string_movie13" });
        await createMovie({ isFavorite: false, title: "bad_type_string_movie14" });

        await deleteMovie("title", "bad_type_string_movie13");
        await deleteMovie("title", "bad_type_string_movie14");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter CONTAINS for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_CONTAINS: "test" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    similarTitles
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie17", similarTitles: ["test"] });
        await createMovie({ title: "bad_type_string_movie8", similarTitles: ["test"] });

        await deleteMovie("title", "bad_type_string_movie17");
        await deleteMovie("title", "bad_type_string_movie18");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    test("subscription with where filter STARTS_WITH for Int should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { releasedIn_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    releasedIn
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ releasedIn: 2020 });
        await createMovie({ releasedIn: 2021 });

        await deleteMovie("releasedIn", 2020);
        await deleteMovie("releasedIn", 2021);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Float should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { averageRating_STARTS_WITH: 6 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    averageRating
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ averageRating: 6.2 });
        await createMovie({ averageRating: 6.3 });

        await deleteMovie("averageRating", 6.2);
        await deleteMovie("averageRating", 6.3);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for BigInt should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { fileSize_STARTS_WITH: 2 }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    fileSize
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ fileSize: "2020" });
        await createMovie({ fileSize: "2021" });

        await deleteMovie("fileSize", "2020");
        await deleteMovie("fileSize", "2021");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { isFavorite_STARTS_WITH: "f" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    isFavorite
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ isFavorite: false, title: "bad_type_string_movie33" });
        await createMovie({ isFavorite: false, title: "bad_type_string_movie34" });

        await deleteMovie("title", "bad_type_string_movie33");
        await deleteMovie("title", "bad_type_string_movie34");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with where filter STARTS_WITH for Array should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
        subscription {
            ${typeMovie.operations.subscribe.deleted}(where: { similarTitles_STARTS_WITH: "test" }) {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    similarTitles
                }
            }
        }
    `,
            onReturnError
        );

        await createMovie({ title: "bad_type_string_movie37", similarTitles: ["test"] });
        await createMovie({ title: "bad_type_string_movie38", similarTitles: ["test"] });

        await deleteMovie("title", "bad_type_string_movie37");
        await deleteMovie("title", "bad_type_string_movie38");

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

    async function deleteMovie(fieldName: string, value: number | string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.delete}(where: { ${fieldName}: ${makeTypedFieldValue(value)} }) {
                            nodesDeleted
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
