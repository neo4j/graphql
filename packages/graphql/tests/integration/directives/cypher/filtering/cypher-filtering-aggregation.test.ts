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

import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering - Aggregation", () => {
    const testHelper = new TestHelper();
    const Movie = testHelper.createUniqueType("Movie");

    afterEach(async () => {
        await testHelper.close();
    });

    test.each([
        {
            title: "String aggregation - shortest, filter on String",
            customCypherType: "String",
            createCypher: `
                CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: "hello" })
                CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: "hello world" })
            `,
            query: /* GraphQL */ `
                query {
                    ${Movie.operations.aggregate}(where: { custom_field_STARTS_WITH: "he" }) {
                        title {
                            shortest
                        }
                    }
                }
            `,
            expectedOutput: {
                [Movie.operations.aggregate]: {
                    title: {
                        shortest: "The Matrix",
                    },
                },
            },
        },
        {
            title: "String aggregation - longest, filter on Int",
            customCypherType: "Int",
            createCypher: `
                CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: 1 })
                CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: 0 })
            `,
            query: `
                query {
                    ${Movie.operations.aggregate}(where: { custom_field_GT: 0 }) {
                        title {
                            longest
                        }
                    }
                }
            `,
            expectedOutput: {
                [Movie.operations.aggregate]: {
                    title: {
                        longest: "The Matrix",
                    },
                },
            },
        },
        {
            title: "Int aggregation - min, filter on String",
            customCypherType: "String",
            createCypher: `
                CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: "Test" })
                CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: "Rest" })
            `,
            query: /* GraphQL */ `
                query {
                    ${Movie.operations.aggregate}(where: { custom_field_CONTAINS: "es" }) {
                        released {
                            max
                        }
                    }
                }
            `,
            expectedOutput: {
                [Movie.operations.aggregate]: {
                    released: {
                        max: 2003,
                    },
                },
            },
        },
        {
            title: "Int aggregation - min, filter on Int",
            customCypherType: "Int",
            createCypher: `
                CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: 1 })
                CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: 2 })
            `,
            query: /* GraphQL */ `
                query {
                    ${Movie.operations.aggregate}(where: { custom_field_GT: 0 }) {
                        released {
                            min
                        }
                    }
                }
            `,
            expectedOutput: {
                [Movie.operations.aggregate]: {
                    released: {
                        min: 1999,
                    },
                },
            },
        },
        {
            title: "String aggregation - min, filter on [Int]",
            customCypherType: "[Int]",
            createCypher: `
                CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: [1,2,3,4,5] })
                CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: [1, 4, 8] })
            `,
            query: /* GraphQL */ `
                query {
                    ${Movie.operations.aggregate}(where: { custom_field_INCLUDES: 1 }) {
                        title {
                            shortest
                        }
                    }
                }
            `,
            expectedOutput: {
                [Movie.operations.aggregate]: {
                    title: {
                        shortest: "The Matrix",
                    },
                },
            },
        },
        {
            title: "String aggregation - min, filter on [String]",
            customCypherType: "[String]",
            createCypher: `
                CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: ['a','b','c'] })
                CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: ['a','b','c'] })
            `,
            query: /* GraphQL */ `
                query {
                    ${Movie.operations.aggregate}(where: { custom_field_INCLUDES: "c" }) {
                        title {
                            shortest
                        }
                    }
                }
            `,
            expectedOutput: {
                [Movie.operations.aggregate]: {
                    title: {
                        shortest: "The Matrix",
                    },
                },
            },
        },
    ])("$title", async ({ customCypherType, createCypher, query, expectedOutput }) => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                custom_field: ${customCypherType}
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as s
                        """
                        columnName: "s"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(createCypher, {});

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual(expectedOutput);
    });
});
