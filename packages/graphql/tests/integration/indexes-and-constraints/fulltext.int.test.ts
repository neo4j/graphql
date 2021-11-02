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
import { graphql } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../../src/utils/test/graphql-types";

describe("assertIndexesAndConstraints/fulltext", () => {
    let driver: Driver;
    let databaseName: string;
    let MULTIDB_SUPPORT = true;

    beforeAll(async () => {
        driver = await neo4j();

        databaseName = generate({ readable: true, charset: "alphabetic" });

        const cypher = `CREATE DATABASE ${databaseName}`;
        const session = driver.session();

        try {
            await session.run(cypher);
        } catch (e) {
            if (e instanceof Error) {
                if (
                    e.message.includes(
                        "This is an administration command and it should be executed against the system database"
                    ) ||
                    e.message.includes(`Neo4jError: Unsupported administration command: ${cypher}`)
                ) {
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

            const session = driver.session();
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
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const title = generate({ readable: true });
        const indexName = generate({ readable: true });
        const type = generateUniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const session = driver.session({ database: databaseName });

        const cypher = `
            CALL db.indexes() yield 
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
            expect(record.type).toEqual("FULLTEXT");
            expect(record.entityType).toEqual("NODE");
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
                ${type.plural}(search: { ${indexName}: { phrase: "${title}" } }) {
                    title
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
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
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const indexName = generate({ readable: true });
        const type = generateUniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title"] }]) {
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const indexName = generate({ readable: true });
        const type = generateUniqueType("Movie");

        const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName}", fields: ["title", "description"] }]) {
                title: String!
                description: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const session = driver.session({ database: databaseName });

        try {
            await session.run(
                [
                    `CALL db.index.fulltext.createNodeIndex(`,
                    `"${indexName}",`,
                    `["${type.name}"],`,
                    `["title"]`,
                    `)`,
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
        ).rejects.toThrow(`@fulltext index '${indexName}' on Node '${type.name}' is missing field 'description'`);
    });
});
