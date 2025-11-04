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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("unions", () => {
    const testHelper = new TestHelper();

    let GenreType: UniqueType;
    let MovieType: UniqueType;

    beforeEach(() => {
        GenreType = testHelper.createUniqueType("Genre");
        MovieType = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("read Unions with missing types", async () => {
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

        await testHelper.initNeo4jGraphQL({
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
                ${MovieType.plural} {
                    search {
                        ... on ${GenreType} {
                            name
                        }
                        
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (m:${MovieType} {title: "${movieTitle}"})
                CREATE (g:${GenreType} {name: "${genreName}"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        const movies = (gqlResult.data as any)[MovieType.plural][0];

        expect(movies.search).toIncludeSameMembers([{ name: genreName }, {}]);
    });
    test("should read and return unions", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
                CREATE (m:${MovieType} {title: "${movieTitle}"})
                CREATE (g:${GenreType} {name: "${genreName}"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        const movies = (gqlResult.data as any)[MovieType.plural][0];

        const movieSearch = movies.search.find((x: Record<string, string>) => x.__typename === MovieType.name);
        expect(movieSearch.title).toEqual(movieTitle);
        const genreSearch = movies.search.find((x: Record<string, string>) => x.__typename === GenreType.name);
        expect(genreSearch.name).toEqual(genreName);
    });

    test("should read and return correct union members with where argument", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
                CREATE (m:${MovieType} {title: "${movieTitle}"})
                CREATE (g1:${GenreType} {name: "${genreName1}"})
                CREATE (g2:${GenreType} {name: "${genreName2}"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g1)
                MERGE (m)-[:SEARCH]->(g2)
            `);
        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[MovieType.plural][0]).toEqual({
            search: [{ __typename: GenreType.name, name: genreName1 }],
        });
    });

    test("should read and return unions with sort and limit", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
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
        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[MovieType.plural][0].search).toHaveLength(3);
    });

    test("should create a nested union", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0]).toMatchObject({
            title: movieTitle,
            search: [{ __typename: GenreType.name, name: genreName }],
        });
    });

    test("should create multiple nested unions", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        const gqlResult = await testHelper.executeGraphQL(mutation);

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
    });

    test("should connect to a union", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
                CREATE (:${GenreType} {name: "${genreName}"})
            `);

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[MovieType.operations.create][MovieType.plural][0]).toMatchObject({
            title: movieTitle,
            search: [{ __typename: GenreType.name, name: genreName }],
        });
    });

    test("should update a union", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
                CREATE (:${MovieType} {title: "${movieTitle}"})-[:SEARCH]->(:${GenreType} {name: "${genreName}"})
            `);

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0]).toMatchObject({
            title: movieTitle,
            search: [{ __typename: GenreType.name, name: newGenreName }],
        });
    });

    test("should update multiple unions", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
                CREATE (m:${MovieType} {title: "${movieTitle}"})-[:SEARCH]->(:${GenreType} {name: "${genreName}"})
                CREATE (m)-[:SEARCH]->(:${MovieType} {title: "${nestedMovieTitle}"})
            `);

        const gqlResult = await testHelper.executeGraphQL(mutation);

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
    });

    test("should disconnect from a union", async () => {
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

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(`
                CREATE (:${MovieType} {title: "${movieTitle}"})-[:SEARCH]->(:${GenreType} {name: "${genreName}"})
            `);

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[MovieType.operations.update][MovieType.plural][0]).toMatchObject({
            title: movieTitle,
            search: [],
        });
    });

    describe("Unions with auth", () => {
        const secret = "secret";
        let typeDefs: DocumentNode;

        beforeEach(async () => {
            typeDefs = gql`
                union Search = ${MovieType} | ${GenreType}


                type ${GenreType} @authorization(validate: [{ operations: [READ], when: BEFORE, where: { node: { name: "$jwt.jwtAllowedNamesExample" } } }]) {
                    name: String
                }

                type ${MovieType} {
                    title: String
                    search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });
        });

        test("Read Unions with allow auth fail", async () => {
            await testHelper.executeCypher(`
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

            const token = createBearerToken(secret, { jwtAllowedNamesExample: "Horror" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("Read Unions with allow auth", async () => {
            await testHelper.executeCypher(`
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

            const token = createBearerToken(secret, { jwtAllowedNamesExample: "Romance" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[MovieType.plural]).toEqual([
                {
                    title: "another title",
                    search: expect.toIncludeSameMembers([{ title: "The Matrix" }, { name: "Romance" }]),
                },
            ]);
        });
    });
});
