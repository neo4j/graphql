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

import gql from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/487", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("related fields should resolve on custom queries (union)", async () => {
        const typeAuthor = testHelper.createUniqueType("Author");
        const typeDirector = testHelper.createUniqueType("Director");
        const typeBook = testHelper.createUniqueType("Book");
        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = gql`
            type ${typeAuthor.name} {
                id: ID!
            }

            type ${typeDirector.name} {
                id: ID!
            }

            type ${typeBook.name} {
                id: ID!
                author: ${typeAuthor.name}! @relationship(type: "WROTE", direction: IN)
            }

            type ${typeMovie.name} {
                id: ID!
                director: ${typeDirector.name}! @relationship(type: "DIRECTED", direction: IN)
            }

            union Thing = ${typeBook.name} | ${typeMovie.name}

            type Query {
                getThings: [Thing!]
                    @cypher(
                        statement: """
                        MATCH (node)
                        WHERE
                            "${typeBook.name}" IN labels(node) OR
                            "${typeMovie.name}" IN labels(node)
                        RETURN node
                        """,
                        columnName: "node"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const bookId = generate({
            charset: "alphabetic",
        });

        const authorId = generate({
            charset: "alphabetic",
        });

        const directorId = generate({
            charset: "alphabetic",
        });

        const query = `
            query {
                getThings {
                    __typename
                    ... on ${typeBook.name} {
                        id
                        author {
                            id
                        }
                        __typename
                    }
                    ... on ${typeMovie.name} {
                        id
                        director {
                            id
                        }
                        __typename
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (:${typeMovie.name} { id: "${movieId}" })<-[:DIRECTED]-(:${typeDirector.name} {id: "${directorId}"})
                CREATE (:${typeBook.name} { id: "${bookId}" })<-[:WROTE]-(:${typeAuthor.name} {id: "${authorId}"})
            `);

        const result = await testHelper.executeGraphQL(query);

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

        expect(result.errors).toBeFalsy();

        const movie = ((result?.data as any).getThings as any[]).find((x) => x.__typename === typeMovie.name);
        const book = ((result?.data as any).getThings as any[]).find((x) => x.__typename === typeBook.name);

        expect(movie).toEqual({
            id: movieId,
            director: {
                id: directorId,
            },
            __typename: typeMovie.name,
        });

        expect(book).toEqual({
            id: bookId,
            author: {
                id: authorId,
            },
            __typename: typeBook.name,
        });
    });

    test("related fields should resolve on custom queries (interface)", async () => {
        const typeAuthor = testHelper.createUniqueType("Author");
        const typeDirector = testHelper.createUniqueType("Director");
        const typeBook = testHelper.createUniqueType("Book");
        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = gql`
            type ${typeAuthor.name} {
                id: ID!
            }

            type ${typeDirector.name} {
                id: ID!
            }

            type ${typeBook.name} implements Thing {
                id: ID!
                author: ${typeAuthor.name}! @relationship(type: "WROTE", direction: IN)
            }

            type ${typeMovie.name} implements Thing {
                id: ID!
                director: ${typeDirector.name}! @relationship(type: "DIRECTED", direction: IN)
            }

            interface Thing {
                id: ID!
            }

            type Query {
                getThings: [Thing!]
                    @cypher(
                        statement: """
                        MATCH (node)
                        WHERE
                            "${typeBook.name}" IN labels(node) OR
                            "${typeMovie.name}" IN labels(node)
                        RETURN node
                        """,
                        columnName: "node"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const bookId = generate({
            charset: "alphabetic",
        });

        const authorId = generate({
            charset: "alphabetic",
        });

        const directorId = generate({
            charset: "alphabetic",
        });

        const query = `
            query {
                getThings {
                    __typename
                    ... on ${typeBook.name} {
                        id
                        author {
                            id
                        }
                        __typename
                    }
                    ... on ${typeMovie.name} {
                        id
                        director {
                            id
                        }
                        __typename
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (:${typeMovie.name} { id: "${movieId}" })<-[:DIRECTED]-(:${typeDirector.name} {id: "${directorId}"})
                CREATE (:${typeBook.name} { id: "${bookId}" })<-[:WROTE]-(:${typeAuthor.name} {id: "${authorId}"})
            `);

        const result = await testHelper.executeGraphQL(query);

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

        expect(result.errors).toBeFalsy();

        const movie = ((result?.data as any).getThings as any[]).find((x) => x.__typename === typeMovie.name);
        const book = ((result?.data as any).getThings as any[]).find((x) => x.__typename === typeBook.name);

        expect(movie).toEqual({
            id: movieId,
            director: {
                id: directorId,
            },
            __typename: typeMovie.name,
        });

        expect(book).toEqual({
            id: bookId,
            author: {
                id: authorId,
            },
            __typename: typeBook.name,
        });
    });
});
