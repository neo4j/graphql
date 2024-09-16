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

import neo4jDriver from "neo4j-driver";
import { generate } from "randomstring";
import { parseLocalTime } from "../../../src/graphql/scalars/LocalTime";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("LocalTime", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
        type ${Movie} {
            id: ID!
            time: LocalTime
            times: [LocalTime!]
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should create a movie (with a LocalTime)", async () => {
            const id = generate({ readable: false });
            const time = "2023-10-16T16:33:05.024Z".split("T")[1]?.split("Z")[0];
            const parsedTime = parseLocalTime(time);

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $time: LocalTime!) {
                        ${Movie.operations.create}(input: { id: $id, time: $time }) {
                            ${Movie.plural} {
                                id
                                time
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, time },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; time: string } = (graphqlResult.data as any)[Movie.operations.create][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(parseLocalTime(graphqlMovie.time)).toStrictEqual(parsedTime);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie}{id: $id})
                        RETURN movie {.id, .time} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; time: { toString(): string } } = neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jDriver.isLocalTime(neo4jMovie.time)).toBe(true);
            expect(parseLocalTime(neo4jMovie.time.toString())).toStrictEqual(parsedTime);
        });

        test("should create a movie (with many Times)", async () => {
            const id = generate({ readable: false });
            const times = [...new Array(3)].map(() => "2023-11-03T00:02:28.229Z".split("T")[1]?.split("Z")[0]);
            const parsedTimes = times.map((time) => parseLocalTime(time));

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $times: [LocalTime!]!) {
                        ${Movie.operations.create}(input: { id: $id, times: $times }) {
                            ${Movie.plural} {
                                id
                                times
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, times },
            });
            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; times: string[] } = (graphqlResult.data as any)[Movie.operations.create][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(graphqlMovie.times).toHaveLength(times.length);

            const parsedGraphQLTimes = graphqlMovie.times.map((time) => parseLocalTime(time));

            parsedTimes.forEach((parsedTime) => {
                expect(parsedGraphQLTimes).toContainEqual(parsedTime);
            });

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie}{id: $id})
                        RETURN movie {.id, .times} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; times: { toString(): string }[] } =
                neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jMovie.times).toHaveLength(times.length);

            neo4jMovie.times.forEach((time) => {
                expect(neo4jDriver.isLocalTime(time)).toBe(true);
            });

            const parsedNeo4jTimes = neo4jMovie.times.map((time) => parseLocalTime(time.toString()));

            parsedTimes.forEach((parsedTime) => {
                expect(parsedNeo4jTimes).toContainEqual(parsedTime);
            });
        });
    });

    describe("update", () => {
        test("should update a movie (with a LocalTime)", async () => {
            const id = generate({ readable: false });
            const time = "2024-01-18T11:15:48.144Z".split("T")[1]?.split("Z")[0];
            const parsedTime = parseLocalTime(time);

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
                { movie: { id } }
            );

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $time: LocalTime) {
                        ${Movie.operations.update}(where: { id: $id }, update: { time: $time }) {
                            ${Movie.plural} {
                                id
                                time
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, time },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; time: string } = (graphqlResult.data as any)[Movie.operations.update][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(parseLocalTime(graphqlMovie.time)).toStrictEqual(parsedTime);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie}{id: $id})
                        RETURN movie {.id, .time} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; time: { toString(): string } } = neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jDriver.isLocalTime(neo4jMovie.time)).toBe(true);
            expect(parseLocalTime(neo4jMovie.time.toString())).toStrictEqual(parsedTime);
        });
    });

    describe("filter", () => {
        test("should filter based on time equality", async () => {
            const id = generate({ readable: false });
            const date = new Date("2024-09-17T11:49:48.322Z");
            const time = date.toISOString().split("T")[1]?.split("Z")[0];
            const neo4jTime = neo4jDriver.types.LocalTime.fromStandardDate(date);
            const parsedTime = parseLocalTime(time);

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
                { movie: { id, time: neo4jTime } }
            );

            const query = /* GraphQL */ `
                    query ($time: LocalTime!) {
                        ${Movie.plural}(where: { time: $time }) {
                            id
                            time
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(query, {
                variableValues: { id, time },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; time: string } = (graphqlResult.data as any)[Movie.plural][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(parseLocalTime(graphqlMovie.time)).toStrictEqual(parsedTime);
        });
        test.each(["LT", "LTE", "GT", "GTE"])(
            "should filter based on time comparison, for filter %s",
            async (filter) => {
                const futureId = generate({ readable: false });
                const future = "13:00:00";
                const parsedFuture = parseLocalTime(future);
                const neo4jFuture = new neo4jDriver.types.LocalTime(
                    parsedFuture.hour,
                    parsedFuture.minute,
                    parsedFuture.second,
                    parsedFuture.nanosecond
                );

                const presentId = generate({ readable: false });
                const present = "12:00:00";
                const parsedPresent = parseLocalTime(present);
                const neo4jPresent = new neo4jDriver.types.LocalTime(
                    parsedPresent.hour,
                    parsedPresent.minute,
                    parsedPresent.second,
                    parsedPresent.nanosecond
                );

                const pastId = generate({ readable: false });
                const past = "11:00:00";
                const parsedPast = parseLocalTime(past);
                const neo4jPast = new neo4jDriver.types.LocalTime(
                    parsedPast.hour,
                    parsedPast.minute,
                    parsedPast.second,
                    parsedPast.nanosecond
                );

                await testHelper.executeCypher(
                    `
                                CREATE (future:${Movie})
                                SET future = $future
                                CREATE (present:${Movie})
                                SET present = $present
                                CREATE (past:${Movie})
                                SET past = $past
                            `,
                    {
                        future: { id: futureId, time: neo4jFuture },
                        present: { id: presentId, time: neo4jPresent },
                        past: { id: pastId, time: neo4jPast },
                    }
                );

                const query = /* GraphQL */ `
                            query ($where: ${Movie.name}Where!) {
                                ${Movie.plural}(where: $where, options: { sort: [{ time: ASC }] }) {
                                    id
                                    time
                                }
                            }
                        `;

                const graphqlResult = await testHelper.executeGraphQL(query, {
                    variableValues: {
                        where: { id_IN: [futureId, presentId, pastId], [`time_${filter}`]: present },
                    },
                });

                expect(graphqlResult.errors).toBeUndefined();

                const graphqlMovies: { id: string; time: string }[] = (graphqlResult.data as any)[Movie.plural];
                expect(graphqlMovies).toBeDefined();

                /* eslint-disable jest/no-conditional-expect */
                if (filter === "LT") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(pastId);
                    expect(parseLocalTime(graphqlMovies[0]?.time)).toStrictEqual(parsedPast);
                }

                if (filter === "LTE") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(pastId);
                    expect(parseLocalTime(graphqlMovies[0]?.time)).toStrictEqual(parsedPast);

                    expect(graphqlMovies[1]?.id).toBe(presentId);
                    expect(parseLocalTime(graphqlMovies[1]?.time)).toStrictEqual(parsedPresent);
                }

                if (filter === "GT") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(futureId);
                    expect(parseLocalTime(graphqlMovies[0]?.time)).toStrictEqual(parsedFuture);
                }

                if (filter === "GTE") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(presentId);
                    expect(parseLocalTime(graphqlMovies[0]?.time)).toStrictEqual(parsedPresent);

                    expect(graphqlMovies[1]?.id).toBe(futureId);
                    expect(parseLocalTime(graphqlMovies[1]?.time)).toStrictEqual(parsedFuture);
                }
                /* eslint-enable jest/no-conditional-expect */
            }
        );
    });

    describe("sorting", () => {
        test.each(["ASC", "DESC"])("should sort based on time, sorting by %s", async (sort) => {
            const futureId = generate({ readable: false });
            const future = "13:00:00";
            const parsedFuture = parseLocalTime(future);
            const neo4jFuture = new neo4jDriver.types.LocalTime(
                parsedFuture.hour,
                parsedFuture.minute,
                parsedFuture.second,
                parsedFuture.nanosecond
            );

            const presentId = generate({ readable: false });
            const present = "12:00:00";
            const parsedPresent = parseLocalTime(present);
            const neo4jPresent = new neo4jDriver.types.LocalTime(
                parsedPresent.hour,
                parsedPresent.minute,
                parsedPresent.second,
                parsedPresent.nanosecond
            );

            const pastId = generate({ readable: false });
            const past = "11:00:00";
            const parsedPast = parseLocalTime(past);
            const neo4jPast = new neo4jDriver.types.LocalTime(
                parsedPast.hour,
                parsedPast.minute,
                parsedPast.second,
                parsedPast.nanosecond
            );

            await testHelper.executeCypher(
                `
                                CREATE (future:${Movie})
                                SET future = $future
                                CREATE (present:${Movie})
                                SET present = $present
                                CREATE (past:${Movie})
                                SET past = $past
                            `,
                {
                    future: { id: futureId, time: neo4jFuture },
                    present: { id: presentId, time: neo4jPresent },
                    past: { id: pastId, time: neo4jPast },
                }
            );

            const query = /* GraphQL */ `
                            query ($futureId: ID!, $presentId: ID!, $pastId: ID!, $sort: SortDirection!) {
                                ${Movie.plural}(
                                    where: { id_IN: [$futureId, $presentId, $pastId] }
                                    options: { sort: [{ time: $sort }] }
                                ) {
                                    id
                                    time
                                }
                            }
                        `;

            const graphqlResult = await testHelper.executeGraphQL(query, {
                variableValues: {
                    futureId,
                    presentId,
                    pastId,
                    sort,
                },
            });

            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovies: { id: string; time: string }[] = (graphqlResult.data as any)[Movie.plural];
            expect(graphqlMovies).toBeDefined();
            expect(graphqlMovies).toHaveLength(3);

            /* eslint-disable jest/no-conditional-expect */
            if (sort === "ASC") {
                expect(graphqlMovies[0]?.id).toBe(pastId);
                expect(parseLocalTime(graphqlMovies[0]?.time)).toStrictEqual(parsedPast);

                expect(graphqlMovies[1]?.id).toBe(presentId);
                expect(parseLocalTime(graphqlMovies[1]?.time)).toStrictEqual(parsedPresent);

                expect(graphqlMovies[2]?.id).toBe(futureId);
                expect(parseLocalTime(graphqlMovies[2]?.time)).toStrictEqual(parsedFuture);
            }

            if (sort === "DESC") {
                expect(graphqlMovies[0]?.id).toBe(futureId);
                expect(parseLocalTime(graphqlMovies[0]?.time)).toStrictEqual(parsedFuture);

                expect(graphqlMovies[1]?.id).toBe(presentId);
                expect(parseLocalTime(graphqlMovies[1]?.time)).toStrictEqual(parsedPresent);

                expect(graphqlMovies[2]?.id).toBe(pastId);
                expect(parseLocalTime(graphqlMovies[2]?.time)).toStrictEqual(parsedPast);
            }
            /* eslint-enable jest/no-conditional-expect */
        });
    });
});
