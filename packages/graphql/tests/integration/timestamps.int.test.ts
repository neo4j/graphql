import { Driver, DateTime } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("TimeStamps", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie @timestamps {
                  id: ID
                }
            `;

            const neoSchema = makeAugmentedSchema({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}" }]) {
                        id
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

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .createdAt, .updatedAt} as m
                `);

                const movie: {
                    id: string;
                    createdAt: DateTime;
                    updatedAt: DateTime;
                } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.createdAt.toString()).toISOString()).toEqual(
                    new Date(movie.updatedAt.toString()).toISOString()
                );
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie @timestamps {
                  id: ID
                }
            `;

            const neoSchema = makeAugmentedSchema({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: { id: "${id}" }) {
                        id
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${id}"})
                    SET m.createdAt = datetime()
                `);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: create,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .createdAt, .updatedAt} as m
                `);

                const movie: {
                    id: string;
                    createdAt: DateTime;
                    updatedAt: DateTime;
                } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.createdAt.toString()).getTime()).toBeLessThan(
                    new Date(movie.updatedAt.toString()).getTime()
                );
            } finally {
                await session.close();
            }
        });
    });
});
