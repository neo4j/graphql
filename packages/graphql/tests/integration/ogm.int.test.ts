import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import { parse } from "graphql";
import gql from "graphql-tag";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("ogm", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("find", () => {
        test("find a single node", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}"})
                `);

                const Movie = neoSchema.model("Movie");

                const movies = await Movie.find({ where: { id } });

                expect(movies).toEqual([{ id }]);
            } finally {
                await session.close();
            }
        });

        test("should find and limit", async () => {
            const session = driver.session();

            const typeDefs = `
                type Movie {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

            const id = generate({
                charset: "alphabetic",
            });

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                    CREATE (:Movie {id: "${id}"})
                `);

                const Movie = neoSchema.model("Movie");

                const movies = await Movie.find({ where: { id }, options: { limit: 2 } });

                expect(movies).toEqual([{ id }, { id }]);
            } finally {
                await session.close();
            }
        });

        describe("Selection Set", () => {
            test("should find and populate relationship using custom string", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Genre {
                        id: ID
                    }

                    type Movie {
                        id: ID
                        genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
                    }
                `;

                const selectionSet = `
                    {
                        id
                        genres {
                            id
                        }
                    }
                `;

                const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

                const id = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(`
                        CREATE (m:Movie {id: "${id}"})
                        CREATE (g:Genre {id: "${id}"})
                        MERGE (m)-[:HAS_GENRE]->(g)
                    `);

                    const Movie = neoSchema.model("Movie");

                    const movies = await Movie.find({ where: { id }, selectionSet });

                    expect(movies).toEqual([{ id, genres: [{ id }] }]);
                } finally {
                    await session.close();
                }
            });

            test("should find and populate relationship using document", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Genre {
                        id: ID
                    }

                    type Movie {
                        id: ID
                        genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
                    }
                `;

                const selectionSet = parse(`
                    {
                        id
                        genres {
                            id
                        }
                    }
                `);

                const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

                const id = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(`
                        CREATE (m:Movie {id: "${id}"})
                        CREATE (g:Genre {id: "${id}"})
                        MERGE (m)-[:HAS_GENRE]->(g)
                    `);

                    const Movie = neoSchema.model("Movie");

                    const movies = await Movie.find({ where: { id }, selectionSet });

                    expect(movies).toEqual([{ id, genres: [{ id }] }]);
                } finally {
                    await session.close();
                }
            });

            test("should find and populate relationship using gql-tag", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Genre {
                        id: ID
                    }
                
                    type Movie {
                        id: ID
                        genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
                    }
                `;

                const selectionSet = gql`
                    {
                        id
                        genres {
                            id
                        }
                    }
                `;

                const neoSchema = makeAugmentedSchema({ typeDefs, context: { driver } });

                const id = generate({
                    charset: "alphabetic",
                });

                try {
                    await session.run(`
                        CREATE (m:Movie {id: "${id}"})
                        CREATE (g:Genre {id: "${id}"})
                        MERGE (m)-[:HAS_GENRE]->(g)
                    `);

                    const Movie = neoSchema.model("Movie");

                    const movies = await Movie.find({ where: { id }, selectionSet });

                    expect(movies).toEqual([{ id, genres: [{ id }] }]);
                } finally {
                    await session.close();
                }
            });
        });
    });
});
