/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5467", () => {
    const testHelper = new TestHelper();

    let Test: UniqueType;

    beforeAll(async () => {
        Test = testHelper.createUniqueType("Test");

        const typeDefs = /* GraphQL */ `
            type ${Test} @node {
                name: String!
                groups: [String!]
            }

            type Mutation {
                mergeTest(name: String!, groups: [String!]): ${Test}
                    @cypher(
                        statement: """
                        MERGE (t:Test {name: $name}) SET t.groups = $groups
                        return t
                        """
                        columnName: "t"
                    )
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("custom Cypher should correctly interpret array parameters with a single item", async () => {
        const query = /* GraphQL */ `
            mutation ($name: String!, $groups: [String!]) {
                mergeTest(name: $name, groups: $groups) {
                    name
                    groups
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            variableValues: {
                name: "test",
                groups: ["test"],
            },
        });

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            mergeTest: {
                name: "test",
                groups: ["test"],
            },
        });
    });
});
