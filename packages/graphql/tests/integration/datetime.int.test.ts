import camelCase from "camelcase";
import { Driver, DateTime } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import pluralize from "pluralize";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}", datetime: "${date.toISOString()}" }]) {
                        movies {
                            datetime
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}", datetimes: ["${date.toISOString()}", "${date.toISOString()}", "${date.toISOString()}"] }]) {
                        movies {
                            datetimes
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

            const pluralRandomType = pluralize(camelCase(randomType));

            const typeDefs = `
                type ${randomType} {
                    datetime: DateTime
                }
            `;

            const date = new Date();

            const neoSchema = new Neo4jGraphQL({
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

        test("should find a movie (with a DateTime created with a timezone)", async () => {
            const session = driver.session();

            const randomType = `${generate({
                charset: "alphabetic",
            })}Movie`;

            const pluralRandomType = pluralize(camelCase(randomType));

            const typeDefs = `
                type ${randomType} {
                    name: String
                    datetime: DateTime
                }
            `;

            const date = new Date();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const query = `
                query {
                    ${pluralRandomType}(where: { name: "${randomType}" }) {
                        datetime
                    }
                }
            `;

            try {
                await session.run(`
                   CREATE (m:${randomType})
                   SET m.name = "${randomType}"
                   SET m.datetime = datetime("${date.toISOString().replace("Z", "[America/Los_Angeles]")}")
               `);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver },
                });

                date.setHours(date.getHours() + 8);

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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: {datetime: "${date.toISOString()}"}) {
                        movies {
                            id
                            datetime
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
