import { Driver, int } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("floats", () => {
    let driver: Driver;
    const imdbRating_float = 4.0;
    const imdbRating_int = 4;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie with float (as ast value)", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: String
                imdbRating_float: Float
                imdbRating_int: Int
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{
                    id: "${id}",
                    imdbRating_float: ${imdbRating_float}
                    imdbRating_int: ${imdbRating_int}
                }]) {
                    id
                    imdbRating_float
                    imdbRating_int
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies[0]).toEqual({ id, imdbRating_float, imdbRating_int });

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .imdbRating_float, .imdbRating_int} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({
                id,
                imdbRating_float,
                imdbRating_int: int(imdbRating_int),
            });
        } finally {
            await session.close();
        }
    });

    test("should create a movie with float (as variable)", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: String
                imdbRating_float: Float
                imdbRating_int: Int
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    id
                    imdbRating_float
                    imdbRating_int
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
                variableValues: {
                    imdbRating_float,
                    imdbRating_int,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies[0]).toEqual({ id, imdbRating_float, imdbRating_int });

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .imdbRating_float, .imdbRating_int} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({
                id,
                imdbRating_float,
                imdbRating_int: int(imdbRating_int),
            });
        } finally {
            await session.close();
        }
    });

    test("should preserve floats on custom cypher mutation", async () => {
        const float = 4.0;
        const floats = [float, float, float];

        const session = driver.session();

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
                        """
                    )
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

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
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
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
});
