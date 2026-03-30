/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering - Scalar - deprecated", () => {
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
            filter: `special_count_EQ: 1`,
        },
        {
            title: "Int cypher field: GT",
            filter: `special_count_GT: 0`,
        },
        {
            title: "Int cypher field: GTE",
            filter: `special_count_GTE: 1`,
        },
        {
            title: "Int cypher field: LT",
            filter: `special_count_LT: 2`,
        },
        {
            title: "Int cypher field: LTE",
            filter: `special_count_LTE: 2`,
        },
        {
            title: "Int cypher field: IN",
            filter: `special_count_IN: [1, 2, 3]`,
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
            filter: `special_word_EQ: "test"`,
        },
        {
            title: "String cypher field: CONTAINS",
            filter: `special_word_CONTAINS: "es"`,
        },
        {
            title: "String cypher field: ENDS_WITH",
            filter: `special_word_ENDS_WITH: "est"`,
        },
        {
            title: "String cypher field: STARTS_WITH",
            filter: `special_word_STARTS_WITH: "tes"`,
        },
        {
            title: "String cypher field: IN",
            filter: `special_word_IN: ["test", "test2"]`,
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
                ${CustomType.plural}(where: { special_count_GTE: 1, title_EQ: "CustomType One" }) {
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
                ${CustomType.plural}(where: { special_count_GTE: 1, title_EQ: "CustomType Unknown" }) {
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
                ${CustomType.plural}(where: { special_count_GTE: 1 }) {
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
});
