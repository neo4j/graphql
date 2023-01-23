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

import type { Driver } from "neo4j-driver";
import { int } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Float", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const imdbRatingFloat = 4.0;
    const imdbRatingInt = 4;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie with float (as ast value)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: String
                imdbRating_float: Float
                imdbRating_int: Int
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{
                    id: "${id}",
                    imdbRating_float: ${imdbRatingFloat}
                    imdbRating_int: ${imdbRatingInt}
                }]) {
                    movies {
                        id
                        imdbRating_float
                        imdbRating_int
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies.movies[0]).toEqual({
                id,
                imdbRating_float: imdbRatingFloat,
                imdbRating_int: imdbRatingInt,
            });

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .imdbRating_float, .imdbRating_int} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({
                id,
                imdbRating_float: imdbRatingFloat,
                imdbRating_int: int(imdbRatingInt),
            });
        } finally {
            await session.close();
        }
    });

    test("should create a movie with float (as variable)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: String
                imdbRating_float: Float
                imdbRating_int: Int
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation($imdbRating_float: Float, $imdbRating_int: Int) {
                createMovies(input:[{
                    id: "${id}",
                    imdbRating_float: $imdbRating_float,
                    imdbRating_int: $imdbRating_int
                }]) {
                    movies {
                        id
                        imdbRating_float
                        imdbRating_int
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    imdbRating_float: imdbRatingFloat,
                    imdbRating_int: imdbRatingInt,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies.movies[0]).toEqual({
                id,
                imdbRating_float: imdbRatingFloat,
                imdbRating_int: imdbRatingInt,
            });

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .imdbRating_float, .imdbRating_int} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({
                id,
                imdbRating_float: imdbRatingFloat,
                imdbRating_int: int(imdbRatingInt),
            });
        } finally {
            await session.close();
        }
    });

    test("should preserve floats on custom cypher mutation", async () => {
        const float = 4.0;
        const floats = [float, float, float];

        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: String
            }

            input Nested {
                floats: [Float]
            }

            type Mutation {
                float(id: ID, float: Float, nested: Nested): Float
                    @cypher(
                        statement: """
                        CREATE (m:Movie {id: $id, float: $float, floats: $nested.floats})
                        RETURN m.float
                        """,
                        columnName: "m.float"
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation($float: Float, $floats: [Float]) {
                float(id: "${id}", float: $float, nested: {floats: $floats})
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    float,
                    floats,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).float).toEqual(float);

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .float, .floats} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({
                id,
                float,
                floats,
            });
        } finally {
            await session.close();
        }
    });

    test("should return normal JS number if the value isInt", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
                id: String
                fakeFloat: Float! @cypher(statement: """
                    RETURN 12345 as result
                """, columnName: "result")
            }


        `;

        const id = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                movies(where: { id: "${id}" }){
                    fakeFloat
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (m:Movie { id: "${id}" })
            `,
                {}
            );
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).movies[0].fakeFloat).toBe(12345);
        } finally {
            await session.close();
        }
    });
});
