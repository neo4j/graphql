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
import { parseDuration } from "../../../src/graphql/scalars/Duration";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Duration", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });
    describe("create", () => {
        test("should create a movie (with a Duration)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} {
                    id: ID!
                    duration: Duration!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const years = 3;
            const months = 6;
            const days = 12;
            const hours = 2;
            const minutes = 30;

            const duration = `P${years}Y${months}M${days}DT${hours}H${minutes}M`;
            const parsedDuration = parseDuration(duration);

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $duration: Duration!) {
                        ${Movie.operations.create}(input: { id: $id, duration: $duration }) {
                            ${Movie.plural} {
                                id
                                duration
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, duration },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; duration: string } = (graphqlResult.data as any)[Movie.operations.create][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(parseDuration(graphqlMovie.duration)).toStrictEqual(parsedDuration);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .duration} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; duration } = neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jDriver.isDuration(neo4jMovie.duration)).toBe(true);
            expect(parseDuration(neo4jMovie.duration.toString())).toStrictEqual(parsedDuration);
        });

        test("should create a movie (with many Durations)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} {
                    id: ID!
                    durations: [Duration!]!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const durations = ["P34Y4M2DT23.44H", "P-34W", "P19980314T120000", "P4Y-5M-3.75D"];
            const parsedDurations = durations.map((duration) => parseDuration(duration));

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $durations: [Duration!]!) {
                        ${Movie.operations.create}(input: { id: $id, durations: $durations }) {
                            ${Movie.plural} {
                                id
                                durations
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, durations },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; durations: string[] } = (graphqlResult.data as any)[
                Movie.operations.create
            ][Movie.plural][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toBe(id);
            expect(graphqlMovie.durations).toHaveLength(durations.length);

            const parsedGraphQLDurations = graphqlMovie.durations.map((duration) => parseDuration(duration));

            parsedDurations.forEach((parsedDuration) => {
                expect(parsedGraphQLDurations).toContainEqual(parsedDuration);
            });

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .durations} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; durations: { toString(): string }[] } =
                neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jMovie.durations).toHaveLength(durations.length);

            neo4jMovie.durations.forEach((duration) => {
                expect(neo4jDriver.isDuration(duration)).toBe(true);
            });

            const parsedNeo4jDurations = neo4jMovie.durations.map((duration) => parseDuration(duration.toString()));

            parsedDurations.forEach((parsedDuration) => {
                expect(parsedNeo4jDurations).toContainEqual(parsedDuration);
            });
        });
    });

    describe("update", () => {
        test("should update a movie (with a Duration)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} {
                    id: ID!
                    duration: Duration
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const duration = "-P5Y6M";
            const parsedDuration = parseDuration(duration);

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
                { movie: { id } }
            );

            const mutation = /* GraphQL */ `
                    mutation ($id: ID!, $duration: Duration) {
                        ${Movie.operations.update}(where: { id: $id }, update: { duration: $duration }) {
                            ${Movie.plural} {
                                id
                                duration
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(mutation, {
                variableValues: { id, duration },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; duration: string } = (graphqlResult.data as any)[Movie.operations.update][
                Movie.plural
            ][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(parseDuration(graphqlMovie.duration)).toStrictEqual(parsedDuration);

            const neo4jResult = await testHelper.executeCypher(
                `
                        MATCH (movie:${Movie} {id: $id})
                        RETURN movie {.id, .duration} as movie
                    `,
                { id }
            );

            const neo4jMovie: { id: string; duration: { toString(): string } } =
                neo4jResult.records[0]?.toObject().movie;
            expect(neo4jMovie).toBeDefined();
            expect(neo4jMovie.id).toEqual(id);
            expect(neo4jDriver.isDuration(neo4jMovie.duration)).toBe(true);
            expect(parseDuration(neo4jMovie.duration.toString())).toStrictEqual(parsedDuration);
        });
    });

    describe("filter", () => {
        test("should filter based on duration equality", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} {
                    id: ID!
                    duration: Duration!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({ readable: false });
            const days = 4;
            const duration = `P${days}D`;
            const parsedDuration = parseDuration(duration);
            const neo4jDuration = new neo4jDriver.types.Duration(0, days, 0, 0);

            await testHelper.executeCypher(
                `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
                { movie: { id, duration: neo4jDuration } }
            );

            const query = /* GraphQL */ `
                    query ($id: ID!, $duration: Duration!) {
                        ${Movie.plural}(where: { id: $id, duration: $duration }) {
                            id
                            duration
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(query, {
                variableValues: { id, duration },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const graphqlMovie: { id: string; duration: string } = (graphqlResult.data as any)[Movie.plural][0];
            expect(graphqlMovie).toBeDefined();
            expect(graphqlMovie.id).toEqual(id);
            expect(parseDuration(graphqlMovie.duration)).toStrictEqual(parsedDuration);
        });

        test.each(["LT", "LTE", "GT", "GTE"])(
            "should filter based on duration comparison, for filter: %s",
            async (filter) => {
                const typeDefs = `
                        type ${Movie} {
                            id: ID!
                            duration: Duration!
                        }
                    `;
                await testHelper.initNeo4jGraphQL({ typeDefs });

                const longId = generate({ readable: false });
                const long = "P2Y";
                const parsedLong = parseDuration(long);
                const neo4jLong = new neo4jDriver.types.Duration(
                    parsedLong.months,
                    parsedLong.days,
                    parsedLong.seconds,
                    parsedLong.nanoseconds
                );

                const mediumId = generate({ readable: false });
                const medium = "P2M";
                const parsedMedium = parseDuration(medium);
                const neo4jMedium = new neo4jDriver.types.Duration(
                    parsedMedium.months,
                    parsedMedium.days,
                    parsedMedium.seconds,
                    parsedMedium.nanoseconds
                );

                const shortId = generate({ readable: false });
                const short = "P2D";
                const parsedShort = parseDuration(short);
                const neo4jShort = new neo4jDriver.types.Duration(
                    parsedShort.months,
                    parsedShort.days,
                    parsedShort.seconds,
                    parsedShort.nanoseconds
                );

                await testHelper.executeCypher(
                    `
                                CREATE (long:${Movie})
                                SET long = $long
                                CREATE (medium:${Movie})
                                SET medium = $medium
                                CREATE (short:${Movie})
                                SET short = $short
                            `,
                    {
                        long: { id: longId, duration: neo4jLong },
                        medium: { id: mediumId, duration: neo4jMedium },
                        short: { id: shortId, duration: neo4jShort },
                    }
                );

                const query = /* GraphQL */ `
                        query ($where: ${Movie.name}Where!) {
                            ${Movie.plural}(where: $where, options: { sort: [{ duration: ASC }] }) {
                                id
                                duration
                            }
                        }
                    `;

                const graphqlResult = await testHelper.executeGraphQL(query, {
                    variableValues: {
                        where: { id_IN: [longId, mediumId, shortId], [`duration_${filter}`]: medium },
                    },
                });

                expect(graphqlResult.errors).toBeUndefined();

                const graphqlMovies: { id: string; duration: string }[] = (graphqlResult.data as any)[Movie.plural];
                expect(graphqlMovies).toBeDefined();

                /* eslint-disable jest/no-conditional-expect */
                if (filter === "LT") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(shortId);
                    expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedShort);
                }

                if (filter === "LTE") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(shortId);
                    expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedShort);

                    expect(graphqlMovies[1]?.id).toBe(mediumId);
                    expect(parseDuration(graphqlMovies[1]?.duration as string)).toStrictEqual(parsedMedium);
                }

                if (filter === "GT") {
                    expect(graphqlMovies).toHaveLength(1);
                    expect(graphqlMovies[0]?.id).toBe(longId);
                    expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedLong);
                }

                if (filter === "GTE") {
                    expect(graphqlMovies).toHaveLength(2);
                    expect(graphqlMovies[0]?.id).toBe(mediumId);
                    expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedMedium);

                    expect(graphqlMovies[1]?.id).toBe(longId);
                    expect(parseDuration(graphqlMovies[1]?.duration as string)).toStrictEqual(parsedLong);
                }
                /* eslint-enable jest/no-conditional-expect */
            }
        );
    });
});
