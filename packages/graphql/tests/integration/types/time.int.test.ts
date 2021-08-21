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
import { parseTime } from "../../../src/schema/scalars/Time";

describe("Time", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create a movie (with a Time)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    time: Time!
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const time = faker.date.past().toISOString().split("T")[1];
            const parsedTime = parseTime(time);

            try {
                const mutation = `
                    mutation ($id: ID!, $time: Time!) {
                        createMovies(input: { id: $id, time: $time }) {
                            movies {
                                id
                                time
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: mutation,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { id, time },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; time: string } = graphqlResult.data?.createMovies.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toBe(id);
                expect(parseTime(graphqlMovie.time)).toStrictEqual(parsedTime);

                const neo4jResult = await session.run(
                    `
                        MATCH (movie:Movie {id: $id})
                        RETURN movie {.id, .time} as movie
                    `,
                    { id }
                );

                const neo4jMovie: { id: string; time: any } = neo4jResult.records[0].toObject().movie;
                expect(neo4jMovie).toBeDefined();
                expect(neo4jMovie.id).toEqual(id);
                expect(neo4jDriver.isTime(neo4jMovie.time)).toBe(true);
                expect(parseTime(neo4jMovie.time.toString())).toStrictEqual(parsedTime);
            } finally {
                await session.close();
            }
        });

        test("should create a movie (with many Times)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    times: [Time!]!
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const times = [...new Array(faker.random.number({ min: 2, max: 4 }))].map(
                () => faker.date.past().toISOString().split("T")[1]
            );
            const parsedTimes = times.map((time) => parseTime(time));

            try {
                const mutation = `
                    mutation ($id: ID!, $times: [Time!]!) {
                        createMovies(input: { id: $id, times: $times }) {
                            movies {
                                id
                                times
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: mutation,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { id, times },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; times: string[] } = graphqlResult.data?.createMovies.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toBe(id);
                expect(graphqlMovie.times).toHaveLength(times.length);

                const parsedGraphQLTimes = graphqlMovie.times.map((time) => parseTime(time));

                parsedTimes.forEach((parsedTime) => {
                    expect(parsedGraphQLTimes).toContainEqual(parsedTime);
                });

                const neo4jResult = await session.run(
                    `
                        MATCH (movie:Movie {id: $id})
                        RETURN movie {.id, .times} as movie
                    `,
                    { id }
                );

                const neo4jMovie: { id: string; times: any[] } = neo4jResult.records[0].toObject().movie;
                expect(neo4jMovie).toBeDefined();
                expect(neo4jMovie.id).toEqual(id);
                expect(neo4jMovie.times).toHaveLength(times.length);

                neo4jMovie.times.forEach((time) => {
                    expect(neo4jDriver.isTime(time)).toBe(true);
                });

                const parsedNeo4jTimes = neo4jMovie.times.map((time) => parseTime(time.toString()));

                parsedTimes.forEach((parsedTime) => {
                    expect(parsedNeo4jTimes).toContainEqual(parsedTime);
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with a Time)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    time: Time
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const time = faker.date.past().toISOString().split("T")[1];
            const parsedTime = parseTime(time);

            try {
                await session.run(
                    `
                        CREATE (movie:Movie)
                        SET movie = $movie
                    `,
                    { movie: { id } }
                );

                const mutation = `
                    mutation ($id: ID!, $time: Time) {
                        updateMovies(where: { id: $id }, update: { time: $time }) {
                            movies {
                                id
                                time
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: mutation,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { id, time },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; time: string } = graphqlResult.data?.updateMovies.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toEqual(id);
                expect(parseTime(graphqlMovie.time)).toStrictEqual(parsedTime);

                const neo4jResult = await session.run(
                    `
                        MATCH (movie:Movie {id: $id})
                        RETURN movie {.id, .time} as movie
                    `,
                    { id }
                );

                const neo4jMovie: { id: string; time: any } = neo4jResult.records[0].toObject().movie;
                expect(neo4jMovie).toBeDefined();
                expect(neo4jMovie.id).toEqual(id);
                expect(neo4jDriver.isTime(neo4jMovie.time)).toBe(true);
                expect(parseTime(neo4jMovie.time.toString())).toStrictEqual(parsedTime);
            } finally {
                await session.close();
            }
        });
    });

    describe("filter", () => {
        test("should filter based on time equality", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID!
                    time: Time!
                }
            `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({ readable: false });
            const date = faker.date.future();
            const time = date.toISOString().split("T")[1];
            const neo4jTime = neo4jDriver.types.Time.fromStandardDate(date);
            const parsedTime = parseTime(time);

            try {
                await session.run(
                    `
                        CREATE (movie:Movie)
                        SET movie = $movie
                    `,
                    { movie: { id, time: neo4jTime } }
                );

                const query = `
                    query ($time: Time!) {
                        movies(where: { time: $time }) {
                            id
                            time
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    variableValues: { time },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const graphqlMovie: { id: string; time: string } = graphqlResult.data?.movies[0];
                expect(graphqlMovie).toBeDefined();
                expect(graphqlMovie.id).toEqual(id);
                expect(parseTime(graphqlMovie.time)).toStrictEqual(parsedTime);
            } finally {
                await session.close();
            }
        });
        test("should filter based on time comparison", () =>
            Promise.all(
                ["LT", "LTE", "GT", "GTE"].map(async (filter) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID!
                            time: Time!
                        }
                    `;

                    const { schema } = new Neo4jGraphQL({ typeDefs });

                    const futureId = generate({ readable: false });
                    const future = "13:00:00";
                    const parsedFuture = parseTime(future);
                    const neo4jFuture = new neo4jDriver.types.Time(
                        parsedFuture.hour,
                        parsedFuture.minute,
                        parsedFuture.second,
                        parsedFuture.nanosecond,
                        parsedFuture.timeZoneOffsetSeconds
                    );

                    const presentId = generate({ readable: false });
                    const present = "12:00:00";
                    const parsedPresent = parseTime(present);
                    const neo4jPresent = new neo4jDriver.types.Time(
                        parsedPresent.hour,
                        parsedPresent.minute,
                        parsedPresent.second,
                        parsedPresent.nanosecond,
                        parsedPresent.timeZoneOffsetSeconds
                    );

                    const pastId = generate({ readable: false });
                    const past = "11:00:00";
                    const parsedPast = parseTime(past);
                    const neo4jPast = new neo4jDriver.types.Time(
                        parsedPast.hour,
                        parsedPast.minute,
                        parsedPast.second,
                        parsedPast.nanosecond,
                        parsedPast.timeZoneOffsetSeconds
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
                                future: { id: futureId, time: neo4jFuture },
                                present: { id: presentId, time: neo4jPresent },
                                past: { id: pastId, time: neo4jPast },
                            }
                        );

                        const query = `
                            query ($where: MovieWhere!) {
                                movies(
                                    where: $where
                                    options: { sort: [{ time: ASC }]}
                                ) {
                                    id
                                    time
                                }
                            }
                        `;

                        const graphqlResult = await graphql({
                            schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                            variableValues: {
                                where: { id_IN: [futureId, presentId, pastId], [`time_${filter}`]: present },
                            },
                        });

                        expect(graphqlResult.errors).toBeUndefined();

                        const graphqlMovies: { id: string; time: string }[] = graphqlResult.data?.movies;
                        expect(graphqlMovies).toBeDefined();

                        /* eslint-disable jest/no-conditional-expect */
                        if (filter === "LT") {
                            expect(graphqlMovies).toHaveLength(1);
                            expect(graphqlMovies[0].id).toBe(pastId);
                            expect(parseTime(graphqlMovies[0].time)).toStrictEqual(parsedPast);
                        }

                        if (filter === "LTE") {
                            expect(graphqlMovies).toHaveLength(2);
                            expect(graphqlMovies[0].id).toBe(pastId);
                            expect(parseTime(graphqlMovies[0].time)).toStrictEqual(parsedPast);

                            expect(graphqlMovies[1].id).toBe(presentId);
                            expect(parseTime(graphqlMovies[1].time)).toStrictEqual(parsedPresent);
                        }

                        if (filter === "GT") {
                            expect(graphqlMovies).toHaveLength(1);
                            expect(graphqlMovies[0].id).toBe(futureId);
                            expect(parseTime(graphqlMovies[0].time)).toStrictEqual(parsedFuture);
                        }

                        if (filter === "GTE") {
                            expect(graphqlMovies).toHaveLength(2);
                            expect(graphqlMovies[0].id).toBe(presentId);
                            expect(parseTime(graphqlMovies[0].time)).toStrictEqual(parsedPresent);

                            expect(graphqlMovies[1].id).toBe(futureId);
                            expect(parseTime(graphqlMovies[1].time)).toStrictEqual(parsedFuture);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            ));
    });

    describe("sorting", () => {
        test("should sort based on time", () =>
            Promise.all(
                ["ASC", "DESC"].map(async (sort) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID!
                            time: Time!
                        }
                    `;

                    const { schema } = new Neo4jGraphQL({ typeDefs });

                    const futureId = generate({ readable: false });
                    const future = "13:00:00";
                    const parsedFuture = parseTime(future);
                    const neo4jFuture = new neo4jDriver.types.Time(
                        parsedFuture.hour,
                        parsedFuture.minute,
                        parsedFuture.second,
                        parsedFuture.nanosecond,
                        parsedFuture.timeZoneOffsetSeconds
                    );

                    const presentId = generate({ readable: false });
                    const present = "12:00:00";
                    const parsedPresent = parseTime(present);
                    const neo4jPresent = new neo4jDriver.types.Time(
                        parsedPresent.hour,
                        parsedPresent.minute,
                        parsedPresent.second,
                        parsedPresent.nanosecond,
                        parsedPresent.timeZoneOffsetSeconds
                    );

                    const pastId = generate({ readable: false });
                    const past = "11:00:00";
                    const parsedPast = parseTime(past);
                    const neo4jPast = new neo4jDriver.types.Time(
                        parsedPast.hour,
                        parsedPast.minute,
                        parsedPast.second,
                        parsedPast.nanosecond,
                        parsedPast.timeZoneOffsetSeconds
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
                                future: { id: futureId, time: neo4jFuture },
                                present: { id: presentId, time: neo4jPresent },
                                past: { id: pastId, time: neo4jPast },
                            }
                        );

                        const query = `
                            query ($futureId: ID!, $presentId: ID!, $pastId: ID!, $sort: SortDirection!) {
                                movies(
                                    where: { id_IN: [$futureId, $presentId, $pastId] }
                                    options: { sort: [{ time: $sort }] }
                                ) {
                                    id
                                    time
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

                        const graphqlMovies: { id: string; time: string }[] = graphqlResult.data?.movies;
                        expect(graphqlMovies).toBeDefined();
                        expect(graphqlMovies).toHaveLength(3);

                        /* eslint-disable jest/no-conditional-expect */
                        if (sort === "ASC") {
                            expect(graphqlMovies[0].id).toBe(pastId);
                            expect(parseTime(graphqlMovies[0].time)).toStrictEqual(parsedPast);

                            expect(graphqlMovies[1].id).toBe(presentId);
                            expect(parseTime(graphqlMovies[1].time)).toStrictEqual(parsedPresent);

                            expect(graphqlMovies[2].id).toBe(futureId);
                            expect(parseTime(graphqlMovies[2].time)).toStrictEqual(parsedFuture);
                        }

                        if (sort === "DESC") {
                            expect(graphqlMovies[0].id).toBe(futureId);
                            expect(parseTime(graphqlMovies[0].time)).toStrictEqual(parsedFuture);

                            expect(graphqlMovies[1].id).toBe(presentId);
                            expect(parseTime(graphqlMovies[1].time)).toStrictEqual(parsedPresent);

                            expect(graphqlMovies[2].id).toBe(pastId);
                            expect(parseTime(graphqlMovies[2].time)).toStrictEqual(parsedPast);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            ));
    });
});
