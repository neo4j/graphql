import { Driver, int } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("floats", () => {
    let driver: Driver;
    const imdbRating_float = 4.9;
    const imdbRating_int = 4.0;

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
});
