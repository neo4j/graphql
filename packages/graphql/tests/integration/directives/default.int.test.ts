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
        test("on non-primitive field should throw an error", async () => {
            const typeDefs = `
                type User {
                    name: String!
                    location: Point! @default(value: "default")
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError("@default is not supported by Spatial types."),
            ]);
        });

        test("with an argument with a type which doesn't match the field should throw an error", async () => {
            const typeDefs = `
                type User {
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

        test("on a DateTime with an invalid value should throw an error", async () => {
            const typeDefs = `
                type User {
                    verifiedAt: DateTime! @default(value: "Not a date")
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError("@default.value is not a valid DateTime"),
            ]);
        });

        test("on primitive field should not throw an error", async () => {
            const typeDefs = `
                type User {
                    name: String!
                    location: String! @default(value: "somewhere")
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).resolves.not.toThrow();
        });
    });

    describe("with enum fields", () => {
        test("on enum field with incorrect value should throw an error", async () => {
            const typeDefs = `
                type User {
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
            const typeDefs = `
                type User {
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
            const typeDefs = `
                type User {
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
});
