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
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import { delay } from "../../../../src/utils/utils";
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { testIf } from "../../../utils/test-if";

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

    // function createSchemaAndAssertIndexes():Promise<GraphQLSchema> {}

    testIf(MULTIDB_SUPPORT)("Query using fulltext index", async () => {
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
        try {
            await session.run(`
                CREATE (:${type.name} { title: "${title}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { index: ${indexName}, phrase: "${title}" }) {
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

    testIf(MULTIDB_SUPPORT)("should query fulltext using node label", async () => {
        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const label = generate({ readable: true, charset: "alphabetic" });
        const type = new UniqueType("Movie");

        const typeDefs = gql`
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

        try {
            await session.run(`
                CREATE (:${label} { title: "${title}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { index: ${indexName},  phrase: "${title}" }) {
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

    testIf(MULTIDB_SUPPORT)("should query fulltext using field alias", async () => {
        const title = generate({ readable: true, charset: "alphabetic" });
        const indexName = generate({ readable: true, charset: "alphabetic" });
        const label = generate({ readable: true, charset: "alphabetic" });
        const type = new UniqueType("Movie");

        const typeDefs = gql`
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

        try {
            await session.run(`
                CREATE (:${label} { newTitle: "${title}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { index: ${indexName}, phrase: "${title}" }) {
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

    testIf(MULTIDB_SUPPORT)("should query fulltext for ID field", async () => {
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

        try {
            await session.run(`
                CREATE (:${type.name} { id: "${id}" })
            `);
        } finally {
            await session.close();
        }

        const query = `
            query {
                ${type.plural}(fulltext: { index: ${indexName}, phrase: "${id}" }) {
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
