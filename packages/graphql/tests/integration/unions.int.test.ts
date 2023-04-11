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
import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";
import { createJwtRequest } from "../utils/create-jwt-request";

describe("unions", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    let GenreType: UniqueType;
    let MovieType: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(() => {
        GenreType = new UniqueType("Genre");
        MovieType = new UniqueType("Movie");
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and return unions", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${GenreType} | ${MovieType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.plural} (where: {title: "${movieTitle}"}) {
                    search {
                        __typename
                        ... on ${MovieType} {
                            title
                        }
                        ... on ${GenreType} {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "${movieTitle}"})
                CREATE (g:${GenreType} {name: "${genreName}"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            const movies = (gqlResult.data as any)[MovieType.plural][0];

            const movieSearch = movies.search.find((x: Record<string, string>) => x.__typename === MovieType.name);
            expect(movieSearch.title).toEqual(movieTitle);
            const genreSearch = movies.search.find((x: Record<string, string>) => x.__typename === GenreType.name);
            expect(genreSearch.name).toEqual(genreName);
        } finally {
            await session.close();
        }
    });

    test("should read and return correct union members with where argument", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.plural} (where: {title: "${movieTitle}"}) {
                    search(where: { ${GenreType}: { name: "${genreName1}" }}) {
                        __typename
                        ... on ${MovieType} {
                            title
                        }
                        ... on ${GenreType} {
                            name
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "${movieTitle}"})
                CREATE (g1:${GenreType} {name: "${genreName1}"})
                CREATE (g2:${GenreType} {name: "${genreName2}"})
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

            expect((gqlResult.data as any)[MovieType.plural][0]).toEqual({
                search: [{ __typename: GenreType.name, name: genreName1 }],
            });
        } finally {
            await session.close();
        }
    });

    test("should read and return unions with sort and limit", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
            ${MovieType.plural}(where: { title:"originalMovie" }) {
                search(
                    options: { offset: 1, limit: 3 }
                ) {
                    ... on ${MovieType} {
                        title
                    }
                    ... on ${GenreType} {
                        name
                    }
                }
            }
        }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "originalMovie"})
                CREATE (m1:${MovieType} {title: "movie1"})
                CREATE (m2:${MovieType} {title: "movie2"})
                CREATE (g1:${GenreType} {name: "genre1"})
                CREATE (g2:${GenreType} {name: "genre2"})
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

            expect((gqlResult.data as any)[MovieType.plural][0].search).toHaveLength(3);
        } finally {
            await session.close();
        }
    });

    test("should create a nested union", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.operations.create}(input: [{
                    title: "${movieTitle}",
                    search: {
                        ${GenreType}: {
                            create: [{
                                node: {
                                    name: "${genreName}"
                                }
                            }]
                        }
                    }
                }]) {
                    ${MovieType.plural} {
                        title
                        search {
                            __typename
                            ...on ${GenreType} {
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
            expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0]).toMatchObject({
                title: movieTitle,
                search: [{ __typename: GenreType.name, name: genreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should create multiple nested unions", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.operations.create}(input: [{
                    title: "${movieTitle}",
                    search: {
                        ${GenreType}: {
                            create: [{
                                node: {
                                    name: "${genreName}"
                                }
                            }]
                        }
                        ${MovieType}: {
                            create: [{
                                node: {
                                    title: "${nestedMovieTitle}"
                                }
                            }]
                        }
                    }
                }]) {
                    ${MovieType.plural} {
                        title
                        search {
                            __typename
                            ...on ${GenreType} {
                                name
                            }
                            ... on ${MovieType} {
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

            expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0].title).toEqual(movieTitle);
            expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0].search).toHaveLength(2);
            expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0].search).toContainEqual({
                __typename: GenreType.name,
                name: genreName,
            });
            expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0].search).toContainEqual({
                __typename: MovieType.name,
                title: nestedMovieTitle,
            });
        } finally {
            await session.close();
        }
    });

    test("should connect to a union", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.operations.create}(input: [{
                    title: "${movieTitle}",
                    search: {
                        ${GenreType}: {
                            connect: [{
                                where: { node: { name: "${genreName}" } }
                            }]
                        }
                    }
                }]) {
                    ${MovieType.plural} {
                        title
                        search {
                            __typename
                            ...on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:${GenreType} {name: "${genreName}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0]).toMatchObject({
                title: movieTitle,
                search: [{ __typename: GenreType.name, name: genreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update a union", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.operations.update}(
                    where: { title: "${movieTitle}" },
                    update: {
                        search: {
                            ${GenreType}: {
                                where: { node: { name: "${genreName}" } },
                                update: {
                                    node: { name: "${newGenreName}" }
                                }
                            }
                        }
                    }
                ) {
                    ${MovieType.plural} {
                        title
                        search {
                            __typename
                            ...on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:${MovieType} {title: "${movieTitle}"})-[:SEARCH]->(:${GenreType} {name: "${genreName}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0]).toMatchObject({
                title: movieTitle,
                search: [{ __typename: GenreType.name, name: newGenreName }],
            });
        } finally {
            await session.close();
        }
    });

    test("should update multiple unions", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search = ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.operations.update}(
                    where: { title: "${movieTitle}" },
                    update: {
                        search: {
                            ${GenreType}: {
                                where: { node: { name: "${genreName}" } },
                                update: {
                                    node: { name: "${newGenreName}" }
                                }
                            }
                            ${MovieType}: {
                                where: { node: { title: "${nestedMovieTitle}" } },
                                update: {
                                    node: { title: "${newNestedMovieTitle}" }
                                }
                            }
                        }
                    }
                ) {
                    ${MovieType.plural} {
                        title
                        search {
                            __typename
                            ...on ${GenreType} {
                                name
                            }
                            ...on ${MovieType} {
                                title
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "${movieTitle}"})-[:SEARCH]->(:${GenreType} {name: "${genreName}"})
                CREATE (m)-[:SEARCH]->(:${MovieType} {title: "${nestedMovieTitle}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0].title).toEqual(movieTitle);
            expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0].search).toHaveLength(2);
            expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0].search).toContainEqual({
                __typename: GenreType.name,
                name: newGenreName,
            });
            expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0].search).toContainEqual({
                __typename: MovieType.name,
                title: newNestedMovieTitle,
            });
        } finally {
            await session.close();
        }
    });

    test("should disconnect from a union", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            union Search =  ${MovieType} | ${GenreType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
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
                ${MovieType.operations.update}(
                    where: { title: "${movieTitle}" },
                    update: {
                        search: {
                            ${GenreType}: {
                                disconnect: [{
                                    where: { node: { name: "${genreName}" } }
                                }]
                            }
                        }
                    }
                ) {
                    ${MovieType.plural} {
                        title
                        search {
                            __typename
                            ...on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:${MovieType} {title: "${movieTitle}"})-[:SEARCH]->(:${GenreType} {name: "${genreName}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0]).toMatchObject({
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

        beforeEach(() => {
            typeDefs = gql`
                union Search = ${MovieType} | ${GenreType}


                type ${GenreType} @auth(rules: [{ operations: [READ], allow: { name: "$jwt.jwtAllowedNamesExample" } }]) {
                    name: String
                }

                type ${MovieType} {
                    title: String
                    search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });
        });

        test("Read Unions with allow auth fail", async () => {
            const session = await neo4j.getSession();
            await session.run(`
            CREATE (m:${MovieType} { title: "some title" })
            CREATE (:${GenreType} { name: "Romance" })<-[:SEARCH]-(m)
            CREATE (:${MovieType} { title: "The Matrix" })<-[:SEARCH]-(m)`);

            const query = `
                {
                    ${MovieType.plural}(where: { title: "some title" }) {
                        title
                        search(
                            where: { ${MovieType}: { title: "The Matrix" }, ${GenreType}: { name: "Romance" } }
                        ) {
                            ... on ${MovieType} {
                                title
                            }
                            ... on ${GenreType} {
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
            CREATE (m:${MovieType} { title: "another title" })
            CREATE (:${GenreType} { name: "Romance" })<-[:SEARCH]-(m)
            CREATE (:${MovieType} { title: "The Matrix" })<-[:SEARCH]-(m)`);

            const query = `
                {
                    ${MovieType.plural}(where: { title: "another title" }) {
                        title
                        search(
                            where: { ${MovieType}: { title: "The Matrix" }, ${GenreType}: { name: "Romance" } }
                        ) {
                            ... on ${MovieType} {
                                title
                            }
                            ... on ${GenreType} {
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
                expect(gqlResult.data?.[MovieType.plural] as any).toEqual([
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
