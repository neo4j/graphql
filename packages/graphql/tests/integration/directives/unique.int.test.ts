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
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { isMultiDbUnsupportedError } from "../../utils/is-multi-db-unsupported-error";
import type { Neo4jDatabaseInfo } from "../../../src/classes/Neo4jDatabaseInfo";
import { getNeo4jDatabaseInfo } from "../../../src/classes/Neo4jDatabaseInfo";
import { Executor } from "../../../src/classes/Executor";

describe("assertIndexesAndConstraints/unique", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let databaseName: string;
    let MULTIDB_SUPPORT = true;
    let dbInfo: Neo4jDatabaseInfo;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        dbInfo = await getNeo4jDatabaseInfo(new Executor({ executionContext: driver }));

        databaseName = generate({ readable: true, charset: "alphabetic" });

        const cypher = `CREATE DATABASE ${databaseName} WAIT`;
        const session = driver.session();

        try {
            await session.run(cypher);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                } else {
                    throw e;
                }
            }
        } finally {
            await session.close();
        }

        await new Promise((x) => setTimeout(x, 5000));
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const cypher = `DROP DATABASE ${databaseName}`;

            const session = await neo4j.getSession();
            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }
        }
        await driver.close();
    });

    test("should create a constraint if it doesn't exist and specified in options, and then throw an error in the event of constraint validation", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const isbn = generate({ readable: true });
        const title = generate({ readable: true });

        const typeDefs = gql`
            type Book {
                isbn: String! @unique
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const session = driver.session({ database: databaseName });

        const cypher = "SHOW UNIQUE CONSTRAINTS";

        try {
            const result = await session.run(cypher);

            expect(
                result.records
                    .map((record) => {
                        return record.toObject();
                    })
                    .filter((record) => record.labelsOrTypes.includes("Book"))
            ).toHaveLength(1);
        } finally {
            await session.close();
        }

        const mutation = `
            mutation CreateBooks($isbn: String!, $title: String!) {
                createBooks(input: [{ isbn: $isbn, title: $title }]) {
                    books {
                        isbn
                        title
                    }
                }
            }
        `;

        const createResult = await graphql({
            schema,
            source: mutation,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
            variableValues: {
                isbn,
                title,
            },
        });

        expect(createResult.errors).toBeFalsy();

        expect(createResult.data).toEqual({
            createBooks: { books: [{ isbn, title }] },
        });

        const errorResult = await graphql({
            schema,
            source: mutation,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
            variableValues: {
                isbn,
                title,
            },
        });

        expect(errorResult.errors).toHaveLength(1);
        expect(errorResult.errors?.[0]?.message).toBe("Constraint validation failed");
    });

    describe("@unique", () => {
        test("should throw an error when all necessary constraints do not exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.isbn`);
        });

        test("should throw an error when all necessary constraints do not exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.internationalStandardBookNumber`);
        });

        test("should not throw an error when all necessary constraints exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_isbn ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.isbn IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_isbn ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.internationalStandardBookNumber IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should create a constraint if it doesn't exist and specified in options", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = "SHOW UNIQUE CONSTRAINTS";

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => {
                            return record.toObject();
                        })
                        .filter((record) => record.labelsOrTypes.includes(type.name))
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should create a constraint if it doesn't exist and specified in options when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = "SHOW UNIQUE CONSTRAINTS";

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => {
                            return record.toObject();
                        })
                        .filter(
                            (record) =>
                                record.labelsOrTypes.includes(type.name) &&
                                record.properties.includes("internationalStandardBookNumber")
                        )
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should not throw if constraint exists on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = new UniqueType("Base");
            const additionalType = new UniqueType("Additional");

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

            const session = driver.session({ database: databaseName });

            try {
                await session.run(createConstraintCypher);

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                await neoSchema.getSchema();

                await expect(
                    neoSchema.assertIndexesAndConstraints({
                        driver,
                        driverConfig: { database: databaseName },
                    })
                ).resolves.not.toThrow();
            } finally {
                await session.close();
            }
        });

        test("should not create new constraint if constraint exists on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = new UniqueType("Base");
            const additionalType = new UniqueType("Additional");
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

            const showConstraintsCypher = "SHOW UNIQUE CONSTRAINTS";

            const session = driver.session({ database: databaseName });

            try {
                await session.run(createConstraintCypher);

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                await neoSchema.getSchema();

                await expect(
                    neoSchema.assertIndexesAndConstraints({
                        driver,
                        driverConfig: { database: databaseName },
                        options: { create: true },
                    })
                ).resolves.not.toThrow();

                const dbConstraintsResult = (await session.run(showConstraintsCypher)).records.map((record) => {
                    return record.toObject();
                });

                expect(
                    dbConstraintsResult.filter(
                        (record) => record.labelsOrTypes.includes(baseType.name) && record.properties.includes("title")
                    )
                ).toHaveLength(0);

                expect(
                    dbConstraintsResult.filter(
                        (record) =>
                            record.labelsOrTypes.includes(additionalType.name) && record.properties.includes("title")
                    )
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should not allow creating duplicate @unique properties when constraint is on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = new UniqueType("Base");
            const additionalType = new UniqueType("Additional");
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

            const session = driver.session({ database: databaseName });

            try {
                await session.run(createConstraintCypher);

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                const generatedSchema = await neoSchema.getSchema();

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

                const mutationGqlResult = await graphql({
                    schema: generatedSchema,
                    source: mutation,
                    contextValue: {
                        driver,
                        driverConfig: { database: databaseName },
                    },
                });

                const queryGqlResult = await graphql({
                    schema: generatedSchema,
                    source: query,
                    contextValue: {
                        driver,
                        driverConfig: { database: databaseName },
                    },
                });

                expect((mutationGqlResult?.errors as any[])[0].message).toBe("Constraint validation failed");

                expect(queryGqlResult.errors).toBeFalsy();
                expect(queryGqlResult.data?.[baseType.plural]).toBeArrayOfSize(0);
            } finally {
                await session.close();
            }
        });

        test("should not allow updating to duplicate @unique properties when constraint is on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = new UniqueType("Base");
            const additionalType = new UniqueType("Additional");
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

            const session = driver.session({ database: databaseName });

            try {
                await session.run(createConstraintCypher);

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                const generatedSchema = await neoSchema.getSchema();

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

                const createGqlResult = await graphql({
                    schema: generatedSchema,
                    source: createMutation,
                    contextValue: {
                        driver,
                        driverConfig: { database: databaseName },
                    },
                });

                const updateGqlResult = await graphql({
                    schema: generatedSchema,
                    source: updateMutation,
                    contextValue: {
                        driver,
                        driverConfig: { database: databaseName },
                    },
                });

                const queryGqlResult = await graphql({
                    schema: generatedSchema,
                    source: query,
                    contextValue: {
                        driver,
                        driverConfig: { database: databaseName },
                    },
                });

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
            } finally {
                await session.close();
            }
        });
    });

    describe("@id", () => {
        test("should throw an error when all necessary constraints do not exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.id`);
        });

        test("should throw an error when all necessary constraints do not exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.identifier`);
        });

        test("should not throw an error when unique argument is set to false", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false)
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when unique argument is set to false when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false) @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_id ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.id IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_id ${dbInfo.gte("4.4") ? "FOR" : "ON"} (n:${type.name}) ${
                dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"
            } n.identifier IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertIndexesAndConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should create a constraint if it doesn't exist and specified in options", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = "SHOW UNIQUE CONSTRAINTS";

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => {
                            return record.toObject();
                        })
                        .filter((record) => record.labelsOrTypes.includes(type.name))
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should create a constraint if it doesn't exist and specified in options when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = "SHOW UNIQUE CONSTRAINTS";

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => {
                            return record.toObject();
                        })
                        .filter(
                            (record) =>
                                record.labelsOrTypes.includes(type.name) && record.properties.includes("identifier")
                        )
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should not create a constraint if it doesn't exist and unique option is set to false", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false)
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = "SHOW UNIQUE CONSTRAINTS";

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => {
                            return record.toObject();
                        })
                        .filter((record) => record.labelsOrTypes.includes(type.name))
                ).toHaveLength(0);
            } finally {
                await session.close();
            }
        });

        test("should not create a constraint if it doesn't exist and unique option is set to false when used with @alias", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false) @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = "SHOW UNIQUE CONSTRAINTS";

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => {
                            return record.toObject();
                        })
                        .filter(
                            (record) =>
                                record.labelsOrTypes.includes(type.name) && record.properties.includes("identifier")
                        )
                ).toHaveLength(0);
            } finally {
                await session.close();
            }
        });

        test("should not throw if constraint exists on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = new UniqueType("Base");
            const additionalType = new UniqueType("Additional");
            const typeDefs = `
                type ${baseType.name} @node(labels: ["${baseType.name}", "${additionalType.name}"]) @exclude(operations: [CREATE, UPDATE, DELETE]) {
                    someIdProperty: ID! @id @alias(property: "someAlias")
                    title: String!
                }
            `;

            const createConstraintCypher = `
                CREATE CONSTRAINT ${baseType.name}_unique_someAlias ${dbInfo.gte("4.4") ? "FOR" : "ON"} (r:${
                additionalType.name
            })
                ${dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"} r.someAlias IS UNIQUE;
            `;
            const session = driver.session({ database: databaseName });

            try {
                await session.run(createConstraintCypher);

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                await neoSchema.getSchema();

                await expect(
                    neoSchema.assertIndexesAndConstraints({
                        driver,
                        driverConfig: { database: databaseName },
                    })
                ).resolves.not.toThrow();
            } finally {
                await session.close();
            }
        });

        test("should not create new constraint if constraint exists on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = new UniqueType("Base");
            const additionalType = new UniqueType("Additional");
            const typeDefs = `
                type ${baseType.name} @node(labels: ["${baseType.name}", "${additionalType.name}"]) @exclude(operations: [CREATE, UPDATE, DELETE]) {
                    someIdProperty: ID! @id @alias(property: "someAlias")
                    title: String!
                }
            `;

            const createConstraintCypher = `
                CREATE CONSTRAINT ${baseType.name}_unique_someAlias ${dbInfo.gte("4.4") ? "FOR" : "ON"} (r:${
                additionalType.name
            })
                ${dbInfo.gte("4.4") ? "REQUIRE" : "ASSERT"} r.someAlias IS UNIQUE;
            `;

            const showConstraintsCypher = "SHOW UNIQUE CONSTRAINTS";

            const session = driver.session({ database: databaseName });

            try {
                await session.run(createConstraintCypher);

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                await neoSchema.getSchema();

                await expect(
                    neoSchema.assertIndexesAndConstraints({
                        driver,
                        driverConfig: { database: databaseName },
                        options: { create: true },
                    })
                ).resolves.not.toThrow();

                const dbConstraintsResult = (await session.run(showConstraintsCypher)).records.map((record) => {
                    return record.toObject();
                });

                expect(
                    dbConstraintsResult.filter(
                        (record) =>
                            record.labelsOrTypes.includes(baseType.name) && record.properties.includes("someAlias")
                    )
                ).toHaveLength(0);

                expect(
                    dbConstraintsResult.filter(
                        (record) =>
                            record.labelsOrTypes.includes(additionalType.name) &&
                            record.properties.includes("someAlias")
                    )
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });
    });
});
