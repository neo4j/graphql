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

import Cypher, { Param } from "..";
import { TestClause } from "../utils/TestClause";

describe("Patterns", () => {
    describe("node", () => {
        test("Simple node", () => {
            const node = new Cypher.Node({ labels: ["TestLabel"] });

            const pattern = new Cypher.Pattern(node).withoutLabels();
            const queryResult = new TestClause(pattern).build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)"`);
            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("Simple node with default values", () => {
            const node = new Cypher.Node({ labels: ["TestLabel"] });

            const pattern = new Cypher.Pattern(node);
            const queryResult = new TestClause(pattern).build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0:\`TestLabel\`)"`);
            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("Node with parameters and labels", () => {
            const node = new Cypher.Node({ labels: ["TestLabel"] });

            const pattern = new Cypher.Pattern(node).withProperties({ name: new Cypher.Param("test") });
            const queryResult = new TestClause(pattern).build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0:\`TestLabel\` { name: $param0 })"`);
            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "test",
                }
            `);
        });
    });

    describe("relationships", () => {
        test("Simple relationship Pattern", () => {
            const a = new Cypher.Node();
            const b = new Cypher.Node();
            const rel = new Cypher.Relationship({
                type: "ACTED_IN",
            });

            const query = new TestClause(new Cypher.Pattern(a).related(rel).to(b));
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1:\`ACTED_IN\`]->(this2)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("Simple relationship Pattern without parameters", () => {
            const a = new Cypher.Node();

            const query = new TestClause(new Cypher.Pattern(a).related().to());
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1]->(this2)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("Simple Pattern with properties", () => {
            const a = new Cypher.Node({
                labels: ["Person", "Actor"],
            });

            const aProperties = {
                name: new Cypher.Param("Arthur"),
                surname: new Cypher.Param("Dent"),
            };
            const b = new Cypher.Node();
            const rel = new Cypher.Relationship({
                type: "ACTED_IN",
            });

            const query = new TestClause(
                new Cypher.Pattern(a)
                    .withProperties(aProperties)
                    .related(rel)
                    .withProperties({ roles: new Cypher.Param(["neo"]) })
                    .to(b)
            );
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(
                `"(this0:\`Person\`:\`Actor\` { name: $param0, surname: $param1 })-[this1:\`ACTED_IN\` { roles: $param2 }]->(this2)"`
            );

            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "Arthur",
                  "param1": "Dent",
                  "param2": Array [
                    "neo",
                  ],
                }
            `);
        });

        test("Long relationship Pattern", () => {
            const a = new Cypher.Node();
            const b = new Cypher.Node();
            const c = new Cypher.Node({ labels: ["TestLabel"] });

            const rel1 = new Cypher.Relationship({
                type: "ACTED_IN",
            });
            const rel2 = new Cypher.Relationship({
                type: "ACTED_IN",
            });

            const query = new TestClause(new Cypher.Pattern(a).related(rel1).to(b).related(rel2).to(c));
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(
                `"(this0)-[this1:\`ACTED_IN\`]->(this2)-[this3:\`ACTED_IN\`]->(this4:\`TestLabel\`)"`
            );

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });
    });

    describe("variable length", () => {
        const a = new Cypher.Node();
        const b = new Cypher.Node();
        const actedInRelationship = new Cypher.Relationship({ type: "ACTED_IN" });

        test("variable length with exact value", () => {
            const query = new TestClause(new Cypher.Pattern(a).related(actedInRelationship).withLength(2).to(b));
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1:\`ACTED_IN\`*2]->(this2)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("variable length with *", () => {
            const query = new TestClause(new Cypher.Pattern(a).related(actedInRelationship).withLength("*").to(b));
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1:\`ACTED_IN\`*]->(this2)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("variable length with max only", () => {
            const query = new TestClause(
                new Cypher.Pattern(a).related(actedInRelationship).withLength({ max: 2 }).to(b)
            );
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1:\`ACTED_IN\`*..2]->(this2)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("variable length with min only", () => {
            const query = new TestClause(
                new Cypher.Pattern(a).related(actedInRelationship).withLength({ min: 2 }).to(b)
            );
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1:\`ACTED_IN\`*2..]->(this2)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("variable length with min and max", () => {
            const query = new TestClause(
                new Cypher.Pattern(a).related(actedInRelationship).withLength({ min: 2, max: 4 }).to(b)
            );
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[this1:\`ACTED_IN\`*2..4]->(this2)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("variable length with exact value and properties", () => {
            const query = new TestClause(
                new Cypher.Pattern(a)
                    .related(actedInRelationship)
                    .withProperties({
                        value: new Param(100),
                    })
                    .withLength(2)
                    .to(b)
            );
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(
                `"(this0)-[this1:\`ACTED_IN\`*2 { value: $param0 }]->(this2)"`
            );

            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": 100,
                }
            `);
        });

        test("variable length with empty relationship", () => {
            const query = new TestClause(new Cypher.Pattern(a).related().withoutVariable().withLength(2).to(b));
            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0)-[*2]->(this1)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });
    });
});
