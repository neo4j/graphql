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

import { TestHelper } from "../../../utils/tests-helper";

describe("cypher directive targeting non node types", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Link = testHelper.createUniqueType("Link");

        const typeDefs = /* GraphQL */ `
            type  ${Movie} @node {
               title: String
               id: String!
               link: ${Link}! @cypher(statement: """
               MATCH(l:${Link})
               WHERE l.movieId=this.id
               RETURN l {.name, .url} as link
               """, columnName: "link")
            }

            type ${Link} {
                movieId: String!
                url: String!
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} { id: "matrix", title: "The Matrix"})
            CREATE (:${Link} {movieId: "matrix", url: "the-matrix.org", name: "Main Website"})
        `);

        const query = /* GraphQL */ `
                {
                    ${Movie.plural} {
                        title
                        link {
                            url
                            name
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    link: { name: "Main Website", url: "the-matrix.org" },
                },
            ],
        });
    });

    test("field with nested object", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Link = testHelper.createUniqueType("Link");

        const typeDefs = /* GraphQL */ `
            type  ${Movie} @node {
               title: String
               id: String!
               link: ${Link}! @cypher(statement: """
               MATCH(l:${Link})
               WHERE l.movieId=this.id
               RETURN l {.name, .url, somethingElse: {something: "Hello"}} as link
               """, columnName: "link")
            }

            type ${Link} {
                movieId: String!
                url: String!
                name: String!
                somethingElse: SomethingElse!
            }

            type SomethingElse {
               something: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} { id: "matrix", title: "The Matrix"})
            CREATE (:${Link} {movieId: "matrix", url: "the-matrix.org", name: "Main Website"})
        `);

        const query = /* GraphQL */ `
                {
                    ${Movie.plural} {
                        title
                        link {
                            url
                            name
                            somethingElse {
                                something
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    link: { name: "Main Website", url: "the-matrix.org", somethingElse: { something: "Hello" } },
                },
            ],
        });
    });

    test("array field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Link = testHelper.createUniqueType("Link");

        const typeDefs = /* GraphQL */ `
            type  ${Movie} @node {
               title: String
               id: String!
               links: [${Link}!]! @cypher(statement: """
               MATCH(l:${Link})
               WHERE l.movieId=this.id
               RETURN l {.name, .url} as links
               """, columnName: "links")
            }

            type ${Link} {
                movieId: String!
                url: String!
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} { id: "matrix", title: "The Matrix"})
            CREATE (:${Link} {movieId: "matrix", url: "the-matrix.org", name: "Main Website"})
            CREATE (:${Link} {movieId: "matrix", url: "not-imdb.com", name: "Public Database" })
        `);

        const query = /* GraphQL */ `
                {
                    ${Movie.plural} {
                        title
                        links {
                            url
                            name
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    links: expect.toIncludeSameMembers([
                        { name: "Main Website", url: "the-matrix.org" },
                        { name: "Public Database", url: "not-imdb.com" },
                    ]),
                },
            ],
        });
    });

    test("nested field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");
        const Link = testHelper.createUniqueType("Link");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]!  @relationship(type: "ACTED_IN", direction: OUT)
            }

            type  ${Movie} @node {
               title: String
               id: String!
               link: ${Link}! @cypher(statement: """
               MATCH(l:${Link})
               WHERE l.movieId=this.id
               RETURN l {.name, .url} as link
               """, columnName: "link")
            }

            type ${Link} {
                movieId: String!
                url: String!
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Actor} {name: "Keanu"})-[:ACTED_IN]->(:${Movie} { id: "matrix", title: "The Matrix"})
            CREATE (:${Link} {movieId: "matrix", url: "the-matrix.org", name: "Main Website"})
        `);

        const query = /* GraphQL */ `
                {
                    ${Actor.plural} {
                        name
                        movies {
                            title
                            link {
                                url
                                name
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Actor.plural]: [
                {
                    name: "Keanu",
                    movies: [
                        {
                            title: "The Matrix",
                            link: { name: "Main Website", url: "the-matrix.org" },
                        },
                    ],
                },
            ],
        });
    });

    // Interfaces without `@node` are not supported yet because there is no way to access "__resolveTree", as the information of the concrete type returned by the cypher field is not available
    test("interface field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Link = testHelper.createUniqueType("Link");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
               title: String
               id: String!
               link: Link! @cypher(statement: """
               MATCH(l:${Link})
               WHERE l.movieId=this.id
               RETURN l {.name, .url } as link
               """, columnName: "link")
            }

            interface Link {
                movieId: String!
                url: String!
                name: String!
            }

            type ${Link} implements Link {
                movieId: String!
                url: String!
                name: String!
            }
        `;

        const schema = await testHelper.initNeo4jGraphQL({ typeDefs });

        await expect(() => {
            return schema.getSchema();
        }).rejects.toThrow(
            `@cypher field link must target interface (Link) implemented by types annotated with the @node directive`
        );
    });

    test("query", async () => {
        const Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type Movie {
                id: String
            }

            type Query {
                movie: Movie
                    @cypher(
                        statement: """
                        MATCH (m:${Movie})
                        RETURN m { .id } as m
                        """
                        columnName: "m"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} { id: "matrix", title: "The Matrix"})
        `);

        const query = /* GraphQL */ `
            {
                movie {
                    id
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            movie: {
                id: "matrix",
            },
        });
    });
});
