/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
