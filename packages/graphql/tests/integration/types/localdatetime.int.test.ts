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

import faker from "faker";
import { graphql } from "graphql";
import neo4jDriver, { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { parseLocalDateTime } from "../../../src/schema/scalars/LocalDateTime";

describe("LocalDateTime", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create a movie (with a LocalDateTime)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    localDT: LocalDateTime!
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const localDT = faker.date.past().toISOString().split("Z")[0];
            const parsedLocalDateTime = parseLocalDateTime(localDT);

            try {
                const mutation = `
                    mutation ($id: ID!, $localDT: LocalDateTime!) {
                        createMovies(input: { id: $id, localDT: $localDT }) {
                            movies {
                                id
                                localDT
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: mutation,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { id, localDT },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; localDT: string } = graphqlResult.data?.createMovies.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toBe(id);
                expect(parseLocalDateTime(graphqlMovie.localDT)).toStrictEqual(parsedLocalDateTime);

                const neo4jResult = await session.run(
                    `
                        MATCH (movie:Movie {id: $id})
                        RETURN movie {.id, .localDT} as movie
                    `,
                    { id }
                );

                const neo4jMovie: { id: string; localDT: any } = neo4jResult.records[0].toObject().movie;
                expect(neo4jMovie).toBeDefined();
                expect(neo4jMovie.id).toEqual(id);
                expect(neo4jDriver.isLocalDateTime(neo4jMovie.localDT)).toBe(true);
                expect(parseLocalDateTime(neo4jMovie.localDT.toString())).toStrictEqual(parsedLocalDateTime);
            } finally {
                await session.close();
            }
        });

        test("should create a movie (with many Times)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    localDTs: [LocalDateTime!]!
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const localDTs = [...new Array(faker.random.number({ min: 2, max: 4 }))].map(
                () => faker.date.past().toISOString().split("Z")[0]
            );
            const parsedLocalDateTimes = localDTs.map((localDT) => parseLocalDateTime(localDT));

            try {
                const mutation = `
                    mutation ($id: ID!, $localDTs: [LocalDateTime!]!) {
                        createMovies(input: { id: $id, localDTs: $localDTs }) {
                            movies {
                                id
                                localDTs
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: mutation,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { id, localDTs },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; localDTs: string[] } = graphqlResult.data?.createMovies.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toBe(id);
                expect(graphqlMovie.localDTs).toHaveLength(localDTs.length);

                const parsedGraphQLLocalDateTimes = graphqlMovie.localDTs.map((localDT) => parseLocalDateTime(localDT));

                parsedLocalDateTimes.forEach((parsedLocalDateTime) => {
                    expect(parsedGraphQLLocalDateTimes).toContainEqual(parsedLocalDateTime);
                });

                const neo4jResult = await session.run(
                    `
                        MATCH (movie:Movie {id: $id})
                        RETURN movie {.id, .localDTs} as movie
                    `,
                    { id }
                );

                const neo4jMovie: { id: string; localDTs: any[] } = neo4jResult.records[0].toObject().movie;
                expect(neo4jMovie).toBeDefined();
                expect(neo4jMovie.id).toEqual(id);
                expect(neo4jMovie.localDTs).toHaveLength(localDTs.length);

                neo4jMovie.localDTs.forEach((localDT) => {
                    expect(neo4jDriver.isLocalDateTime(localDT)).toBe(true);
                });

                const parsedNeo4jLocalDateTimes = neo4jMovie.localDTs.map((localDT) =>
                    parseLocalDateTime(localDT.toString())
                );

                parsedLocalDateTimes.forEach((parsedLocalDateTime) => {
                    expect(parsedNeo4jLocalDateTimes).toContainEqual(parsedLocalDateTime);
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with a LocalDateTime)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    localDT: LocalDateTime
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const localDT = faker.date.past().toISOString().split("Z")[0];
            const parsedLocalDateTime = parseLocalDateTime(localDT);

            try {
                await session.run(
                    `
                        CREATE (movie:Movie)
                        SET movie = $movie
                    `,
                    { movie: { id } }
                );

                const mutation = `
                    mutation ($id: ID!, $localDT: LocalDateTime) {
                        updateMovies(where: { id: $id }, update: { localDT: $localDT }) {
                            movies {
                                id
                                localDT
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: mutation,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { id, localDT },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; localDT: string } = graphqlResult.data?.updateMovies.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toEqual(id);
                expect(parseLocalDateTime(graphqlMovie.localDT)).toStrictEqual(parsedLocalDateTime);

                const neo4jResult = await session.run(
                    `
                        MATCH (movie:Movie {id: $id})
                        RETURN movie {.id, .localDT} as movie
                    `,
                    { id }
                );

                const neo4jMovie: { id: string; localDT: any } = neo4jResult.records[0].toObject().movie;
                expect(neo4jMovie).toBeDefined();
                expect(neo4jMovie.id).toEqual(id);
                expect(neo4jDriver.isLocalDateTime(neo4jMovie.localDT)).toBe(true);
                expect(parseLocalDateTime(neo4jMovie.localDT.toString())).toStrictEqual(parsedLocalDateTime);
            } finally {
                await session.close();
            }
        });
    });

    describe("filter", () => {
        test("should filter based on localDT equality", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    localDT: LocalDateTime!
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const date = faker.date.future();
            const localDT = date.toISOString().split("Z")[0];
            const neo4jLocalDateTime = neo4jDriver.types.LocalDateTime.fromStandardDate(date);
            const parsedLocalDateTime = parseLocalDateTime(localDT);

            try {
                await session.run(
                    `
                        CREATE (movie:Movie)
                        SET movie = $movie
                    `,
                    { movie: { id, localDT: neo4jLocalDateTime } }
                );

                const query = `
                    query ($localDT: LocalDateTime!) {
                        movies(where: { localDT: $localDT }) {
                            id
                            localDT
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { localDT },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; localDT: string } = graphqlResult.data?.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toEqual(id);
                expect(parseLocalDateTime(graphqlMovie.localDT)).toStrictEqual(parsedLocalDateTime);
            } finally {
                await session.close();
            }
        });
        test("should filter based on localDT comparison", () =>
            Promise.all(
                ["LT", "LTE", "GT", "GTE"].map(async (filter) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID!
                            localDT: LocalDateTime!
                        }
                    `;

                    const { schema } = new Neo4jGraphQL({ typeDefs });

                    const futureId = generate({ readable: false });
                    const future = faker.date.future(100).toISOString().split("Z")[0];
                    const parsedFuture = parseLocalDateTime(future);
                    const neo4jFuture = new neo4jDriver.types.LocalDateTime(
                        parsedFuture.year,
                        parsedFuture.month,
                        parsedFuture.day,
                        parsedFuture.hour,
                        parsedFuture.minute,
                        parsedFuture.second,
                        parsedFuture.nanosecond
                    );

                    const presentId = generate({ readable: false });
                    const present = new Date().toISOString().split("Z")[0];
                    const parsedPresent = parseLocalDateTime(present);
                    const neo4jPresent = new neo4jDriver.types.LocalDateTime(
                        parsedPresent.year,
                        parsedPresent.month,
                        parsedPresent.day,
                        parsedPresent.hour,
                        parsedPresent.minute,
                        parsedPresent.second,
                        parsedPresent.nanosecond
                    );

                    const pastId = generate({ readable: false });
                    const past = faker.date.past(100).toISOString().split("Z")[0];
                    const parsedPast = parseLocalDateTime(past);
                    const neo4jPast = new neo4jDriver.types.LocalDateTime(
                        parsedPast.year,
                        parsedPast.month,
                        parsedPast.day,
                        parsedPast.hour,
                        parsedPast.minute,
                        parsedPast.second,
                        parsedPast.nanosecond
                    );

                    try {
                        await session.run(
                            `
                                CREATE (future:Movie)
                                SET future = $future
                                CREATE (present:Movie)
                                SET present = $present
                                CREATE (past:Movie)
                                SET past = $past
                            `,
                            {
                                future: { id: futureId, localDT: neo4jFuture },
                                present: { id: presentId, localDT: neo4jPresent },
                                past: { id: pastId, localDT: neo4jPast },
                            }
                        );

                        const query = `
                            query ($where: MovieWhere!) {
                                movies(
                                    where: $where
                                    options: { sort: [{ localDT: ASC }]}
                                ) {
                                    id
                                    localDT
                                }
                            }
                        `;

                        const graphqlResult = await graphql({
                            schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                            variableValues: {
                                where: { id_IN: [futureId, presentId, pastId], [`localDT_${filter}`]: present },
                            },
                        });

                        expect(graphqlResult.errors).toBeUndefined();

                        const graphqlMovies: { id: string; localDT: string }[] = graphqlResult.data?.movies;
                        expect(graphqlMovies).toBeDefined();

                        /* eslint-disable jest/no-conditional-expect */
                        if (filter === "LT") {
                            expect(graphqlMovies).toHaveLength(1);
                            expect(graphqlMovies[0].id).toBe(pastId);
                            expect(parseLocalDateTime(graphqlMovies[0].localDT)).toStrictEqual(parsedPast);
                        }

                        if (filter === "LTE") {
                            expect(graphqlMovies).toHaveLength(2);
                            expect(graphqlMovies[0].id).toBe(pastId);
                            expect(parseLocalDateTime(graphqlMovies[0].localDT)).toStrictEqual(parsedPast);

                            expect(graphqlMovies[1].id).toBe(presentId);
                            expect(parseLocalDateTime(graphqlMovies[1].localDT)).toStrictEqual(parsedPresent);
                        }

                        if (filter === "GT") {
                            expect(graphqlMovies).toHaveLength(1);
                            expect(graphqlMovies[0].id).toBe(futureId);
                            expect(parseLocalDateTime(graphqlMovies[0].localDT)).toStrictEqual(parsedFuture);
                        }

                        if (filter === "GTE") {
                            expect(graphqlMovies).toHaveLength(2);
                            expect(graphqlMovies[0].id).toBe(presentId);
                            expect(parseLocalDateTime(graphqlMovies[0].localDT)).toStrictEqual(parsedPresent);

                            expect(graphqlMovies[1].id).toBe(futureId);
                            expect(parseLocalDateTime(graphqlMovies[1].localDT)).toStrictEqual(parsedFuture);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            ));
    });

    describe("sorting", () => {
        test("should sort based on localDT", () =>
            Promise.all(
                ["ASC", "DESC"].map(async (sort) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID!
                            localDT: LocalDateTime!
                        }
                    `;

                    const { schema } = new Neo4jGraphQL({ typeDefs });

                    const futureId = generate({ readable: false });
                    const future = faker.date.future(100).toISOString().split("Z")[0];
                    const parsedFuture = parseLocalDateTime(future);
                    const neo4jFuture = new neo4jDriver.types.LocalDateTime(
                        parsedFuture.year,
                        parsedFuture.month,
                        parsedFuture.day,
                        parsedFuture.hour,
                        parsedFuture.minute,
                        parsedFuture.second,
                        parsedFuture.nanosecond
                    );

                    const presentId = generate({ readable: false });
                    const present = new Date().toISOString().split("Z")[0];
                    const parsedPresent = parseLocalDateTime(present);
                    const neo4jPresent = new neo4jDriver.types.LocalDateTime(
                        parsedPresent.year,
                        parsedPresent.month,
                        parsedPresent.day,
                        parsedPresent.hour,
                        parsedPresent.minute,
                        parsedPresent.second,
                        parsedPresent.nanosecond
                    );

                    const pastId = generate({ readable: false });
                    const past = faker.date.past(100).toISOString().split("Z")[0];
                    const parsedPast = parseLocalDateTime(past);
                    const neo4jPast = new neo4jDriver.types.LocalDateTime(
                        parsedPast.year,
                        parsedPast.month,
                        parsedPast.day,
                        parsedPast.hour,
                        parsedPast.minute,
                        parsedPast.second,
                        parsedPast.nanosecond
                    );

                    try {
                        await session.run(
                            `
                                CREATE (future:Movie)
                                SET future = $future
                                CREATE (present:Movie)
                                SET present = $present
                                CREATE (past:Movie)
                                SET past = $past
                            `,
                            {
                                future: { id: futureId, localDT: neo4jFuture },
                                present: { id: presentId, localDT: neo4jPresent },
                                past: { id: pastId, localDT: neo4jPast },
                            }
                        );

                        const query = `
                            query ($futureId: ID!, $presentId: ID!, $pastId: ID!, $sort: SortDirection!) {
                                movies(
                                    where: { id_IN: [$futureId, $presentId, $pastId] }
                                    options: { sort: [{ localDT: $sort }] }
                                ) {
                                    id
                                    localDT
                                }
                            }
                        `;

                        const graphqlResult = await graphql({
                            schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                            variableValues: {
                                futureId,
                                presentId,
                                pastId,
                                sort,
                            },
                        });

                        expect(graphqlResult.errors).toBeUndefined();

                        const graphqlMovies: { id: string; localDT: string }[] = graphqlResult.data?.movies;
                        expect(graphqlMovies).toBeDefined();
                        expect(graphqlMovies).toHaveLength(3);

                        /* eslint-disable jest/no-conditional-expect */
                        if (sort === "ASC") {
                            expect(graphqlMovies[0].id).toBe(pastId);
                            expect(parseLocalDateTime(graphqlMovies[0].localDT)).toStrictEqual(parsedPast);

                            expect(graphqlMovies[1].id).toBe(presentId);
                            expect(parseLocalDateTime(graphqlMovies[1].localDT)).toStrictEqual(parsedPresent);

                            expect(graphqlMovies[2].id).toBe(futureId);
                            expect(parseLocalDateTime(graphqlMovies[2].localDT)).toStrictEqual(parsedFuture);
                        }

                        if (sort === "DESC") {
                            expect(graphqlMovies[0].id).toBe(futureId);
                            expect(parseLocalDateTime(graphqlMovies[0].localDT)).toStrictEqual(parsedFuture);

                            expect(graphqlMovies[1].id).toBe(presentId);
                            expect(parseLocalDateTime(graphqlMovies[1].localDT)).toStrictEqual(parsedPresent);

                            expect(graphqlMovies[2].id).toBe(pastId);
                            expect(parseLocalDateTime(graphqlMovies[2].localDT)).toStrictEqual(parsedPast);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            ));
    });
});
