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
import { parseLocalDateTime } from "../../../src/graphql/scalars/LocalDateTime";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("LocalDateTime", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
        type ${Movie} {
            id: ID!
            localDT: LocalDateTime
            localDTs: [LocalDateTime!]
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should create a movie (with a LocalDateTime)", async () => {
            const id = generate({ readable: false });
            const localDT = "2023-04-04T09:19:20.620Z".split("Z")[0];
            const parsedLocalDateTime = parseLocalDateTime(localDT);

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $localDT: LocalDateTime!) {
                        ${Movie.operations.create}(input: { id: $id, localDT: $localDT }) {
                            ${Movie.plural} {
                                id
                                localDT
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, localDT },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; localDT: string } = (graphqlResult.data as any)[Movie.operations.create][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(parseLocalDateTime(graphqlMovie.localDT)).toStrictEqual(parsedLocalDateTime);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .localDT} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; localDT: any } = neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jDriver.isLocalDateTime(neo4jMovie.localDT)).toBe(true);
            expect(parseLocalDateTime(neo4jMovie.localDT.toString())).toStrictEqual(parsedLocalDateTime);
        });

        test("should create a movie (with many Times)", async () => {
            const id = generate({ readable: false });
            const localDTs = [...new Array(3)].map(() => "2023-07-14T01:17:41.537Z".split("Z")[0]);
            const parsedLocalDateTimes = localDTs.map((localDT) => parseLocalDateTime(localDT));

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $localDTs: [LocalDateTime!]!) {
                        ${Movie.operations.create}(input: { id: $id, localDTs: $localDTs }) {
                            ${Movie.plural} {
                                id
                                localDTs
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, localDTs },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; localDTs: string[] } = (graphqlResult.data as any)[
                Movie.operations.create
            ][Movie.plural][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(graphqlMovie.localDTs).toHaveLength(localDTs.length);

            const parsedGraphQLLocalDateTimes = graphqlMovie.localDTs.map((localDT) => parseLocalDateTime(localDT));

            parsedLocalDateTimes.forEach((parsedLocalDateTime) => {
                expect(parsedGraphQLLocalDateTimes).toContainEqual(parsedLocalDateTime);
            });

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .localDTs} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; localDTs: any[] } = neo4jResult.records[0]?.toObject().movie;
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
        });
    });

    describe("update", () => {
        test("should update a movie (with a LocalDateTime)", async () => {
            const id = generate({ readable: false });
            const localDT = "2023-12-28T09:03:31.293Z".split("Z")[0];
            const parsedLocalDateTime = parseLocalDateTime(localDT);

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
                { movie: { id } }
            );

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $localDT: LocalDateTime) {
                        ${Movie.operations.update}(where: { id: $id }, update: { localDT: $localDT }) {
                            ${Movie.plural} {
                                id
                                localDT
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, localDT },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; localDT: string } = (graphqlResult.data as any)[Movie.operations.update][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(parseLocalDateTime(graphqlMovie.localDT)).toStrictEqual(parsedLocalDateTime);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .localDT} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; localDT: any } = neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jDriver.isLocalDateTime(neo4jMovie.localDT)).toBe(true);
            expect(parseLocalDateTime(neo4jMovie.localDT.toString())).toStrictEqual(parsedLocalDateTime);
        });
    });

    describe("filter", () => {
        test("should filter based on localDT equality", async () => {
            const id = generate({ readable: false });
            const date = new Date("2024-09-17T11:49:48.322Z");
            const localDT = date.toISOString().split("Z")[0];
            const neo4jLocalDateTime = neo4jDriver.types.LocalDateTime.fromStandardDate(date);
            const parsedLocalDateTime = parseLocalDateTime(localDT);

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
                { movie: { id, localDT: neo4jLocalDateTime } }
            );

            const query = /* GraphQL */ `
                query ($localDT: LocalDateTime!) {
                    ${Movie.plural}(where: { localDT: $localDT }) {
                        id
                        localDT
                    }
                }
            `;

            const graphqlResult = await testHelper.executeGraphQL(query, {
                variableValues: { localDT },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; localDT: string } = (graphqlResult.data as any)[Movie.plural][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(parseLocalDateTime(graphqlMovie.localDT)).toStrictEqual(parsedLocalDateTime);
        });
        test.each(["LT", "LTE", "GT", "GTE"])(
            "should filter based on localDT comparison, for filter %s",
            async (filter) => {
                const futureId = generate({ readable: false });
                const future = "2025-02-18T18:10:55.462Z".split("Z")[0];
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
                const past = "2022-08-29T10:21:43.108Z".split("Z")[0];
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
                        future: { id: futureId, localDT: neo4jFuture },
                        present: { id: presentId, localDT: neo4jPresent },
                        past: { id: pastId, localDT: neo4jPast },
                    }
                );

                const query = /* GraphQL */ `
                        query ($where: ${Movie.name}Where!) {
                            ${Movie.plural}(where: $where, options: { sort: [{ localDT: ASC }] }) {
                                id
                                localDT
                            }
                        }
                    `;

                const graphqlResult = await testHelper.executeGraphQL(query, {
                    variableValues: {
                        where: { id_IN: [futureId, presentId, pastId], [`localDT_${filter}`]: present },
                    },
                });

                expect(graphqlResult.errors).toBeUndefined();

                const graphqlMovies: { id: string; localDT: string }[] = (graphqlResult.data as any)[Movie.plural];
                expect(graphqlMovies).toBeDefined();

                /* eslint-disable jest/no-conditional-expect */
                if (filter === "LT") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(pastId);
                    expect(parseLocalDateTime(graphqlMovies[0]?.localDT)).toStrictEqual(parsedPast);
                }

                if (filter === "LTE") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(pastId);
                    expect(parseLocalDateTime(graphqlMovies[0]?.localDT)).toStrictEqual(parsedPast);

                    expect(graphqlMovies[1]?.id).toBe(presentId);
                    expect(parseLocalDateTime(graphqlMovies[1]?.localDT)).toStrictEqual(parsedPresent);
                }

                if (filter === "GT") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(futureId);
                    expect(parseLocalDateTime(graphqlMovies[0]?.localDT)).toStrictEqual(parsedFuture);
                }

                if (filter === "GTE") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(presentId);
                    expect(parseLocalDateTime(graphqlMovies[0]?.localDT)).toStrictEqual(parsedPresent);

                    expect(graphqlMovies[1]?.id).toBe(futureId);
                    expect(parseLocalDateTime(graphqlMovies[1]?.localDT)).toStrictEqual(parsedFuture);
                }
                /* eslint-enable jest/no-conditional-expect */
            }
        );
    });

    describe("sorting", () => {
        test.each(["ASC", "DESC"])("should sort based on localDT, sorting by %s", async (sort) => {
            const futureId = generate({ readable: false });
            const future = "2025-08-10T05:25:26.654Z".split("Z")[0];
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
            const past = "2023-10-05T14:58:45.170Z".split("Z")[0];
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
                    future: { id: futureId, localDT: neo4jFuture },
                    present: { id: presentId, localDT: neo4jPresent },
                    past: { id: pastId, localDT: neo4jPast },
                }
            );

            const query = /* GraphQL */ `
                        query ($futureId: ID!, $presentId: ID!, $pastId: ID!, $sort: SortDirection!) {
                            ${Movie.plural}(
                                where: { id_IN: [$futureId, $presentId, $pastId] }
                                options: { sort: [{ localDT: $sort }] }
                            ) {
                                id
                                localDT
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

            const graphqlMovies: { id: string; localDT: string }[] = (graphqlResult.data as any)[Movie.plural];
            expect(graphqlMovies).toBeDefined();
            expect(graphqlMovies).toHaveLength(3);

            /* eslint-disable jest/no-conditional-expect */
            if (sort === "ASC") {
                expect(graphqlMovies[0]?.id).toBe(pastId);
                expect(parseLocalDateTime(graphqlMovies[0]?.localDT)).toStrictEqual(parsedPast);

                expect(graphqlMovies[1]?.id).toBe(presentId);
                expect(parseLocalDateTime(graphqlMovies[1]?.localDT)).toStrictEqual(parsedPresent);

                expect(graphqlMovies[2]?.id).toBe(futureId);
                expect(parseLocalDateTime(graphqlMovies[2]?.localDT)).toStrictEqual(parsedFuture);
            }

            if (sort === "DESC") {
                expect(graphqlMovies[0]?.id).toBe(futureId);
                expect(parseLocalDateTime(graphqlMovies[0]?.localDT)).toStrictEqual(parsedFuture);

                expect(graphqlMovies[1]?.id).toBe(presentId);
                expect(parseLocalDateTime(graphqlMovies[1]?.localDT)).toStrictEqual(parsedPresent);

                expect(graphqlMovies[2]?.id).toBe(pastId);
                expect(parseLocalDateTime(graphqlMovies[2]?.localDT)).toStrictEqual(parsedPast);
            }
            /* eslint-enable jest/no-conditional-expect */
        });
    });
});
