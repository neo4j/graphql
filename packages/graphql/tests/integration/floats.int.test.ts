import { Driver, int } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("floats", () => {
    let driver: Driver;
    const imdbRatingFloat = 4.0;
    const imdbRatingInt = 4;

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
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
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
        const session = driver.session();

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
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
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

    test("should return normal JS number if the value isInt", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: String
                fakeFloat: Float! @cypher(statement: """
                    RETURN 12345
                """)
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
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).movies[0].fakeFloat).toEqual(12345);
        } finally {
            await session.close();
        }
    });
});
