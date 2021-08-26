/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            const movies = (gqlResult.data as any).movies[0];

            const movieSearch = movies.search.find((x) => x.__typename === "Movie"); // eslint-disable-line no-underscore-dangle
            expect(movieSearch.title).toEqual(movieTitle);
            const genreSearch = movies.search.find((x) => x.__typename === "Genre"); // eslint-disable-line no-underscore-dangle
            expect(genreSearch.name).toEqual(genreName);
        } finally {
            await session.close();
        }
    });

    test("should read and return correct union members with where argument", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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
                    search(where: { Genre: { name: "${genreName}" }}) {
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).movies[0]).toEqual({
                search: [{ __typename: "Genre", name: genreName }],
            });
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
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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
                    search: {
                        Genre: {
                            create: [{
                                node: {
                                    name: "${genreName}"
                                }
                            }]
                        }
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies.movies[0]).toMatchObject({
                title: movieTitle,
                search: [{ __typename: "Genre", name: genreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should create multiple nested unions", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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

        const nestedMovieTitle = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                createMovies(input: [{
                    title: "${movieTitle}",
                    search: {
                        Genre: {
                            create: [{
                                node: {
                                    name: "${genreName}"
                                }
                            }]
                        }
                        Movie: {
                            create: [{
                                node: {
                                    title: "${nestedMovieTitle}"
                                }
                            }]
                        }
                    }
                }]) {
                    movies {
                        title
                        search {
                            __typename
                            ...on Genre {
                                name
                            }
                            ... on Movie {
                                title
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();
            // expect((gqlResult.data as any).createMovies.movies[0]).toEqual({
            //     title: movieTitle,
            //     search: [
            //         { __typename: "Genre", name: genreName },
            //         { __typename: "Movie", title: nestedMovieTitle },
            //     ],
            // });

            expect((gqlResult.data as any).createMovies.movies[0].title).toEqual(movieTitle);
            expect((gqlResult.data as any).createMovies.movies[0].search).toHaveLength(2);
            expect((gqlResult.data as any).createMovies.movies[0].search).toContainEqual({
                __typename: "Genre",
                name: genreName,
            });
            expect((gqlResult.data as any).createMovies.movies[0].search).toContainEqual({
                __typename: "Movie",
                title: nestedMovieTitle,
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
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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
                    search: {
                        Genre: {
                            connect: [{
                                where: { node: { name: "${genreName}" } }
                            }]
                        }
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createMovies.movies[0]).toMatchObject({
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
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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
                        search: {
                            Genre: {
                                where: { node: { name: "${genreName}" } },
                                update: {
                                    node: { name: "${newGenreName}" }
                                }
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).updateMovies.movies[0]).toMatchObject({
                title: movieTitle,
                search: [{ __typename: "Genre", name: newGenreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update multiple unions", async () => {
        const session = driver.session();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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

        const nestedMovieTitle = generate({
            charset: "alphabetic",
        });

        const newNestedMovieTitle = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" },
                    update: {
                        search: {
                            Genre: {
                                where: { node: { name: "${genreName}" } },
                                update: {
                                    node: { name: "${newGenreName}" }
                                }
                            }
                            Movie: {
                                where: { node: { title: "${nestedMovieTitle}" } },
                                update: {
                                    node: { title: "${newNestedMovieTitle}" }
                                }
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
                            ...on Movie {
                                title
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:Movie {title: "${movieTitle}"})-[:SEARCH]->(:Genre {name: "${genreName}"})
                CREATE (m)-[:SEARCH]->(:Movie {title: "${nestedMovieTitle}"})
            `);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).updateMovies.movies[0].title).toEqual(movieTitle);
            expect((gqlResult.data as any).updateMovies.movies[0].search).toHaveLength(2);
            expect((gqlResult.data as any).updateMovies.movies[0].search).toContainEqual({
                __typename: "Genre",
                name: newGenreName,
            });
            expect((gqlResult.data as any).updateMovies.movies[0].search).toContainEqual({
                __typename: "Movie",
                title: newNestedMovieTitle,
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
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
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
                        search: {
                            Genre: {
                                disconnect: [{
                                    where: { node: { name: "${genreName}" } }
                                }]
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).updateMovies.movies[0]).toMatchObject({
                title: movieTitle,
                search: [],
            });
        } finally {
            await session.close();
        }
    });
});
