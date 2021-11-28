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
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("multi-database", () => {
    let driver: Driver;
    const id = generate({
        charset: "alphabetic",
    });
    let MULTIDB_SUPPORT = true;
    const dbName = "non-default-db-name";

    beforeAll(async () => {
        driver = await neo4j();

        try {
            // Create DB
            const createSession = driver.session();
            await createSession.writeTransaction((tx) => tx.run(`CREATE DATABASE \`${dbName}\``));
            await createSession.close();

            // Write data
            const writeSession = driver.session({ database: dbName, bookmarks: createSession.lastBookmark() });
            await writeSession.writeTransaction((tx) => tx.run("CREATE (:Movie {id: $id})", { id }));
            await writeSession.close();

            // Make sure it's written before we continue
            const waitSession = driver.session({ database: dbName, bookmarks: writeSession.lastBookmark() });
            await waitSession.readTransaction((tx) => tx.run("MATCH (m:Movie) RETURN COUNT(m)"));
            await waitSession.close();
        } catch (e) {
            if (e instanceof Error) {
                if (
                    e.message.includes(
                        "This is an administration command and it should be executed against the system database"
                    ) ||
                    e.message.includes("Unsupported administration command")
                ) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                } else {
                    throw e;
                }
            } else {
                throw e;
            }
        }
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const dropSession = driver.session();
            await dropSession.writeTransaction((tx) => tx.run(`DROP DATABASE \`${dbName}\``));
            await dropSession.close();
        }
        await driver.close();
    });

    test("should fail for non-existing database specified via context", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                movies(where: { id: "${id}" }) {
                    id
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            variableValues: { id },
            contextValue: { driver, driverConfig: { database: "non-existing-db" } },
        });
        expect((result.errors as any)[0].message).toBeTruthy();
    });
    test("should specify the database via context", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                movies(where: { id: "${id}" }) {
                    id
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            variableValues: { id },
            contextValue: { driver, driverConfig: { database: dbName } },
        });
        expect((result.data as any).movies[0].id).toBe(id);
    });

    test("should fail for non-existing database specified via neo4j construction", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: { driverConfig: { database: "non-existing-db" } },
        });

        const query = `
            query {
                movies(where: { id: "${id}" }) {
                    id
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            variableValues: { id },
            contextValue: {}, // This is needed, otherwise the context in resolvers will be undefined
        });

        expect([
            "Unable to get a routing table for database 'non-existing-db' because this database does not exist",
            "Database does not exist. Database name: 'non-existing-db'.",
        ]).toContain((result.errors as any)[0].message);
    });
    test("should specify the database via neo4j construction", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: { driverConfig: { database: dbName } },
        });

        const query = `
            query {
                movies(where: { id: "${id}" }) {
                    id
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            variableValues: { id },
            contextValue: {}, // This is needed, otherwise the context in resolvers will be undefined
        });
        expect((result.data as any).movies[0].id).toBe(id);
    });
});
