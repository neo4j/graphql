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

import { isTime } from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Time", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should create a movie (with a Time)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                    id: ID!
                    time: Time!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const time = "2024-01-29T03:57:32.358000000Z".split("T")[1];

            const mutation = `
                    mutation ($id: ID!, $time: Time!) {
                        ${Movie.operations.create}(input: { id: $id, time: $time }) {
                            ${Movie.plural} {
                                id
                                time
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, { variableValues: { id, time } });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; time: string } = (graphqlResult.data as any)[Movie.operations.create][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(graphqlMovie.time).toStrictEqual(time);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .time} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; time: { toString(): string } } = neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.time)).toBe(true);
            expect(neo4jMovie.time.toString()).toStrictEqual(time);
        });

        test("should create a movie (with many Times)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                    id: ID!
                    times: [Time!]!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const times = [...new Array(4)].map(() => "2023-06-09T11:17:47.789000000Z".split("T")[1]);

            const mutation = `
                    mutation ($id: ID!, $times: [Time!]!) {
                        ${Movie.operations.create}(input: { id: $id, times: $times }) {
                            ${Movie.plural} {
                                id
                                times
                            }
                        }
                    }
                `;
            const graphqlResult = await testHelper.executeGraphQL(mutation, { variableValues: { id, times } });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; times: string[] } = (graphqlResult.data as any)[Movie.operations.create][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(graphqlMovie.times).toHaveLength(times.length);

            times.forEach((time) => {
                expect(graphqlMovie.times).toContainEqual(time);
            });

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .times} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; times: { toString(): string }[] } =
                neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jMovie.times).toHaveLength(times.length);
            for (const time of neo4jMovie.times) {
                expect(isTime(time)).toBe(true);
            }

            neo4jMovie.times.forEach((time) => {
                expect(times).toContainEqual(time.toString());
            });
        });
    });

    describe("update", () => {
        test("should update a movie (with a Time)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                    id: ID!
                    time: Time
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const time = "2023-07-12T05:44:06.918000000Z".split("T")[1];

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
                { movie: { id } }
            );

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $time: Time) {
                        ${Movie.operations.update}(where: { id_EQ: $id }, update: { time_SET: $time }) {
                            ${Movie.plural} {
                                id
                                time
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, { variableValues: { id, time } });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; time: string } = (graphqlResult.data as any)[Movie.operations.update][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(graphqlMovie.time).toStrictEqual(time);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .time} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; time: { toString(): string } } = neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.time)).toBe(true);
            expect(neo4jMovie.time.toString()).toStrictEqual(time);
        });
    });

    describe("filter", () => {
        test("should filter based on time equality", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                    id: ID!
                    time: Time!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const time = "11:49:48.322000000Z";

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie.id = $id
                        SET movie.time = time($time)
                    `,
                { id, time }
            );

            const query = /* GraphQL */ `
                    query ($time: Time!) {
                        ${Movie.plural}(where: { time: { eq: $time } }) {
                            id
                            time
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(query, { variableValues: { time } });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; time: string } = (graphqlResult.data as any)[Movie.plural][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(graphqlMovie.time).toStrictEqual(time);
        });

        test.each(["lt", "lte", "gt", "gte"])(
            "should filter based on time comparison for filter: %s",
            async (filter) => {
                const typeDefs = /* GraphQL */ `
                        type ${Movie} @node {
                            id: ID!
                            time: Time!
                        }
                    `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const futureId = generate({ readable: false });
                const future = "13:00:00Z";

                const presentId = generate({ readable: false });
                const present = "12:00:00Z";

                const pastId = generate({ readable: false });
                const past = "11:00:00Z";

                await testHelper.executeCypher(
                    `
                                    CREATE (future:${Movie})
                                    SET future.id = $futureId
                                    SET future.time = time($future)
                                    CREATE (present:${Movie})
                                    SET present.id = $presentId
                                    SET present.time = time($present)
                                    CREATE (past:${Movie})
                                    SET past.id = $pastId
                                    SET past.time = time($past)
                                `,
                    {
                        futureId,
                        future,
                        presentId,
                        present,
                        pastId,
                        past,
                    }
                );

                const query = /* GraphQL */ `
                    query ($where: ${Movie.name}Where!) {
                        ${Movie.plural}(
                            where: $where
                            sort: [{ time: ASC }]
                        ) {
                            id
                            time
                        }
                    }
                `;

                const graphqlResult = await testHelper.executeGraphQL(query, {
                    variableValues: {
                        where: { id: { in: [futureId, presentId, pastId] }, time: { [filter]: present } },
                    },
                });

                expect(graphqlResult.errors).toBeUndefined();

                const graphqlMovies: { id: string; time: string }[] = (graphqlResult.data as any)[Movie.plural];
                expect(graphqlMovies).toBeDefined();

                /* eslint-disable jest/no-conditional-expect */
                if (filter === "lt") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(pastId);
                    expect(graphqlMovies[0]?.time).toStrictEqual(past);
                }

                if (filter === "lte") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(pastId);
                    expect(graphqlMovies[0]?.time).toStrictEqual(past);

                    expect(graphqlMovies[1]?.id).toBe(presentId);
                    expect(graphqlMovies[1]?.time).toStrictEqual(present);
                }

                if (filter === "gt") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(futureId);
                    expect(graphqlMovies[0]?.time).toStrictEqual(future);
                }

                if (filter === "gte") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(presentId);
                    expect(graphqlMovies[0]?.time).toStrictEqual(present);

                    expect(graphqlMovies[1]?.id).toBe(futureId);
                    expect(graphqlMovies[1]?.time).toStrictEqual(future);
                }
                /* eslint-enable jest/no-conditional-expect */
            }
        );
    });

    describe("sorting", () => {
        test.each(["ASC", "DESC"])("should sort based on time, sorted by: %s", async (sort) => {
            const typeDefs = /* GraphQL */ `
                        type ${Movie} @node {
                            id: ID!
                            time: Time!
                        }
                    `;

            await testHelper.initNeo4jGraphQL({ typeDefs });
            const futureId = generate({ readable: false });
            const future = "13:00:00Z";

            const presentId = generate({ readable: false });
            const present = "12:00:00Z";

            const pastId = generate({ readable: false });
            const past = "11:00:00Z";

            await testHelper.executeCypher(
                `
                                CREATE (future:${Movie})
                                SET future.id = $futureId
                                SET future.time = time($future)
                                CREATE (present:${Movie})
                                SET present.id = $presentId
                                SET present.time = time($present)
                                CREATE (past:${Movie})
                                SET past.id = $pastId
                                SET past.time = time($past)
                            `,
                {
                    futureId,
                    future,
                    presentId,
                    present,
                    pastId,
                    past,
                }
            );

            const query = /* GraphQL */ `
                query ($futureId: ID!, $presentId: ID!, $pastId: ID!, $sort: SortDirection!) {
                    ${Movie.plural}(where: { id_IN: [$futureId, $presentId, $pastId] }, sort: [{ time: $sort }]) {
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
                expect(graphqlMovies[0]?.time).toStrictEqual(past);

                expect(graphqlMovies[1]?.id).toBe(presentId);
                expect(graphqlMovies[1]?.time).toStrictEqual(present);

                expect(graphqlMovies[2]?.id).toBe(futureId);
                expect(graphqlMovies[2]?.time).toStrictEqual(future);
            }

            if (sort === "DESC") {
                expect(graphqlMovies[0]?.id).toBe(futureId);
                expect(graphqlMovies[0]?.time).toStrictEqual(future);

                expect(graphqlMovies[1]?.id).toBe(presentId);
                expect(graphqlMovies[1]?.time).toStrictEqual(present);

                expect(graphqlMovies[2]?.id).toBe(pastId);
                expect(graphqlMovies[2]?.time).toStrictEqual(past);
            }
            /* eslint-enable jest/no-conditional-expect */
        });
    });
});
