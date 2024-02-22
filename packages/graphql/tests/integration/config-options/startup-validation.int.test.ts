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
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { GraphQLError } from "graphql";

describe("Startup Validation", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    const typePointAlreadyExistsErrors = [
        new GraphQLError(
            'Type "Point" already exists in the schema. It cannot also be defined in this type definition.'
        ),
        new GraphQLError(
            'Field "Point.latitude" already exists in the schema. It cannot also be defined in this type extension.'
        ),
        new GraphQLError(
            'Field "Point.longitude" already exists in the schema. It cannot also be defined in this type extension.'
        ),
    ];
    const missingCustomResolverError = "Custom resolver for fullName has not been provided";

    const customResolverTypeDefs = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            fullName: String @customResolver(requires: "firstName lastName")
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
            fullName: String @customResolver(requires: "firstName lastName")
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

    const invalidDuplicateRelationship = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            friend1: User! @relationship(type: "FRIENDS_WITH", direction: IN)
            friend2: User! @relationship(type: "FRIENDS_WITH", direction: IN)
        }
    `;

    const invalidAll = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            fullName: String @customResolver(requires: "firstName lastName")
            friend1: User! @relationship(type: "FRIENDS_WITH", direction: IN)
            friend2: User! @relationship(type: "FRIENDS_WITH", direction: IN)
        }

        type Point {
            latitude: Float!
            longitude: Float!
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw an error for valid type defs when running startup validation", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: validTypeDefs,
            driver,
            validate: true,
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw an error for invalid type defs by default", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
        });

        await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers(typePointAlreadyExistsErrors);
    });

    test("should not throw an error for invalid type defs when validate is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            validate: false,
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw an error for invalid type defs when validate is true", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            validate: true,
        });

        await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers(typePointAlreadyExistsErrors);
    });

    describe("@customResolver", () => {
        let warn: jest.SpyInstance;

        beforeEach(() => {
            warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        });

        afterEach(() => {
            warn.mockReset();
        });

        test("should warn for missing custom resolvers", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: customResolverTypeDefs,
                driver,
            });

            await neoSchema.getSchema();

            expect(warn).toHaveBeenCalledWith(missingCustomResolverError);
        });

        test("should throw an error for invalid type defs when validate is true, and warn will not be reached", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: invalidAndCustomResolverTypeDefs,
                driver,
                validate: true,
            });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers(typePointAlreadyExistsErrors);
            expect(warn).not.toHaveBeenCalled();
        });

        test("should throw no errors when validate is false, but warn for custom resolvers", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: invalidAndCustomResolverTypeDefs,
                driver,
                validate: false,
            });

            await expect(neoSchema.getSchema()).resolves.not.toThrow();
            expect(warn).toHaveBeenCalledWith(missingCustomResolverError);
        });
    });

    test("should throw an error for duplicate relationship fields when validate is true", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidDuplicateRelationship,
            driver,
            validate: true,
        });

        await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
            new GraphQLError(
                "@relationship invalid. Multiple fields of the same type cannot have a relationship with the same direction and type combination."
            ),
        ]);
    });

    test("should not throw an error for duplicate relationship fields validate is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidDuplicateRelationship,
            driver,
            validate: false,
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should throw no errors when validate is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidAll,
            driver,
            validate: false,
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
});
