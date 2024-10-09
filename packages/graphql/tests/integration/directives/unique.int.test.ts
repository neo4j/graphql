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

import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import type { Neo4jDatabaseInfo } from "../../../src/classes/Neo4jDatabaseInfo";
import { isMultiDbUnsupportedError } from "../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../utils/tests-helper";

describe("assertIndexesAndConstraints/unique", () => {
    const testHelper = new TestHelper();
    let driver: Driver;
    let databaseName: string;
    let MULTIDB_SUPPORT = true;
    let dbInfo: Neo4jDatabaseInfo;

    beforeAll(async () => {
        dbInfo = await testHelper.getDatabaseInfo();

        databaseName = generate({ readable: true, charset: "alphabetic" });

        try {
            await testHelper.createDatabase(databaseName);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                    await testHelper.close();
                } else {
                    throw e;
                }
            }
        }
    });

    beforeEach(async () => {
        if (MULTIDB_SUPPORT) {
            driver = await testHelper.getDriver();
        }
    });

    afterEach(async () => {
        if (MULTIDB_SUPPORT) {
            await testHelper.close();
        }
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            await testHelper.dropDatabase();
            await testHelper.close();
        }
    });

    describe("@unique", () => {
        test("should throw an error when all necessary constraints do not exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("Book");

            const typeDefs = `
                type ${type.name} @node {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.isbn`);
        });

        test("should throw an error when all necessary constraints do not exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("Book");

            const typeDefs = `
                type ${type.name} @node {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.internationalStandardBookNumber`);
        });

        test("should not throw an error when all necessary constraints exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("Book");

            const typeDefs = `
                type ${type.name} @node {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const cypher = `CREATE CONSTRAINT ${type.name}_isbn ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.isbn IS UNIQUE`;

            await testHelper.executeCypher(cypher);

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("Book");

            const typeDefs = `
                type ${type.name} @node {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const cypher = `CREATE CONSTRAINT ${type.name}_isbn ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.internationalStandardBookNumber IS UNIQUE`;

            await testHelper.executeCypher(cypher);

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw if constraint exists on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = testHelper.createUniqueType("Base");
            const additionalType = testHelper.createUniqueType("Additional");

            const typeDefs = `
                type ${baseType.name} @node(labels: ["${baseType.name}", "${additionalType.name}"]) {
                    someIntProperty: Int!
                    title: String! @unique
                }
            `;

            const createConstraintCypher = `
                CREATE CONSTRAINT ${baseType.name}_unique_title ${dbInfo.gte("4.4") ? "FOR" : "ON"} (r:${
                additionalType.name
            })
                ${dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"} r.title IS UNIQUE;
            `;

            await testHelper.executeCypher(createConstraintCypher);

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    sessionConfig: { database: databaseName },
                })
            ).resolves.not.toThrow();
        });

        test("should not allow creating duplicate @unique properties when constraint is on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = testHelper.createUniqueType("Base");
            const additionalType = testHelper.createUniqueType("Additional");
            const typeDefs = `
                type ${baseType.name} @node(labels: ["${baseType.name}", "${additionalType.name}"]) {
                    someStringProperty: String! @unique @alias(property: "someAlias")
                    title: String!
                }
            `;

            const createConstraintCypher = `
                CREATE CONSTRAINT ${baseType.name}_unique_someAlias ${dbInfo.gte("4.4") ? "FOR" : "ON"} (r:${
                additionalType.name
            })
                ${dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"} r.someAlias IS UNIQUE;
            `;

            await testHelper.executeCypher(createConstraintCypher);

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const mutation = `
                    mutation {
                        ${baseType.operations.create}(input: [
                            {
                                someStringProperty: "notUnique",
                                title: "someTitle"
                            },
                            {
                                someStringProperty: "notUnique",
                                title: "someTitle2"
                            },
                        ]) {
                            ${baseType.plural} {
                                someStringProperty
                            }
                        }
                    }
                `;

            const query = `
                    query {
                        ${baseType.plural} {
                            someStringProperty
                        }
                    }
                `;

            const mutationGqlResult = await testHelper.executeGraphQL(mutation);

            const queryGqlResult = await testHelper.executeGraphQL(query);

            expect((mutationGqlResult?.errors as any[])[0].message).toBe("Constraint validation failed");

            expect(queryGqlResult.errors).toBeFalsy();
            expect(queryGqlResult.data?.[baseType.plural]).toBeArrayOfSize(0);
        });

        test("should not allow updating to duplicate @unique properties when constraint is on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = testHelper.createUniqueType("Base");
            const additionalType = testHelper.createUniqueType("Additional");
            const typeDefs = `
                type ${baseType.name} @node(labels: ["${baseType.name}", "${additionalType.name}"]) {
                    someStringProperty: String! @unique @alias(property: "someAlias")
                    title: String!
                }
            `;

            const createConstraintCypher = `
                CREATE CONSTRAINT ${baseType.name}_unique_someAlias ${dbInfo.gte("4.4") ? "FOR" : "ON"} (r:${
                additionalType.name
            })
                ${dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"} r.someAlias IS UNIQUE;
            `;

            await testHelper.executeCypher(createConstraintCypher);

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const uniqueVal1 = "someVal1";
            const uniqueVal2 = "someUniqueVal2";

            const createMutation = `
                    mutation {
                        ${baseType.operations.create}(input: [
                            {
                                someStringProperty: "${uniqueVal1}",
                                title: "someTitle"
                            },
                            {
                                someStringProperty: "${uniqueVal2}",
                                title: "someTitle2"
                            },
                        ]) {
                            ${baseType.plural} {
                                someStringProperty
                            }
                        }
                    }
                `;

            const updateMutation = `
                    mutation {
                        ${baseType.operations.update}(update: {
                            someStringProperty: "notUnique"
                        }) {
                            ${baseType.plural} {
                                someStringProperty
                            }
                        }
                    }
                `;

            const query = `
                    query {
                        ${baseType.plural} {
                            someStringProperty
                        }
                    }
                `;

            const createGqlResult = await testHelper.executeGraphQL(createMutation);
            const updateGqlResult = await testHelper.executeGraphQL(updateMutation);
            const queryGqlResult = await testHelper.executeGraphQL(query);

            expect(createGqlResult?.errors).toBeFalsy();
            expect((updateGqlResult?.errors as any[])[0].message).toBe("Constraint validation failed");

            expect(queryGqlResult.errors).toBeFalsy();
            expect(queryGqlResult.data?.[baseType.plural]).toIncludeSameMembers([
                {
                    someStringProperty: uniqueVal1,
                },
                {
                    someStringProperty: uniqueVal2,
                },
            ]);
        });
    });

    describe("@id", () => {
        test("should throw an error when all necessary constraints do not exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("User");

            const typeDefs = `
                type ${type.name} @node {
                    id: ID! @id @unique
                    name: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.id`);
        });

        test("should throw an error when all necessary constraints do not exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("User");

            const typeDefs = `
                type ${type.name} @node {
                    id: ID! @id @unique @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.identifier`);
        });

        test("should not throw an error when all necessary constraints exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("User");

            const typeDefs = `
                type ${type.name} @node {
                    id: ID! @id @unique
                    name: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const cypher = `CREATE CONSTRAINT ${type.name}_id ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.id IS UNIQUE`;

            await testHelper.executeCypher(cypher);

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = testHelper.createUniqueType("User");

            const typeDefs = `
                type ${type.name} @node {
                    id: ID! @id @unique @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const cypher = `CREATE CONSTRAINT ${type.name}_id ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.identifier IS UNIQUE`;

            await testHelper.executeCypher(cypher);

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, sessionConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw if constraint exists on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = testHelper.createUniqueType("Base");
            const additionalType = testHelper.createUniqueType("Additional");
            const typeDefs = `
                type ${baseType.name} @node(labels: ["${baseType.name}", "${additionalType.name}"]) @mutation(operations: []) {
                    someIdProperty: ID! @id @unique @alias(property: "someAlias")
                    title: String!
                }
            `;

            const createConstraintCypher = `
                CREATE CONSTRAINT ${baseType.name}_unique_someAlias ${dbInfo.gte("4.4") ? "FOR" : "ON"} (r:${
                additionalType.name
            })
                ${dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"} r.someAlias IS UNIQUE;
            `;

            await testHelper.executeCypher(createConstraintCypher);

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    sessionConfig: { database: databaseName },
                })
            ).resolves.not.toThrow();
        });
    });
});
