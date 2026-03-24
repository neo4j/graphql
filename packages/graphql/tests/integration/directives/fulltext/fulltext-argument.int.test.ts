/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

    test("should throw when missing index", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const indexName = generate({ readable: true, charset: "alphabetic" });
        const type = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${type.name} @fulltext(indexes: [{ indexName: "${indexName}", queryName: "${type.plural}ByTitle", fields: ["title"] }]) @node {
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
            type ${type.name} @fulltext(indexes: [{ indexName: "${indexName}", queryName: "${type.plural}ByTitleAndDescription", fields: ["title", "description"] }]) @node {
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
            type ${type.name} @fulltext(indexes: [{ indexName: "${indexName}", queryName: "${type.plural}ByTitleAndDescription", fields: ["title", "description"] }]) @node {
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
});
