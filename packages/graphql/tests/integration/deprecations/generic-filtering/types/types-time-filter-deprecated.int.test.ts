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

import { generate } from "randomstring";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

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
        expect(graphqlMovie.time).toStrictEqual(time);
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
            expect(graphqlMovies[0]?.time).toStrictEqual(past);
        }

        if (filter === "LTE") {
            expect(graphqlMovies).toHaveLength(2);
            expect(graphqlMovies[0]?.id).toBe(pastId);
            expect(graphqlMovies[0]?.time).toStrictEqual(past);

            expect(graphqlMovies[1]?.id).toBe(presentId);
            expect(graphqlMovies[1]?.time).toStrictEqual(present);
        }

        if (filter === "GT") {
            expect(graphqlMovies).toHaveLength(1);
            expect(graphqlMovies[0]?.id).toBe(futureId);
            expect(graphqlMovies[0]?.time).toStrictEqual(future);
        }

        if (filter === "GTE") {
            expect(graphqlMovies).toHaveLength(2);
            expect(graphqlMovies[0]?.id).toBe(presentId);
            expect(graphqlMovies[0]?.time).toStrictEqual(present);

            expect(graphqlMovies[1]?.id).toBe(futureId);
            expect(graphqlMovies[1]?.time).toStrictEqual(future);
        }
        /* eslint-enable jest/no-conditional-expect */
    });
});
