/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2889", () => {
    const testHelper = new TestHelper();

    let MyEnumHolder: UniqueType;

    beforeEach(async () => {
        MyEnumHolder = testHelper.createUniqueType("MyEnumHolder");

        const typeDefs = `
            enum MyEnum {
                FIRST
                SECOND
            }

            type ${MyEnumHolder} @node {
                myEnums: [MyEnum!]!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to create node with list of enums", async () => {
        const query = `
            mutation {
                ${MyEnumHolder.operations.create}(input: [{ myEnums: [FIRST, SECOND] }]) {
                    ${MyEnumHolder.plural} {
                        myEnums
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect((result.data?.[MyEnumHolder.operations.create] as any)[MyEnumHolder.plural]).toEqual([
            { myEnums: ["FIRST", "SECOND"] },
        ]);
    });
});
