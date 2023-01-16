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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Startup Validation", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    const invalidTypeDefsError = 'Type "Point" already exists in the schema.';
    const missingCustomResolverError = "Custom resolver for fullName has not been provided";

    const customResolverTypeDefs = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            fullName: String @customResolver(requires: ["firstName", "lastName"])
        } 
    `;

    const invalidTypeDefs = `
        type Point {
            latitude: Float!
            longitude: Float!
        }
    `;

    const invalidAndCustomResolverTypeDefs = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            fullName: String @customResolver(requires: ["firstName", "lastName"])
        }

        type Point {
            latitude: Float!
            longitude: Float!
        }
    `;

    const validTypeDefs = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw an error for valid type defs when running startup validation", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: validTypeDefs,
            driver,
            config: {
                startupValidation: true,
            },
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw an error for invalid type defs by default", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(invalidTypeDefsError);
    });

    test("should not throw an error for invalid type defs when startupValidation is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            config: {
                startupValidation: false,
            },
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw an error for invalid type defs when startupValidation is true", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            config: {
                startupValidation: true,
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(invalidTypeDefsError);
    });

    test("should not throw an error for invalid type defs when startupValidation.typeDefs is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            config: {
                startupValidation: {
                    typeDefs: false,
                },
            },
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw an error for invalid type defs when startupValidation.typeDefs is true", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            config: {
                startupValidation: {
                    typeDefs: true,
                    customResolver: false,
                },
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(invalidTypeDefsError);
    });

    test("should throw an error for invalid type defs by default when startupValidation is an object", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            config: {
                startupValidation: {
                    customResolver: false,
                },
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(invalidTypeDefsError);
    });

    test("should throw an error for missing custom resolvers by default", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: customResolverTypeDefs,
            driver,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(missingCustomResolverError);
    });

    test("should not throw an error for missing custom resolvers when startupValidation is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: customResolverTypeDefs,
            driver,
            config: {
                startupValidation: false,
            },
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw an error for missing custom resolvers when startupValidation is true", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: customResolverTypeDefs,
            driver,
            config: {
                startupValidation: false,
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(missingCustomResolverError);
    });

    test("should not throw an error for missing custom resolvers when startupValidation.customResolver is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: customResolverTypeDefs,
            driver,
            config: {
                startupValidation: {
                    typeDefs: false,
                    customResolver: false,
                },
            },
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw an error for missing custom resolvers when startupValidation.customResolver is true", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: customResolverTypeDefs,
            driver,
            config: {
                startupValidation: {
                    typeDefs: true,
                    customResolver: true,
                },
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(missingCustomResolverError);
    });

    test("should throw an error for missing custom resolvers by default when startupValidation is an object", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: customResolverTypeDefs,
            driver,
            config: {
                startupValidation: {
                    typeDefs: false,
                },
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(missingCustomResolverError);
    });

    test("should throw an error for both type defs and custom resolvers by default", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidAndCustomResolverTypeDefs,
            driver,
            config: {
                startupValidation: true,
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(invalidTypeDefsError);
    });

    test("should throw an error for both type defs and custom resolvers when startupValidation is true", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidAndCustomResolverTypeDefs,
            driver,
            config: {
                startupValidation: true,
            },
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(invalidTypeDefsError);
    });

    test("should not throw an error for both type defs and custom resolvers when startupValidation is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidAndCustomResolverTypeDefs,
            driver,
            config: {
                startupValidation: true,
            },
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
});
