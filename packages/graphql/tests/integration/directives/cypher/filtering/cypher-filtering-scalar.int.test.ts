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

describe("cypher directive filtering - Scalar", () => {
    let CustomType: UniqueType;

    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    beforeEach(() => {
        CustomType = testHelper.createUniqueType("CustomType");
    });

    test.each([
        {
            title: "Int cypher field: exact match",
            filter: `special_count: { eq: 1 }`,
        },
        {
            title: "Int cypher field: GT",
            filter: `special_count: { gt: 0 }`,
        },
        {
            title: "Int cypher field: GTE",
            filter: `special_count: { gte: 1 }`,
        },
        {
            title: "Int cypher field: LT",
            filter: `special_count: { lt: 2 }`,
        },
        {
            title: "Int cypher field: LTE",
            filter: `special_count: { lte: 2 }`,
        },
        {
            title: "Int cypher field: IN",
            filter: `special_count: { in: [1, 2, 3]}`,
        },
    ] as const)("$title", async ({ filter }) => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { ${filter} }) {
                    special_count
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_count: 1,
                },
            ],
        });
    });

    test.each([
        {
            title: "String cypher field: exact match",
            filter: `special_word: { eq: "test"}`,
        },
        {
            title: "String cypher field: CONTAINS",
            filter: `special_word: { contains: "es"}`,
        },
        {
            title: "String cypher field: ENDS_WITH",
            filter: `special_word: { endsWith: "est"}`,
        },
        {
            title: "String cypher field: STARTS_WITH",
            filter: `special_word: { startsWith: "tes"}`,
        },
        {
            title: "String cypher field: IN",
            filter: `special_word: { in: ["test", "test2"]}`,
        },
    ] as const)("$title", async ({ filter }) => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                special_word: String
                    @cypher(
                        statement: """
                        RETURN "test" as s
                        """
                        columnName: "s"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { ${filter} }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    title: "test",
                },
            ],
        });
    });

    test("Int cypher field AND String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            UNWIND [
                {title: 'CustomType One' },
                {title: 'CustomType Two' },
                {title: 'CustomType Three' }
            ] AS CustomTypeData
            CREATE (m:${CustomType})
            SET m = CustomTypeData;
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { special_count: { gte: 1 }, title: { eq: "CustomType One"} }) {
                    special_count
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_count: 3,
                },
            ],
        });
    });

    test("unmatched Int cypher field AND String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            UNWIND [
                {title: 'CustomType One' },
                {title: 'CustomType Two' },
                {title: 'CustomType Three' }
            ] AS CustomTypeData
            CREATE (m:${CustomType})
            SET m = CustomTypeData;
        `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { special_count: { gt: 1 }, title: { eq: "CustomType Unknown"} }) {
                    special_count
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [],
        });
    });

    test("Int cypher field, selecting String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { special_count: { gte: 1 }}) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    title: "test",
                },
            ],
        });
    });

    test.each([
        {
            title: "String cypher field: caseInsensitive eq",
            filter: `special_word: { caseInsensitive: { eq: "toyota" } }`,
        },
        {
            title: "String cypher field: caseInsensitive contains",
            filter: `special_word: { caseInsensitive: { contains: "YO" } }`,
        },
        {
            title: "String cypher field: caseInsensitive startsWith",
            filter: `special_word: { caseInsensitive: { startsWith: "to" } }`,
        },
        {
            title: "String cypher field: caseInsensitive endsWith",
            filter: `special_word: { caseInsensitive: { endsWith: "tA" } }`,
        },
        {
            title: "String cypher field: caseInsensitive in",
            filter: `special_word: { caseInsensitive: { in: ["toyota"] } }`,
        },
    ] as const)("$title", async ({ filter }) => {
        const typeDefs = /* GraphQL */ `
            type ${CustomType} @node {
                title: String
                special_word: String
                    @cypher(
                        statement: """
                        RETURN "Toyota" as s
                        """
                        columnName: "s"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        CASE_INSENSITIVE: true,
                    },
                },
            },
        });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "Toyota" })`, {});

        const query = /* GraphQL */ `
            query {
                ${CustomType.plural}(where: { ${filter} }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    title: "Toyota",
                },
            ],
        });
    });
});
