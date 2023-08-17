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

describe("GraphQL - Infer Schema nodes basic tests", () => {
    const dbName = "introspectToNeo4jGrahqlTypeDefsITDb";
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
    test("Can introspect and generate single label with single property", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const nodeProperty = "testString";
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run("CREATE (:TestLabel {nodeProperty: $prop})", { prop: nodeProperty })
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type TestLabel {
            	nodeProperty: String!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Can introspect and generate single label with multiple properties of different types", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const nodeProperties = { str: "testString", int: neo4j.int(42), number: 80, strArr: ["Stella", "Molly"] };
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                "CREATE (:TestLabel {strProp: $props.str, intProp: $props.int, numberProp: $props.number, strArrProp: $props.strArr})",
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type TestLabel {
            	intProp: BigInt!
            	numberProp: Float!
            	strArrProp: [String]!
            	strProp: String!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Can introspect and generate multiple labels with multiple properties of different types", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const nodeProperties = { first: "testString", second: neo4j.int(42) };
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

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type TestLabel {
            	strProp: String!
            }

            type TestLabel2 {
            	singleProp: BigInt!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Can introspect and generate additional labels", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

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

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type TestLabel {
            	strProp: String!
            }

            type TestLabel2 @node(labels: [\\"TestLabel2\\", \\"TestLabel3\\"]) {
            	singleProp: BigInt!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Can introspect and generate label with unsupported characters in labels", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const nodeProperties = { first: "testString", second: neo4j.int(42) };
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                "CREATE (:`Test``Label` {strProp: $props.first}) CREATE (:`Test-Label` {singleProp: $props.second})",
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type Test_Label @node(labels: [\\"Test\`Label\\"]) {
            	strProp: String!
            }

            type Test_Label2 @node(labels: [\\"Test-Label\\"]) {
            	singleProp: BigInt!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("Can introspect and generate label that starts with a number", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) => tx.run("CREATE (:`2number` {prop: 1})"));
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type _2number @node(labels: [\\"2number\\"]) {
            	prop: BigInt!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Should not include properties with ambiguous types", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const nodeProperties = { str: "testString", int: neo4j.int(42) };
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (:FullNode {amb: $props.str, str: $props.str})
                CREATE (:FullNode {amb: $props.int, str: $props.str})
                CREATE (:OnlyAmb {amb: $props.str})
                CREATE (:OnlyAmb {amb: $props.int})
                `,
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type FullNode {
            	str: String!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Should not include types with no fields or no labels", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run("CREATE ({prop: 1}) CREATE ({prop: 2}) CREATE (:EmptyNode) CREATE (:FullNode {prop: 1})")
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type FullNode {
            	prop: BigInt!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Should include types with no prop fields but relationship fields", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) => tx.run("CREATE (:EmptyNode)-[:RELATIONSHIP]->(:FullNode {prop: 1})"));
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type EmptyNode {
            	relationshipFullNodes: [FullNode!]! @relationship(type: \\"RELATIONSHIP\\", direction: OUT)
            }

            type FullNode {
            	emptyNodesRelationship: [EmptyNode!]! @relationship(type: \\"RELATIONSHIP\\", direction: IN)
            	prop: BigInt!
            }"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
    test("Can generate a readonly typeDefs and combine directives", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

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

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm), true);

        expect(typeDefs).toMatchInlineSnapshot(`
            "type TestLabel {
            	strProp: String!
            }

            type TestLabel2 @node(labels: [\\"TestLabel2\\", \\"TestLabel3\\"]) {
            	singleProp: BigInt!
            }

            extend schema @mutation(operations: [])"
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
});
