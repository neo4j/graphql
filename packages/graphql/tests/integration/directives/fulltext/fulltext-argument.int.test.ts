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

describe("@fulltext directive", () => {
    let driver: Driver;
    const testHelper = new TestHelper();
    let databaseName: string;
    let MULTIDB_SUPPORT = true;

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

    test("should create index if it doesn't exist and then query using the index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
                title: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const cypher = `
            SHOW INDEXES yield
                name AS name,
                type AS type,
                entityType AS entityType,
                labelsOrTypes AS labelsOrTypes,
                properties AS properties
            WHERE name = "${indexName}"
            RETURN {
                 name: name,
                 type: type,
                 entityType: entityType,
                 labelsOrTypes: labelsOrTypes,
                 properties: properties
            } as result
        `;

        const result = await testHelper.executeCypher(cypher);

        const record = result.records[0]?.get("result") as {
            name: string;
            type: string;
            entityType: string;
            labelsOrTypes: string[];
            properties: string[];
        };

        expect(record.name).toEqual(indexName);
        expect(record.type).toBe("FULLTEXT");
        expect(record.entityType).toBe("NODE");
        expect(record.labelsOrTypes).toEqual([type.name]);
        expect(record.properties).toEqual(["title"]);

        await testHelper.executeCypher(`
                CREATE (:${type.name} { title: "${title}" })
            `);

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [type.plural]: [{ title }],
        });
    });

    test("should create two index's if they dont exist and then throw and error when users queries both at once", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName1 = generate({ readable: true, charset: "alphabetic" });
        const indexName2 = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }, { name: "${indexName2}", fields: ["description"] }]) {
                title: String!
                description: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName1}: { phrase: "${title}" }, ${indexName2}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors && gqlResult.errors[0]?.message).toBe("Can only call one search at any given time");
    });

    test("should create index if it doesn't exist (using node label) and then query using the index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const label = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            #type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(label: "${label}") {
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(labels: ["${label}"]) {
                title: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const cypher = `
            SHOW INDEXES yield
                name AS name,
                type AS type,
                entityType AS entityType,
                labelsOrTypes AS labelsOrTypes,
                properties AS properties
            WHERE name = "${indexName}"
            RETURN {
                 name: name,
                 type: type,
                 entityType: entityType,
                 labelsOrTypes: labelsOrTypes,
                 properties: properties
            } as result
        `;

        const result = await testHelper.executeCypher(cypher);

        const record = result.records[0]?.get("result") as {
            name: string;
            type: string;
            entityType: string;
            labelsOrTypes: string[];
            properties: string[];
        };

        expect(record.name).toEqual(indexName);
        expect(record.type).toBe("FULLTEXT");
        expect(record.entityType).toBe("NODE");
        expect(record.labelsOrTypes).toEqual([label]);
        expect(record.properties).toEqual(["title"]);

        await testHelper.executeCypher(`
                CREATE (:${label} { title: "${title}" })
            `);

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [type.plural]: [{ title }],
        });
    });

    test("should create index if it doesn't exist (using field alias) and then query using the index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const label = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            #type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(label: "${label}") {
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(labels: ["${label}"]) {
                title: String! @alias(property: "newTitle")
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const cypher = `
            SHOW INDEXES yield
                name AS name,
                type AS type,
                entityType AS entityType,
                labelsOrTypes AS labelsOrTypes,
                properties AS properties
            WHERE name = "${indexName}"
            RETURN {
                 name: name,
                 type: type,
                 entityType: entityType,
                 labelsOrTypes: labelsOrTypes,
                 properties: properties
            } as result
        `;

        const result = await testHelper.executeCypher(cypher);

        const record = result.records[0]?.get("result") as {
            name: string;
            type: string;
            entityType: string;
            labelsOrTypes: string[];
            properties: string[];
        };

        expect(record.name).toEqual(indexName);
        expect(record.type).toBe("FULLTEXT");
        expect(record.entityType).toBe("NODE");
        expect(record.labelsOrTypes).toEqual([label]);
        expect(record.properties).toEqual(["newTitle"]);

        await testHelper.executeCypher(`
                CREATE (:${label} { newTitle: "${title}" })
            `);

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [type.plural]: [{ title }],
        });
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
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
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
        ).rejects.toThrow(`Missing @fulltext index '${indexName}' on Node '${type.name}'`);
    });

    test("should throw when index is missing fields", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title", "description"] }]) {
                title: String!
                description: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await testHelper.executeCypher(
            [`CREATE FULLTEXT INDEX ${indexName}`, `IF NOT EXISTS FOR (n:${type.name})`, `ON EACH [n.title]`].join(" ")
        );

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            })
        ).rejects.toThrow(`@fulltext index '${indexName}' on Node '${type.name}' is missing field 'description'`);
    });

    test("should throw when index is missing fields (using field alias)", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const indexName = generate({ readable: true, charset: "alphabetic" });
        const alias = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title", "description"] }]) {
                title: String!
                description: String! @alias(property: "${alias}")
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await testHelper.executeCypher(
            [
                `CREATE FULLTEXT INDEX ${indexName}`,
                `IF NOT EXISTS FOR (n:${type.name})`,
                `ON EACH [n.title, n.description]`,
            ].join(" ")
        );

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            })
        ).rejects.toThrow(
            `@fulltext index '${indexName}' on Node '${type.name}' is missing field 'description' aliased to field '${alias}'`
        );
    });

    test("should create index if it doesn't exist and not throw if it does exist, and then query using the index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
                title: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        // Previously this would have thrown, but the operation should be idempotent
        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const cypher = `
            SHOW INDEXES yield
                name AS name,
                type AS type,
                entityType AS entityType,
                labelsOrTypes AS labelsOrTypes,
                properties AS properties
            WHERE name = "${indexName}"
            RETURN {
                 name: name,
                 type: type,
                 entityType: entityType,
                 labelsOrTypes: labelsOrTypes,
                 properties: properties
            } as result
        `;

        const result = await testHelper.executeCypher(cypher);

        const record = result.records[0]?.get("result") as {
            name: string;
            type: string;
            entityType: string;
            labelsOrTypes: string[];
            properties: string[];
        };

        expect(record.name).toEqual(indexName);
        expect(record.type).toBe("FULLTEXT");
        expect(record.entityType).toBe("NODE");
        expect(record.labelsOrTypes).toEqual([type.name]);
        expect(record.properties).toEqual(["title"]);

        await testHelper.executeCypher(`
                CREATE (:${type.name} { title: "${title}" })
            `);
    });

    test("should throw when index is missing fields when used with create option", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title", "description"] }]) {
                title: String!
                description: String!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await testHelper.executeCypher(
            [`CREATE FULLTEXT INDEX ${indexName}`, `IF NOT EXISTS FOR (n:${type.name})`, `ON EACH [n.title]`].join(" ")
        );

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).rejects.toThrow(
            `@fulltext index '${indexName}' on Node '${type.name}' already exists, but is missing field 'description'`
        );
    });

    test("should create index for ID field if it doesn't exist and then query using the index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const id = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["id"] }]) {
                id: ID!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const cypher = `
            SHOW INDEXES yield
                name AS name,
                type AS type,
                entityType AS entityType,
                labelsOrTypes AS labelsOrTypes,
                properties AS properties
            WHERE name = "${indexName}"
            RETURN {
                 name: name,
                 type: type,
                 entityType: entityType,
                 labelsOrTypes: labelsOrTypes,
                 properties: properties
            } as result
        `;

        const result = await testHelper.executeCypher(cypher);

        const record = result.records[0]?.get("result") as {
            name: string;
            type: string;
            entityType: string;
            labelsOrTypes: string[];
            properties: string[];
        };

        expect(record.name).toEqual(indexName);
        expect(record.type).toBe("FULLTEXT");
        expect(record.entityType).toBe("NODE");
        expect(record.labelsOrTypes).toEqual([type.name]);
        expect(record.properties).toEqual(["id"]);

        await testHelper.executeCypher(`
                CREATE (:${type.name} { id: "${id}" })
            `);

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${id}" } }) {
                    id
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [type.plural]: [{ id }],
        });
    });
});
