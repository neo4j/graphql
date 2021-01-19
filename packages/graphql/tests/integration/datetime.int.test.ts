import { Driver, DateTime } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import pluralize from "pluralize";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("DateTime", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create a movie (with a DateTime)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                  id: ID
                  datetime: DateTime
                }
            `;

            const date = new Date();

            const neoSchema = makeAugmentedSchema({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}", datetime: "${date.toISOString()}" }]) {
                        datetime
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
                    RETURN m {.id, .datetime} as m
                `);

                const movie: { id: string; datetime: DateTime } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.datetime.toString()).toISOString()).toEqual(date.toISOString());
            } finally {
                await session.close();
            }
        });

        test("should create a movie (with many DateTime)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                  id: ID
                  datetimes: [DateTime]
                }
            `;

            const date = new Date();

            const neoSchema = makeAugmentedSchema({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}", datetimes: ["${date.toISOString()}", "${date.toISOString()}", "${date.toISOString()}"] }]) {
                        datetimes
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
                    RETURN m {.id, .datetimes} as m
                `);

                const movie: { id: string; datetimes: DateTime[] } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);

                movie.datetimes.forEach((dt) => {
                    expect(new Date(dt.toString()).toISOString()).toEqual(date.toISOString());
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("find", () => {
        test("should find a movie (with a DateTime)", async () => {
            const session = driver.session();

            const randomType = `${generate({
                charset: "alphabetic",
            })}Movie`;

            const pluralRandomType = pluralize(randomType);

            const typeDefs = `
                type ${randomType} {
                    datetime: DateTime
                }
            `;

            const date = new Date();

            const neoSchema = makeAugmentedSchema({
                typeDefs,
            });

            const query = `
                query {
                    ${pluralRandomType}(where: { datetime: "${date.toISOString()}" }) {
                        datetime
                    }
                }
            `;

            try {
                await session.run(`
                   CREATE (m:${randomType})
                   SET m.datetime = datetime("${date.toISOString()}")
               `);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();
                expect((gqlResult.data as any)[pluralRandomType][0]).toEqual({ datetime: date.toISOString() });
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with a DateTime)", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                  id: ID
                  datetime: DateTime
                }
            `;

            const date = new Date();

            const neoSchema = makeAugmentedSchema({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: {datetime: "${date.toISOString()}"}) {
                        id
                        datetime
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
                    RETURN m {.id, .datetime} as m
                `);

                const movie: { id: string; datetime: DateTime } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.datetime.toString()).toISOString()).toEqual(date.toISOString());
            } finally {
                await session.close();
            }
        });
    });
});
