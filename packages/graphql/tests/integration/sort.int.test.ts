import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("sort", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should sort a list of nodes", async () => {
        await Promise.all(
            ["ASC", "DESC"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Movie {
                        id: ID
                        number: Int
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const movieIds = [
                    generate({
                        charset: "alphabetic",
                    }),
                    generate({
                        charset: "alphabetic",
                    }),
                    generate({
                        charset: "alphabetic",
                    }),
                ].map((x) => `"${x}"`);

                const query = `
                    query {
                        movies(
                            where: { id_IN: [${movieIds.join(",")}] },
                            options: { sort: [{ number: ${type} }] }
                        ) {
                           number
                        }
                    }
                `;

                try {
                    await session.run(`
                        CREATE (:Movie {id: ${movieIds[0]}, number: 1})
                        CREATE (:Movie {id: ${movieIds[1]}, number: 2})
                        CREATE (:Movie {id: ${movieIds[2]}, number: 3})
                    `);

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const { movies } = gqlResult.data as any;

                    /* eslint-disable jest/no-conditional-expect */
                    if (type === "ASC") {
                        expect(movies[0].number).toEqual(1);
                        expect(movies[1].number).toEqual(2);
                        expect(movies[2].number).toEqual(3);
                    }

                    if (type === "DESC") {
                        expect(movies[0].number).toEqual(3);
                        expect(movies[1].number).toEqual(2);
                        expect(movies[2].number).toEqual(1);
                    }
                    /* eslint-enable jest/no-conditional-expect */
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should sort nested relationships", async () => {
        await Promise.all(
            ["ASC", "DESC"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Movie {
                        id: ID
                        genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                    }

                    type Genre {
                        id: ID
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const query = `
                    query {
                        movies(where: { id: "${movieId}" }) {
                            genres(options: { sort: [{ id: ${type} }] }) {
                                id
                            }
                        }
                    }
                `;

                try {
                    await session.run(`
                        CREATE (m:Movie {id: "${movieId}"})
                        CREATE (g1:Genre {id: "1"})
                        CREATE (g2:Genre {id: "2"})
                        MERGE (m)-[:HAS_GENRE]->(g1)
                        MERGE (m)-[:HAS_GENRE]->(g2)
                    `);

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    const { genres } = (gqlResult.data as any).movies[0];

                    /* eslint-disable jest/no-conditional-expect */
                    if (type === "ASC") {
                        expect(genres[0].id).toEqual("1");
                        expect(genres[1].id).toEqual("2");
                    }

                    if (type === "DESC") {
                        expect(genres[0].id).toEqual("2");
                        expect(genres[1].id).toEqual("1");
                    }
                    /* eslint-enable jest/no-conditional-expect */
                } finally {
                    await session.close();
                }
            })
        );
    });
});
