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
import { toGraphQLTypeDefs } from "../../../src/index";
import createDriver from "../neo4j";

describe("GraphQL - Infer Schema nodes basic tests", () => {
    const dbName = "inferToNeo4jGrahqlTypeDefsITDb";
    let driver: neo4j.Driver;
    const sessionFactory = (bm: string[]) => () =>
        driver.session({ defaultAccessMode: neo4j.session.READ, bookmarks: bm, database: dbName });

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
        const schema = await toGraphQLTypeDefs(sessionFactory(bm));
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
        const schema = await toGraphQLTypeDefs(sessionFactory(bm));
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type TestLabel {
            	intProp: BigInt!
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
        const schema = await toGraphQLTypeDefs(sessionFactory(bm));
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type TestLabel {
            	strProp: String!
            }

            type TestLabel2 {
            	singleProp: BigInt!
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
        const schema = await toGraphQLTypeDefs(sessionFactory(bm));
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type TestLabel {
            	strProp: String!
            }

            type TestLabel2 @node(additonalLabels: [\\"TestLabel3\\"]) {
            	singleProp: BigInt!
            }"
        `);
    });
    test("Can infer label with unsupported characters in labels", async () => {
        const nodeProperties = { first: "testString", second: neo4j.int(42) };
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                "CREATE (:`Test``Label` {strProp: $props.first}) CREATE (:`Test-Label` {singleProp: $props.second})",
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        // Infer the schema
        const schema = await toGraphQLTypeDefs(sessionFactory(bm));
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type Test_Label2 @node(label: \\"Test-Label\\") {
            	singleProp: BigInt!
            }

            type Test_Label @node(label: \\"Test\`Label\\") {
            	strProp: String!
            }"
        `);
    });
    test("Should not include properties with ambiguous types", async () => {
        const nodeProperties = { str: "testString", int: neo4j.int(42) };
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (:Node {amb: $props.str, str: $props.str}) 
                CREATE (:Node {amb: $props.int, str: $props.str})
                CREATE (:OnlyAmb {amb: $props.str})
                CREATE (:OnlyAmb {amb: $props.int})
                `,
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        // Infer the schema
        const schema = await toGraphQLTypeDefs(sessionFactory(bm));
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type Node {
            	str: String!
            }"
        `);
    });
    test("Should not include types with no fields", async () => {
        // Create some data
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) => tx.run("CREATE (:EmptyNode) CREATE (:Node {prop: 1})"));
        const bm = wSession.lastBookmark();
        await wSession.close();

        // Infer the schema
        const schema = await toGraphQLTypeDefs(sessionFactory(bm));
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type Node {
            	prop: BigInt!
            }"
        `);
    });
    test("Can generate a readonly schema and combine directives", async () => {
        // Create some data
        const nodeProperties = { first: "testString", second: neo4j.int(42) };
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
        const schema = await toGraphQLTypeDefs(sessionFactory(bm), true);
        // Then
        expect(schema).toMatchInlineSnapshot(`
            "type TestLabel @exclude(operations[CREATE, DELETE, UPDATE]) {
            	strProp: String!
            }

            type TestLabel2 @node(additonalLabels: [\\"TestLabel3\\"]) @exclude(operations[CREATE, DELETE, UPDATE]) {
            	singleProp: BigInt!
            }"
        `);
    });
});
