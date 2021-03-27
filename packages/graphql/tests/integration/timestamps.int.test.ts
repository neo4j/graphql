import { Driver, DateTime } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

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
                type Movie {
                  id: ID
                  createdAt: DateTime @timestamp(operations: [CREATE])
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}" }]) {
                        movies {
                            id
                        }
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
                    RETURN m {.id, .createdAt} as m
                `);

                const movie: {
                    id: string;
                    createdAt: DateTime;
                } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                  id: ID
                  updatedAt: DateTime @timestamp(operations: [UPDATE])
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: { id: "${id}" }) {
                        movies {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${id}"})
                `);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: create,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

                const movie: {
                    id: string;
                    updatedAt: DateTime;
                } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });
    });
});
