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

import { generate } from "randomstring";
import type { UniqueType } from "../../../utils/graphql-types";
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../../utils/tests-helper";

describe("assertIndexesAndConstraints with @unique", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let databaseName: string;
    let IS_MULTI_DB_SUPPORTED = true;
    const skipMessage = "Database does not support multiple databases, skip tests that require multi-database support";

    let Book: UniqueType;
    let Comic: UniqueType;

    beforeEach(async () => {
        Book = testHelper.createUniqueType("Book");
        Comic = testHelper.createUniqueType("Comic");
        databaseName = generate({ readable: true, charset: "alphabetic" });

        try {
            await testHelper.createDatabase(databaseName);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    IS_MULTI_DB_SUPPORTED = false;
                    await testHelper.close();
                } else {
                    throw e;
                }
            }
        }
    });

    afterEach(async () => {
        if (IS_MULTI_DB_SUPPORTED) {
            await testHelper.dropDatabase();
        }
        await testHelper.close();
    });

    test("should throw an error when the constraint does not exist for the field", async () => {
        if (!IS_MULTI_DB_SUPPORTED) {
            console.log(skipMessage);
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Book.name} @node {
                isbn: String! @unique(constraintName: "MISSING_CONSTRAINT")
                title: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver: await testHelper.getDriver(),
                sessionConfig: { database: databaseName },
            })
        ).rejects.toThrow(`Missing constraint for ${Book.name}.isbn`);
    });

    test("should throw an error when the constraint exists for the field but under a different name", async () => {
        if (!IS_MULTI_DB_SUPPORTED) {
            console.log(skipMessage);
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Book.name} @node {
                isbn: String! @unique(constraintName: "CONSTRAINT_NAME")
                title: String!
            }
        `;

        const cypher = `CREATE CONSTRAINT WRONG_NAME FOR (n:${Book.name}) REQUIRE n.isbn IS UNIQUE`;
        await testHelper.executeCypher(cypher);

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver: await testHelper.getDriver(),
                sessionConfig: { database: databaseName },
            })
        ).rejects.toThrow(`Missing constraint for ${Book.name}.isbn`);
    });

    test("should not throw an error when all necessary constraints exist", async () => {
        if (!IS_MULTI_DB_SUPPORTED) {
            console.log(skipMessage);
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Book.name} @node {
                isbn: String! @unique(constraintName: "CONSTRAINT_NAME")
                title: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        const cypher = `CREATE CONSTRAINT CONSTRAINT_NAME FOR (n:${Book.name}) REQUIRE n.isbn IS UNIQUE`;
        await testHelper.executeCypher(cypher);

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver: await testHelper.getDriver(),
                sessionConfig: { database: databaseName },
            })
        ).resolves.not.toThrow();
    });

    test("should not throw if constraint exists on an additional label", async () => {
        if (!IS_MULTI_DB_SUPPORTED) {
            console.log(skipMessage);
            return;
        }

        const typeDefs = /* GraphQL */ `
            type ${Book.name} @node(labels: ["${Book.name}", "${Comic.name}"]) {
                isbn: String! @unique(constraintName: "CONSTRAINT_NAME")
                title: String! 
            }
        `;

        const cypher = `CREATE CONSTRAINT CONSTRAINT_NAME FOR (n:${Comic.name}) REQUIRE n.isbn IS UNIQUE`;

        await testHelper.executeCypher(cypher);

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver: await testHelper.getDriver(),
                sessionConfig: { database: databaseName },
            })
        ).resolves.not.toThrow();
    });
});
