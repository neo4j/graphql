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

    const customResolverTypeDefs = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            fullName: String @customResolver(requires: ["firstName", "lastName"])
        } 
    `;

    const invalidTypeDefs = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            invalidType: NotAType!
        }
    `;

    const invalidAndCustomResolverTypeDefs = `
            type User {
            id: ID!
            firstName: String!
            lastName: String!
            invalidType: NotAType!
            fullName: String @customResolver(requires: ["firstName", "lastName"])
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw an error for invalid type defs by default", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow('Unknown type "NotAType". Did you mean "__Type"?');
    });

    test("should not throw an error for invalid type defs when startupValidation is false", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs: invalidTypeDefs,
            driver,
            config: {
                startupValidation: false,
                skipValidateTypeDefs: true
            }
        });

        await expect(neoSchema.getSchema()).rejects.not.toThrow();
    });
});
