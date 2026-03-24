/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1761", () => {
    const testHelper = new TestHelper();

    let myType: UniqueType;

    beforeEach(async () => {
        myType = testHelper.createUniqueType("MyType");

        const typeDefs = `
            enum MyEnum {
                FOO
                BAR
            }

            type ${myType} @node {
                enumList: [MyEnum!]! @default(value: [])
                enumList2: [MyEnum!]! @default(value: [FOO, BAR])
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to create node with @default list enum", async () => {
        const mutation = `
            mutation {
                ${myType.operations.create}(input: [{}]) {
                    ${myType.plural} {
                        enumList
                        enumList2
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [myType.operations.create]: {
                [myType.plural]: [{ enumList: [], enumList2: ["FOO", "BAR"] }],
            },
        });
    });
});
