import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("unions", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and return unions", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: "OUT")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies (where: {title: "${movieTitle}"}) {
                    search {
                        __typename
                        ... on Movie {
                            title
                        }
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:Movie {title: "${movieTitle}"})
                CREATE (g:Genre {name: "${genreName}"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            const movies = (gqlResult.data as any).movies[0] as any;

            const movieSearch = movies.search.find((x) => x.__typename === "Movie");
            expect(movieSearch.title).toEqual(movieTitle);
            const genreSearch = movies.search.find((x) => x.__typename === "Genre");
            expect(genreSearch.name).toEqual(genreName);
        } finally {
            await session.close();
        }
    });

    test("should create a nested union", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: "OUT")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                createMovies(input: [{
                    title: "${movieTitle}",
                    search_Genre: {
                        create: [{
                            name: "${genreName}"
                        }]
                    }
                }]) {
                    movies {
                        title
                        search {
                            __typename
                            ...on Genre {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies.movies[0] as any).toMatchObject({
                title: movieTitle,
                search: [{ __typename: "Genre", name: genreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should connect to a union", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: "OUT")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                createMovies(input: [{
                    title: "${movieTitle}",
                    search_Genre: {
                        connect: [{
                            where: { name: "${genreName}" }
                        }]
                    }
                }]) {
                    movies {
                        title
                        search {
                            __typename
                            ...on Genre {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Genre {name: "${genreName}"})
            `);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies.movies[0] as any).toMatchObject({
                title: movieTitle,
                search: [{ __typename: "Genre", name: genreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update a union", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: "OUT")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName = generate({
            charset: "alphabetic",
        });

        const newGenreName = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" },
                    update: {
                        search_Genre: {
                            where: { name: "${genreName}" },
                            update: {
                                name: "${newGenreName}"
                            }
                        }
                    }
                ) {
                    movies {
                        title
                        search {
                            __typename
                            ...on Genre {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie {title: "${movieTitle}"})-[:SEARCH]->(:Genre {name: "${genreName}"})
            `);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).updateMovies.movies[0] as any).toMatchObject({
                title: movieTitle,
                search: [{ __typename: "Genre", name: newGenreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should disconnect from a union", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: "OUT")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" },
                    update: {
                        search_Genre: {
                            disconnect: [{
                                where: { name: "${genreName}" }
                            }]
                        }
                    }
                ) {
                    movies {
                        title
                        search {
                            __typename
                            ...on Genre {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie {title: "${movieTitle}"})-[:SEARCH]->(:Genre {name: "${genreName}"})
            `);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).updateMovies.movies[0] as any).toMatchObject({
                title: movieTitle,
                search: [],
            });
        } finally {
            await session.close();
        }
    });
});
