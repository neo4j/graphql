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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering - Aggregation", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("String aggregation - shortest, filter on String", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                custom_field: String
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

        await testHelper.executeCypher(
            `
            CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: "hello" })
            CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: "hello world" })
            CREATE (:${Movie} { title: "The", released: 2003, custom_field: "goodbye world" })
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.aggregate}(where: { custom_field_STARTS_WITH: "he" }) {
                    title {
                        shortest
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.aggregate]: {
                title: {
                    shortest: "The Matrix",
                },
            },
        });
    });

    test("String aggregation - longest, filter on Int", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                custom_field: Int
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

        await testHelper.executeCypher(
            `
            CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: 1 })
            CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: 0 })
            CREATE (:${Movie} { title: "The", released: 2003, custom_field: 2 })
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.aggregate}(where: { custom_field_GT: 0 }) {
                    title {
                        longest
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.aggregate]: {
                title: {
                    longest: "The Matrix",
                },
            },
        });
    });

    test("Int aggregation - max, filter on String", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                custom_field: String
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

        await testHelper.executeCypher(
            `
            CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: "Test" })
            CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: "Rest" })
            CREATE (:${Movie} { title: "The", released: 2023, custom_field: "Nope" })
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.aggregate}(where: { custom_field_CONTAINS: "es" }) {
                    released {
                        max
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.aggregate]: {
                released: {
                    max: 2003,
                },
            },
        });
    });

    test("Int aggregation - min, filter on Int", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                custom_field: Int
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

        await testHelper.executeCypher(
            `
            CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: 1 })
            CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: 2 })
            CREATE (:${Movie} { title: "The", released: 1995, custom_field: 0 })
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.aggregate}(where: { custom_field_GT: 0 }) {
                    released {
                        min
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.aggregate]: {
                released: {
                    min: 1999,
                },
            },
        });
    });

    test("String aggregation - min, filter on [Int!]", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                custom_field: [Int!]
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

        await testHelper.executeCypher(
            `
            CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: [1,2,3,4,5] })
            CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: [1,4,8] })
            CREATE (:${Movie} { title: "The", released: 2003, custom_field: [2,3,4] })
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.aggregate}(where: { custom_field_INCLUDES: 1 }) {
                    title {
                        shortest
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.aggregate]: {
                title: {
                    shortest: "The Matrix",
                },
            },
        });
    });

    test("String aggregation - min, filter on [String!]", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                custom_field: [String!]
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

        await testHelper.executeCypher(
            `
            CREATE (:${Movie} { title: "The Matrix", released: 1999, custom_field: ['a','b','c'] })
            CREATE (:${Movie} { title: "The Matrix Reloaded", released: 2003, custom_field: ['a','b','c'] })
            CREATE (:${Movie} { title: "The", released: 2003, custom_field: ['a','b','d'] })
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.aggregate}(where: { custom_field_INCLUDES: "c" }) {
                    title {
                        shortest
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.aggregate]: {
                title: {
                    shortest: "The Matrix",
                },
            },
        });
    });
});
