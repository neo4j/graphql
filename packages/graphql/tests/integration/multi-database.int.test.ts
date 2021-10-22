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
    const dbName = "non-default-db-name";

    beforeAll(async () => {
        driver = await neo4j();

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
    });

    afterAll(async () => {
        const dropSession = driver.session();
        await dropSession.writeTransaction((tx) => tx.run(`DROP DATABASE \`${dbName}\``));
        await dropSession.close();
        await driver.close();
    });

    test("should fail for non-existing database specified via context", async () => {
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
        expect((result.errors as any)[0].message).toContain("Unable to get a routing table for database");
    });
    test("should specify the database via neo4j construction", async () => {
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
