import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("floats", () => {
    let driver: Driver;
    const rating = 4.9;

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
                rating: Float
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}", rating: ${rating}}]) {
                    id
                    rating
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
            expect((gqlResult.data as any).createMovies[0]).toEqual({ id, rating });

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .rating} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({ id, rating });
        } finally {
            await session.close();
        }
    });

    test("should create a movie with float (as variable)", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: String
                rating: Float
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation($rating: Float) {
                createMovies(input:[{id: "${id}", rating: $rating}]) {
                    id
                    rating
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
                variableValues: { rating },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies[0]).toEqual({ id, rating });

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .rating} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({ id, rating });
        } finally {
            await session.close();
        }
    });
});
