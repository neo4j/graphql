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

describe("Infer Schema nodes basic tests", () => {
    const dbName = "inferSchemaITDb";
    let driver: neo4j.Driver;
    beforeAll(async () => {
        driver = await createDriver();
        const cSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            await cSession.writeTransaction((tx) => tx.run(`CREATE DATABASE ${dbName}`));
        } catch (e) {
            console.log(e);
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
            console.log(e);
        }
        await driver.close();
    });
    test("Can infer single label with single property", async () => {
        const nodeProperty = "testString";
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run("CREATE (:TestLabel {nodeProperty: $prop})", { prop: nodeProperty })
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        // Infer the schema
        const session = driver.session({ defaultAccessMode: neo4j.session.WRITE, bookmarks: bm, database: dbName });
        const schema = await inferSchema(session);
        await session.close();
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type TestLabel {
            	nodeProperty: String!
            }"
        `);
    });
    test("Can infer single label with multiple properties of different types", async () => {
        const nodeProperties = { str: "testString", int: neo4j.int(42), number: 80, strArr: ["Stella", "Molly"] };
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                "CREATE (:TestLabel {strProp: $props.str, intProp: $props.int, numberProp: $props.number, strArrProp: $props.strArr})",
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
            "type TestLabel {
            	intProp: Int!
            	numberProp: Float!
            	strArrProp: [String]!
            	strProp: String!
            }"
        `);
    });
    test("Can infer multiple labels with multiple properties of different types", async () => {
        const nodeProperties = { first: "testString", second: neo4j.int(42) };
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (:TestLabel {strProp: $props.first})
                CREATE (:TestLabel2 {singleProp: $props.second})`,
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
            "type TestLabel2 {
            	singleProp: Int!
            }

            type TestLabel {
            	strProp: String!
            }"
        `);
    });
    test("Can infer additional labels", async () => {
        const nodeProperties = { first: "testString", second: neo4j.int(42) };
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (:TestLabel {strProp: $props.first})
                CREATE (:TestLabel2:TestLabel3 {singleProp: $props.second})`,
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
            "type TestLabel2 @node(additonalLabels: [\\"TestLabel3\\"]) {
            	singleProp: Int!
            }

            type TestLabel {
            	strProp: String!
            }"
        `);
    });
});
