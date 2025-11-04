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

import { int } from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Float", () => {
    const imdbRatingFloat = 4.0;
    const imdbRatingInt = 4;

    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a movie with float (as ast value)", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                id: String
                imdbRating_float: Float
                imdbRating_int: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input:[{
                    id: "${id}",
                    imdbRating_float: ${imdbRatingFloat}
                    imdbRating_int: ${imdbRatingInt}
                }]) {
                    ${Movie.plural} {
                        id
                        imdbRating_float
                        imdbRating_int
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create, {});

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0]).toEqual({
            id,
            imdbRating_float: imdbRatingFloat,
            imdbRating_int: imdbRatingInt,
        });

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie} {id: "${id}"})
                RETURN m {.id, .imdbRating_float, .imdbRating_int} as m
            `);

        expect((result.records[0]?.toObject() as any).m).toEqual({
            id,
            imdbRating_float: imdbRatingFloat,
            imdbRating_int: int(imdbRatingInt),
        });
    });

    test("should create a movie with float (as variable)", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                id: String
                imdbRating_float: Float
                imdbRating_int: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation($imdbRating_float: Float, $imdbRating_int: Int) {
                ${Movie.operations.create}(input:[{
                    id: "${id}",
                    imdbRating_float: $imdbRating_float,
                    imdbRating_int: $imdbRating_int
                }]) {
                    ${Movie.plural} {
                        id
                        imdbRating_float
                        imdbRating_int
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create, {
            variableValues: {
                imdbRating_float: imdbRatingFloat,
                imdbRating_int: imdbRatingInt,
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0]).toEqual({
            id,
            imdbRating_float: imdbRatingFloat,
            imdbRating_int: imdbRatingInt,
        });

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie} {id: "${id}"})
                RETURN m {.id, .imdbRating_float, .imdbRating_int} as m
            `);

        expect((result.records[0]?.toObject() as any).m).toEqual({
            id,
            imdbRating_float: imdbRatingFloat,
            imdbRating_int: int(imdbRatingInt),
        });
    });

    test("should preserve floats on custom cypher mutation", async () => {
        const float = 4.0;
        const floats = [float, float, float];

        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                id: String
            }

            input Nested {
                floats: [Float]
            }

            type Mutation {
                float(id: ID, float: Float, nested: Nested): Float
                    @cypher(
                        statement: """
                        CREATE (m:${Movie} {id: $id, float: $float, floats: $nested.floats})
                        RETURN m.float as result
                        """,
                        columnName: "result"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation($float: Float, $floats: [Float]) {
                float(id: "${id}", float: $float, nested: {floats: $floats})
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create, {
            variableValues: {
                float,
                floats,
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).float).toEqual(float);

        const result = await testHelper.executeCypher(`
                MATCH (m:${Movie} {id: "${id}"})
                RETURN m {.id, .float, .floats} as m
            `);

        expect((result.records[0]?.toObject() as any).m).toEqual({
            id,
            float,
            floats,
        });
    });

    test("should return normal JS number if the value isInt", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                id: String
                fakeFloat: Float! @cypher(statement: """
                    RETURN 12345 as result
                """, columnName: "result")
            }


        `;

        const id = generate({
            charset: "alphabetic",
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { id: "${id}" }){
                    fakeFloat
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} { id: "${id}" })
            `,
            {}
        );
        const gqlResult = await testHelper.executeGraphQL(query, {});

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.plural][0].fakeFloat).toBe(12345);
    });
});
