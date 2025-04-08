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
import { parseLocalDateTime } from "../../../../../src/graphql/scalars/LocalDateTime";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("LocalDateTime - deprecated filters", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
        type ${Movie} @node {
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
                    ${Movie.plural}(where: { localDT_EQ: $localDT }) {
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
            const future = "6025-02-18T18:10:55.462Z".split("Z")[0];
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
                            ${Movie.plural}(where: $where, sort: [{ localDT: ASC }]) {
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
