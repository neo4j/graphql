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
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../../utils/tests-helper";

const queryName = "myQueryName";

describe("@vector directive", () => {
    let driver: Driver;
    const testHelper = new TestHelper();
    let databaseName: string;
    let MULTIDB_SUPPORT = true;

    // const generatedVector = Array.from({ length: 256 }, () => (Math.random() * 2 - 1).toFixed(8));

    beforeAll(async () => {
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

    test("should throw when missing index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @vector(indexes: [{ name: "${indexName}", propertyName: "title", queryName: "${queryName}" }]) {
                title: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            })
        ).rejects.toThrow(`Missing @vector index '${indexName}' on Node '${type.name}'`);
    });

    test("should throw when index is missing property", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @vector(indexes: [{ name: "${indexName}", property: "title" }]) {
                title: String!
                description: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await testHelper.executeCypher(
            [`CREATE VECTOR INDEX ${indexName}`, `IF NOT EXISTS FOR (n:${type.name})`, `ON EACH [n.title]`].join(" ")
        );

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            })
        ).rejects.toThrow(`@vector index '${indexName}' on Node '${type.name}' is missing property 'description'`);
    });
});
