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

import { GraphQLScalarType, Kind } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6422", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let MutationTest: UniqueType;
    const GraphQLUpperCaseString = new GraphQLScalarType({
        name: "UpperCaseString",
        description: "The `UpperCaseString` scalar type returns all strings in upper case",
        serialize: (value) => {
            if (typeof value === "string") {
                return value.toUpperCase();
            }

            throw new Error("Unknown type");
        },
        parseValue: (value) => {
            if (typeof value === "string") {
                return value.toUpperCase();
            }

            throw new Error("Unknown type");
        },
        parseLiteral: (ast) => {
            if (ast.kind === Kind.STRING) {
                return ast.value.toUpperCase();
            }

            return undefined;
        },
    });

    beforeEach(async () => {
        MutationTest = testHelper.createUniqueType("MutationTest");

        typeDefs = /* GraphQL */ `
            scalar CustomScalar
            type ${MutationTest} @mutation(operations: [CREATE, UPDATE, DELETE]) @node @subscription(events: []) {
                enumValue: [EnumMutationTestEnumValue!]!
                myScalar: [CustomScalar!]!
                intValue: [Int!]!
                stringValue: [String!]!
            }

            """
            enum test
            """
            enum EnumMutationTestEnumValue {
                ONE
                TWO
                THREE
            }
        `;

        await testHelper.executeCypher(`
            CREATE(:${MutationTest} { enumValue: ["ONE", "TWO"], myScalar: ["TEST", "TEST2"], intValue: [1, 2], stringValue: ["test", "test2"] })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: { CustomScalar: GraphQLUpperCaseString },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("It should be possible to push an enum to an enum list", async () => {
        const query = /* GraphQL */ `
            mutation {
            ${MutationTest.operations.update}(
                update: {
                enumValue: {
                    push: [THREE]
                }
                }
            ) {
                ${MutationTest.plural} {
                    enumValue   
                }
            }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [MutationTest.operations.update]: {
                [MutationTest.plural]: [
                    {
                        enumValue: expect.toIncludeSameMembers(["ONE", "TWO", "THREE"]),
                    },
                ],
            },
        });
    });

    test("It should be possible to push a custom scalar to an custom scalar list", async () => {
        const query = /* GraphQL */ `
            mutation {
            ${MutationTest.operations.update}(
                update: {
                    myScalar: {
                        push: ["test3"]
                    }
                }
            ) {
                ${MutationTest.plural} {
                    myScalar   
                }
            }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [MutationTest.operations.update]: {
                [MutationTest.plural]: [
                    {
                        myScalar: expect.toIncludeSameMembers(["TEST", "TEST2", "TEST3"]),
                    },
                ],
            },
        });
    });
});
