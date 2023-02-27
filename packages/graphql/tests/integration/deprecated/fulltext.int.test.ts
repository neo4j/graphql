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
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { delay } from "../../../src/utils/utils";
import { isMultiDbUnsupportedError } from "../../utils/is-multi-db-unsupported-error";

describe("@fulltext directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let databaseName: string;
    let MULTIDB_SUPPORT = true;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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

        await delay(5000);
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

    test("should create index if it doesn't exist and then query using the index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
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

        try {
            const result = await session.run(cypher);

            const record = result.records[0].get("result") as {
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

            await session.run(`
                CREATE (:${type.name} { title: "${title}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }, { name: "${indexName2}", fields: ["description"] }]) {
                title: String!
                description: String!
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

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName1}: { phrase: "${title}" }, ${indexName2}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

        expect(gqlResult.errors && gqlResult.errors[0].message).toBe("Can only call one search at any given time");
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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            #type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(label: "${label}") {
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(labels: ["${label}"]) {
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

        try {
            const result = await session.run(cypher);

            const record = result.records[0].get("result") as {
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

            await session.run(`
                CREATE (:${label} { title: "${title}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            #type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(label: "${label}") {
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) @node(labels: ["${label}"]) {
                title: String! @alias(property: "newTitle")
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

        try {
            const result = await session.run(cypher);

            const record = result.records[0].get("result") as {
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

            await session.run(`
                CREATE (:${label} { newTitle: "${title}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title", "description"] }]) {
                title: String!
                description: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        const session = driver.session({ database: databaseName });

        try {
            await session.run(
                [`CREATE FULLTEXT INDEX ${indexName}`, `IF NOT EXISTS FOR (n:${type.name})`, `ON EACH [n.title]`].join(
                    " "
                )
            );
        } finally {
            await session.close();
        }

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title", "description"] }]) {
                title: String!
                description: String! @alias(property: "${alias}")
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        const session = driver.session({ database: databaseName });

        try {
            await session.run(
                [
                    `CREATE FULLTEXT INDEX ${indexName}`,
                    `IF NOT EXISTS FOR (n:${type.name})`,
                    `ON EACH [n.title, n.description]`,
                ].join(" ")
            );
        } finally {
            await session.close();
        }

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
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

        // Previously this would have thrown, but the operation should be idempotent
        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const session = driver.session({ database: databaseName });

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

        try {
            const result = await session.run(cypher);

            const record = result.records[0].get("result") as {
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

            await session.run(`
                CREATE (:${type.name} { title: "${title}" })
            `);
        } finally {
            await session.close();
        }
    });

    test("should throw when index is missing fields when used with create option", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title", "description"] }]) {
                title: String!
                description: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        await neoSchema.getSchema();

        const session = driver.session({ database: databaseName });

        try {
            await session.run(
                [`CREATE FULLTEXT INDEX ${indexName}`, `IF NOT EXISTS FOR (n:${type.name})`, `ON EACH [n.title]`].join(
                    " "
                )
            );
        } finally {
            await session.close();
        }

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
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
        const type = new UniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["id"] }]) {
                id: ID!
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

        try {
            const result = await session.run(cypher);

            const record = result.records[0].get("result") as {
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

            await session.run(`
                CREATE (:${type.name} { id: "${id}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { ${indexName}: { phrase: "${id}" } }) {
                    id
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [type.plural]: [{ id }],
        });
    });
});
