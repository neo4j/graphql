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

import { Time } from "neo4j-driver";
import { generate } from "randomstring";
import { parseTime } from "../../../src/graphql/scalars/Time";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Time - deprecated filters", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should filter based on time equality", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                    id: ID!
                    time: Time!
                }
            `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({ readable: false });
        const date = new Date("2024-02-17T11:49:48.322Z");
        const time = date.toISOString().split("T")[1];
        const neo4jTime = Time.fromStandardDate(date);
        const parsedTime = parseTime(time);

        await testHelper.executeCypher(
            `
                        CREATE (movie:${Movie})
                        SET movie = $movie
                    `,
            { movie: { id, time: neo4jTime } }
        );

        const query = /* GraphQL */ `
                    query ($time: Time!) {
                        ${Movie.plural}(where: { time_EQ: $time }) {
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
        expect(parseTime(graphqlMovie.time)).toStrictEqual(parsedTime);
    });

    test.each(["LT", "LTE", "GT", "GTE"])("should filter based on time comparison for filter: %s", async (filter) => {
        const typeDefs = /* GraphQL */ `
                        type ${Movie} @node {
                            id: ID!
                            time: Time!
                        }
                    `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const futureId = generate({ readable: false });
        const future = "13:00:00";
        const parsedFuture = parseTime(future);
        const neo4jFuture = new Time(
            parsedFuture.hour,
            parsedFuture.minute,
            parsedFuture.second,
            parsedFuture.nanosecond,
            parsedFuture.timeZoneOffsetSeconds
        );

        const presentId = generate({ readable: false });
        const present = "12:00:00";
        const parsedPresent = parseTime(present);
        const neo4jPresent = new Time(
            parsedPresent.hour,
            parsedPresent.minute,
            parsedPresent.second,
            parsedPresent.nanosecond,
            parsedPresent.timeZoneOffsetSeconds
        );

        const pastId = generate({ readable: false });
        const past = "11:00:00";
        const parsedPast = parseTime(past);
        const neo4jPast = new Time(
            parsedPast.hour,
            parsedPast.minute,
            parsedPast.second,
            parsedPast.nanosecond,
            parsedPast.timeZoneOffsetSeconds
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
            expect(parseTime(graphqlMovies[0]?.time)).toStrictEqual(parsedPast);
        }

        if (filter === "LTE") {
            expect(graphqlMovies).toHaveLength(2);
            expect(graphqlMovies[0]?.id).toBe(pastId);
            expect(parseTime(graphqlMovies[0]?.time)).toStrictEqual(parsedPast);

            expect(graphqlMovies[1]?.id).toBe(presentId);
            expect(parseTime(graphqlMovies[1]?.time)).toStrictEqual(parsedPresent);
        }

        if (filter === "GT") {
            expect(graphqlMovies).toHaveLength(1);
            expect(graphqlMovies[0]?.id).toBe(futureId);
            expect(parseTime(graphqlMovies[0]?.time)).toStrictEqual(parsedFuture);
        }

        if (filter === "GTE") {
            expect(graphqlMovies).toHaveLength(2);
            expect(graphqlMovies[0]?.id).toBe(presentId);
            expect(parseTime(graphqlMovies[0]?.time)).toStrictEqual(parsedPresent);

            expect(graphqlMovies[1]?.id).toBe(futureId);
            expect(parseTime(graphqlMovies[1]?.time)).toStrictEqual(parsedFuture);
        }
        /* eslint-enable jest/no-conditional-expect */
    });
});
