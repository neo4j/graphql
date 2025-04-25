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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Filtering case insensitive string", () => {
    const testHelper = new TestHelper();
    let Person: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Person = testHelper.createUniqueType("Person");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = `
        type ${Person} @node {
            name: String!
            movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }

        type ${Movie} @node {
            title: String!
            actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
        }


        type ActedIn @relationshipProperties {
            character: String!
        }
    `;

        await testHelper.executeCypher(`
                CREATE (m1:${Movie} {title: "The Matrix"})
                CREATE (m2:${Movie} {title: "THE MATRIX"})
                CREATE (m3:${Movie} {title: "The Italian Job"})
                CREATE (m4:${Movie} {title: "The Lion King"})

                CREATE(p1:${Person} {name: "Keanu"})
                CREATE(p2:${Person} {name: "Arthur Dent"})

                CREATE(p1)-[:ACTED_IN {character: "neo"}]->(m1)
                CREATE(p1)-[:ACTED_IN {character: "neo"}]->(m2)

                CREATE(p2)-[:ACTED_IN {character: "ghost mufasa"}]->(m4)
            `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        CASE_INSENSITIVE: true,
                        GTE: true,
                        MATCHES: true,
                    },
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("case insensitive gte", async () => {
        const query = /* GraphQL */ `
        query {
            ${Movie.plural}(where: { title: { caseInsensitive: { gte: "The Matrix" } } }) {
                title
            }
        }
    `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "THE MATRIX",
                },
            ]),
        });
    });

    test("case insensitive in", async () => {
        const query = /* GraphQL */ `
        query {
            ${Movie.plural}(where: { title: { caseInsensitive: { in: ["the matrix", "THE LION KING"] } } }) {
                title
            }
        }
    `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "THE MATRIX",
                },
                {
                    title: "The Lion King",
                },
            ]),
        });
    });

    test("case insensitive contains", async () => {
        const query = /* GraphQL */ `
        query {
            ${Movie.plural}(where: { title: { caseInsensitive: { contains: "Matrix" } } }) {
                title
            }
        }
    `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "THE MATRIX",
                },
            ]),
        });
    });

    test("case insensitive endsWith", async () => {
        const query = /* GraphQL */ `
        query {
            ${Movie.plural}(where: { title: { caseInsensitive: { endsWith: "RIX" } } }) {
                title
            }
        }
    `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "THE MATRIX",
                },
            ]),
        });
    });

    describe("eq", () => {
        test("case insensitive eq", async () => {
            const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { title: { caseInsensitive: { eq: "the matrix" } } }) {
                    title
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeUndefined();

            expect(result.data).toEqual({
                [Movie.plural]: expect.toIncludeSameMembers([
                    {
                        title: "The Matrix",
                    },
                    {
                        title: "THE MATRIX",
                    },
                ]),
            });
        });

        test("case insensitive eq on related type filter", async () => {
            const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { movies: { none: { title: { caseInsensitive: { eq: "the matrix" } } } } }) {
                    name
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeUndefined();

            expect(result.data).toEqual({
                [Person.plural]: [
                    {
                        name: "Arthur Dent",
                    },
                ],
            });
        });

        test("case insensitive eq in connection", async () => {
            const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(where: { title: { caseInsensitive: { eq: "the matrix" } } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeUndefined();

            expect(result.data).toEqual({
                [Movie.operations.connection]: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: "The Matrix",
                            },
                        },
                        {
                            node: {
                                title: "THE MATRIX",
                            },
                        },
                    ]),
                },
            });
        });

        test("case insensitive eq on related node filter in connection", async () => {
            const query = /* GraphQL */ `
            query {
                ${Person.operations.connection}(where: { moviesConnection: { none: { node: { title: { caseInsensitive: { eq: "the matrix" } } } } } }) {
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeUndefined();

            expect(result.data).toEqual({
                [Person.operations.connection]: {
                    edges: [
                        {
                            node: {
                                name: "Arthur Dent",
                            },
                        },
                    ],
                },
            });
        });

        test("case insensitive eq on related edge filter in connection", async () => {
            const query = /* GraphQL */ `
            query {
                ${Person.operations.connection}(where: { moviesConnection: { none: { edge: { character: { caseInsensitive: { eq: "NEO" } } } } } }) {
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeUndefined();

            expect(result.data).toEqual({
                [Person.operations.connection]: {
                    edges: [
                        {
                            node: {
                                name: "Arthur Dent",
                            },
                        },
                    ],
                },
            });
        });
    });
});
