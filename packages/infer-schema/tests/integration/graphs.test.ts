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
import { inferSchema } from "../../src/index";
import createDriver from "./neo4j";

describe("Infer Schema on graphs", () => {
    const dbName = "inferSchemaGraphITDb";
    let driver: neo4j.Driver;
    beforeAll(async () => {
        driver = await createDriver();
        const cSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            await cSession.writeTransaction((tx) => tx.run(`CREATE DATABASE ${dbName}`));
        } catch (e) {
            // ignore
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
        const xSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await xSession.run("MATCH (n) DETACH DELETE n");
        await xSession.close();
    });
    afterAll(async () => {
        const cSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            await cSession.writeTransaction((tx) => tx.run(`DROP DATABASE ${dbName}`));
        } catch (e) {
            // ignore
        }
        await driver.close();
    });

    test("Can infer on small graph with no rel properties", async () => {
        const nodeProperties = { title: "Forrest Gump", name: "Glenn Hysén" };
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (m:Movie {title: $props.title})
                CREATE (a:Actor {name: $props.name})
                MERGE (a)-[:ACTED_IN]->(m)
                `,
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        // Infer the schema
        const session = driver.session({ defaultAccessMode: neo4j.session.WRITE, bookmarks: bm, database: dbName });
        const schema = await inferSchema(session);
        await session.close();
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type Movie {
            	title: String!
            	actorActedIn: [Actor] @relationship(type: \\"ACTED_IN\\", direction: IN)
            }

            type Actor {
            	name: String!
            	actedInMovie: [Movie] @relationship(type: \\"ACTED_IN\\", direction: OUT)
            }"
        `);
    });
});
