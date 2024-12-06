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

import { GraphQLError } from "graphql";
import { TestHelper } from "../../utils/tests-helper";

describe("@default directive", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    describe("with primitive fields", () => {
        test("Create sets default String value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    string: String @default(value: "some default value")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            string
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            string: "some default value",
                        },
                    ],
                },
            });
        });

        test("Create sets default Int value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    int: Int @default(value: 0)
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            int
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            int: 0,
                        },
                    ],
                },
            });
        });

        test("Create sets default Float value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    float: Float @default(value: 0.1)
                    floatint: Float @default(value: 0)
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            float
                            floatint
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            float: 0.1,
                            floatint: 0.0,
                        },
                    ],
                },
            });
        });

        test("Create sets default Boolean value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    boolean: Boolean @default(value: false)
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            boolean
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            boolean: false,
                        },
                    ],
                },
            });
        });

        test("Create sets default BigInt value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    bigintnumber: BigInt @default(value: 0)
                    bigintstring: BigInt @default(value: "0")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            bigintnumber
                            bigintstring
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            bigintnumber: "0",
                            bigintstring: "0",
                        },
                    ],
                },
            });
        });

        test("with an argument with a type which doesn't match the field should throw an error", async () => {
            const userType = testHelper.createUniqueType("User");
            const typeDefs = `
                type ${userType} @node {
                    name: String! @default(value: 2)
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError("@default.value on String fields must be of type String"),
            ]);
        });
    });

    describe("with enum fields", () => {
        test("on enum field with incorrect value should throw an error", async () => {
            const userType = testHelper.createUniqueType("User");
            const typeDefs = `
                type ${userType} @node {
                    name: String!
                    location: Location! @default(value: DIFFERENT)
                }

                enum Location {
                    HERE
                    THERE
                    EVERYWHERE
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError("@default.value on Location fields must be of type Location"),
            ]);
        });

        test("on enum field with incorrect type should throw an error", async () => {
            const userType = testHelper.createUniqueType("User");
            const typeDefs = `
                type ${userType} @node {
                    name: String!
                    location: Location! @default(value: 2)
                }

                enum Location {
                    HERE
                    THERE
                    EVERYWHERE
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError("@default.value on Location fields must be of type Location"),
            ]);
        });

        test("on enum field should not throw an error", async () => {
            const userType = testHelper.createUniqueType("User");
            const typeDefs = `
                type ${userType} @node {
                    name: String!
                    location: Location! @default(value: HERE)
                }

                enum Location {
                    HERE
                    THERE
                    EVERYWHERE
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).resolves.not.toThrow();
        });
    });

    describe("with spatial fields", () => {
        test("on spatial field should throw an error", async () => {
            const userType = testHelper.createUniqueType("User");
            const typeDefs = `
                type ${userType} @node {
                    name: String!
                    location: Point! @default(value: "default")
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError(
                    "@default directive can only be used on fields of type Int, Float, String, Boolean, ID, BigInt, DateTime, Date, Time, LocalDateTime or LocalTime."
                ),
            ]);
        });
    });

    describe("with temporal types", () => {
        test("Create sets default DateTime value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    datetime: DateTime @default(value: "1970-01-01T00:00:00.000Z")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            datetime
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            datetime: "1970-01-01T00:00:00.000Z",
                        },
                    ],
                },
            });
        });

        test("Create sets default LocalDateTime value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    localdatetime: LocalDateTime @default(value: "1970-01-01T00:00:00.000")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            localdatetime
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            localdatetime: "1970-01-01T00:00:00",
                        },
                    ],
                },
            });
        });

        test("Create sets default Time value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    time: Time @default(value: "00:00:00.000Z")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            time
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            time: "00:00:00Z",
                        },
                    ],
                },
            });
        });

        test("Create sets default LocalTime value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    localtime: LocalTime @default(value: "00:00:00.000")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            localtime
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            localtime: "00:00:00",
                        },
                    ],
                },
            });
        });

        test("Create sets default Date value correctly", async () => {
            const Type = testHelper.createUniqueType("Type");

            const typeDefs = /* GraphQL */ `
                type ${Type} @node {
                    name: String!
                    date: Date @default(value: "1970-01-01")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Type.operations.create}(input: [{ name: "Thing" }]) {
                        ${Type.plural} {
                            name
                            date
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [Type.operations.create]: {
                    [Type.plural]: [
                        {
                            name: "Thing",
                            date: "1970-01-01",
                        },
                    ],
                },
            });
        });
    });
});
