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

import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { DocumentNode, graphql } from "graphql";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { generateUniqueType } from "../utils/graphql-types";
import { createJwtRequest } from "../utils/create-jwt-request";

describe("unions", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and return unions", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            const movies = (gqlResult.data as any).movies[0];

            const movieSearch = movies.search.find((x: Record<string, string>) => x.__typename === "Movie");
            expect(movieSearch.title).toEqual(movieTitle);
            const genreSearch = movies.search.find((x: Record<string, string>) => x.__typename === "Genre");
            expect(genreSearch.name).toEqual(genreName);
        } finally {
            await session.close();
        }
    });

    test("should read and return correct union members with where argument", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
        });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName1 = generate({
            charset: "alphabetic",
        });

        const genreName2 = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                movies (where: {title: "${movieTitle}"}) {
                    search(where: { Genre: { name: "${genreName1}" }}) {
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
                CREATE (g1:Genre {name: "${genreName1}"})
                CREATE (g2:Genre {name: "${genreName2}"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g1)
                MERGE (m)-[:SEARCH]->(g2)
            `);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).movies[0]).toEqual({
                search: [{ __typename: "Genre", name: genreName1 }],
            });
        } finally {
            await session.close();
        }
    });

    test("should read and return unions with sort and limit", async () => {
        const session = await neo4j.getSession();
        const movieType = generateUniqueType("Movie");
        const genreType = generateUniqueType("Genre");

        const typeDefs = `
            union Search = ${movieType} | ${genreType}

            type ${genreType} {
                name: String
            }

            type ${movieType} {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
        });

        const query = `
        {
            ${movieType.plural}(where: { title:"originalMovie" }) {
                search(
                    options: { offset: 1, limit: 3 }
                ) {
                    ... on ${movieType} {
                        title
                    }
                    ... on ${genreType} {
                        name
                    }
                }
            }
        }
        `;

        try {
            await session.run(`
                CREATE (m:${movieType} {title: "originalMovie"})
                CREATE (m1:${movieType} {title: "movie1"})
                CREATE (m2:${movieType} {title: "movie2"})
                CREATE (g1:${genreType} {name: "genre1"})
                CREATE (g2:${genreType} {name: "genre2"})
                MERGE (m)-[:SEARCH]->(m1)
                MERGE (m)-[:SEARCH]->(m2)
                MERGE (m)-[:SEARCH]->(g1)
                MERGE (m)-[:SEARCH]->(g2)
            `);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[movieType.plural][0].search).toHaveLength(3);
        } finally {
            await session.close();
        }
    });

    test("should create a nested union", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

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
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = Movie | Genre

            type Genre {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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

    describe("Unions with auth", () => {
        const secret = "secret";
        let typeDefs: DocumentNode;
        let neoSchema: Neo4jGraphQL;

        const typeGenre = generateUniqueType("Genre");
        const typeMovie = generateUniqueType("Movie");

        beforeAll(() => {
            typeDefs = gql`
                union Search = ${typeMovie} | ${typeGenre}


                type ${typeGenre} @auth(rules: [{ operations: [READ], allow: { name: "$jwt.jwtAllowedNamesExample" } }]) {
                    name: String
                }

                type ${typeMovie} {
                    title: String
                    search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
        });

        test("Read Unions with allow auth fail", async () => {
            const session = await neo4j.getSession();
            await session.run(`
            CREATE (m:${typeMovie} { title: "some title" })
            CREATE (:${typeGenre} { name: "Romance" })<-[:SEARCH]-(m)
            CREATE (:${typeMovie} { title: "The Matrix" })<-[:SEARCH]-(m)`);

            const query = `
                {
                    ${typeMovie.plural}(where: { title: "some title" }) {
                        title
                        search(
                            where: { ${typeMovie}: { title: "The Matrix" }, ${typeGenre}: { name: "Romance" } }
                        ) {
                            ... on ${typeMovie} {
                                title
                            }
                            ... on ${typeGenre} {
                                name
                            }
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { jwtAllowedNamesExample: "Horror" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });
                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("Read Unions with allow auth", async () => {
            const session = await neo4j.getSession();
            await session.run(`
            CREATE (m:${typeMovie} { title: "another title" })
            CREATE (:${typeGenre} { name: "Romance" })<-[:SEARCH]-(m)
            CREATE (:${typeMovie} { title: "The Matrix" })<-[:SEARCH]-(m)`);

            const query = `
                {
                    ${typeMovie.plural}(where: { title: "another title" }) {
                        title
                        search(
                            where: { ${typeMovie}: { title: "The Matrix" }, ${typeGenre}: { name: "Romance" } }
                        ) {
                            ... on ${typeMovie} {
                                title
                            }
                            ... on ${typeGenre} {
                                name
                            }
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { jwtAllowedNamesExample: "Romance" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });
                expect(gqlResult.errors).toBeFalsy();
                expect(gqlResult.data?.[typeMovie.plural] as any).toEqual([
                    {
                        title: "another title",
                        search: expect.toIncludeSameMembers([{ title: "The Matrix" }, { name: "Romance" }]),
                    },
                ]);
            } finally {
                await session.close();
            }
        });
    });
});
