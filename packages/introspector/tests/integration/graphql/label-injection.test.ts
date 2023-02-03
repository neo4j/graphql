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

import * as neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "../../../src/index";
import createDriver from "../neo4j";

describe("GraphQL - Infer Schema on graphs", () => {
    const dbName = "introspectToNeo4jGrahqlTypeDefsGraphITDb";
    let driver: neo4j.Driver;
    let MULTIDB_SUPPORT = true;

    const sessionFactory = (bm: string[]) => () =>
        driver.session({ defaultAccessMode: neo4j.session.READ, bookmarks: bm, database: dbName });

    beforeAll(async () => {
        driver = await createDriver();
        const cSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            await cSession.writeTransaction((tx) => tx.run(`CREATE DATABASE ${dbName} WAIT`));
        } catch (e) {
            if (e instanceof Error) {
                if (
                    e.message.includes("should be executed against the system database") ||
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
        const waitSession = driver.session({
            defaultAccessMode: neo4j.session.READ,
            database: dbName,
            bookmarks: cSession.lastBookmark(),
        });
        await cSession.close();
        await waitSession.close();
    });
    afterEach(async () => {
        if (MULTIDB_SUPPORT) {
            const xSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
            await xSession.run("MATCH (n) DETACH DELETE n");
            await xSession.close();
        }
    });
    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const cSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
            try {
                await cSession.writeTransaction((tx) => tx.run(`DROP DATABASE ${dbName}`));
            } catch (e) {
                // ignore
            }
        }
        await driver.close();
    });

    test("Can introspect a schema with labels that contain Cypher code", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run("CREATE (a:Wurst) -[:```MATCH (n) DETACH DELETE n //`] -> (:Salat)")
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));
        expect(typeDefs).toMatchInlineSnapshot(`
            "type Salat {
            	wurstsMatcHnDetachdeletEn: [Wurst!]! @relationship(type: \\"\`MATCH (n) DETACH DELETE n //\\", direction: IN)
            }

            type Wurst {
            	matcHnDetachdeletEnSalats: [Salat!]! @relationship(type: \\"\`MATCH (n) DETACH DELETE n //\\", direction: OUT)
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
});
