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

import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { generateUniqueType } from "../../src/utils/test/graphql-types";

describe("assertConstraints", () => {
    let driver: Driver;
    let databaseName: string;

    beforeAll(async () => {
        driver = await neo4j();

        databaseName = generate({ readable: true });

        const cypher = `CREATE DATABASE ${databaseName}`;
        const session = driver.session();
        try {
            await session.run(cypher);
        } finally {
            await session.close();
        }
        await new Promise((x) => setTimeout(x, 5000));
    });

    afterAll(async () => {
        await driver.close();

        const cypher = `DROP DATABASE ${databaseName}`;

        const session = driver.session();
        try {
            await session.run(cypher);
        } finally {
            await session.close();
        }
    });

    describe("@unique", () => {
        test("should throw an error when all necessary constraints do not exist", async () => {
            const type = generateUniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.isbn`);
        });

        test("should throw an error when all necessary constraints do not exist when used with @alias", async () => {
            const type = generateUniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.internationalStandardBookNumber`);
        });

        test("should not throw an error when all necessary constraints exist", async () => {
            const type = generateUniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_isbn ON (n:${type.name}) ASSERT n.isbn IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist when used with @alias", async () => {
            const type = generateUniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_isbn ON (n:${type.name}) ASSERT n.internationalStandardBookNumber IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should create a constraint if it doesn't exist and specified in options", async () => {
            const type = generateUniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = `SHOW UNIQUE CONSTRAINTS`;

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => record.toObject())
                        .filter((record) => record.labelsOrTypes.includes(type.name))
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should create a constraint if it doesn't exist and specified in options when used with @alias", async () => {
            const type = generateUniqueType("Book");

            const typeDefs = `
                type ${type.name} {
                    isbn: String! @unique @alias(property: "internationalStandardBookNumber")
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = `SHOW UNIQUE CONSTRAINTS`;

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => record.toObject())
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
    });

    describe("@id", () => {
        test("should throw an error when all necessary constraints do not exist", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.id`);
        });

        test("should throw an error when all necessary constraints do not exist when used with @alias", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).rejects.toThrow(`Missing constraint for ${type.name}.identifier`);
        });

        test("should not throw an error when unique argument is set to false", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false)
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when unique argument is set to false when used with @alias", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false) @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_id ON (n:${type.name}) ASSERT n.id IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should not throw an error when all necessary constraints exist when used with @alias", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const session = driver.session({ database: databaseName });

            const cypher = `CREATE CONSTRAINT ${type.name}_id ON (n:${type.name}) ASSERT n.identifier IS UNIQUE`;

            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertConstraints({ driver, driverConfig: { database: databaseName } })
            ).resolves.not.toThrow();
        });

        test("should create a constraint if it doesn't exist and specified in options", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = `SHOW UNIQUE CONSTRAINTS`;

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => record.toObject())
                        .filter((record) => record.labelsOrTypes.includes(type.name))
                ).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should create a constraint if it doesn't exist and specified in options when used with @alias", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = `SHOW UNIQUE CONSTRAINTS`;

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => record.toObject())
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
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false)
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = `SHOW UNIQUE CONSTRAINTS`;

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => record.toObject())
                        .filter((record) => record.labelsOrTypes.includes(type.name))
                ).toHaveLength(0);
            } finally {
                await session.close();
            }
        });

        test("should not create a constraint if it doesn't exist and unique option is set to false when used with @alias", async () => {
            const type = generateUniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID! @id(unique: false) @alias(property: "identifier")
                    name: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(
                neoSchema.assertConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            const cypher = `SHOW UNIQUE CONSTRAINTS`;

            try {
                const result = await session.run(cypher);

                expect(
                    result.records
                        .map((record) => record.toObject())
                        .filter(
                            (record) =>
                                record.labelsOrTypes.includes(type.name) && record.properties.includes("identifier")
                        )
                ).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
    });
});
