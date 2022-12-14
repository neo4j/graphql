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

import Cypher from ".";
import { CypherEnvironment } from "./Environment";
import { Pattern } from "./Pattern";

describe("Pattern", () => {
    let env: CypherEnvironment;

    beforeEach(() => {
        env = new CypherEnvironment();
    });
    describe("Node", () => {
        test("Simple node", () => {
            const node = new Cypher.Node({ labels: ["TestLabel"] });
            const pattern = new Pattern(node, { source: { labels: false } });

            expect(pattern.getCypher(env)).toMatchInlineSnapshot(`"(this0)"`);
        });

        test("Simple node with default values", () => {
            const node = new Cypher.Node({ labels: ["TestLabel"] });
            const pattern = new Pattern(node);

            expect(pattern.getCypher(env)).toMatchInlineSnapshot(`"(this0:\`TestLabel\`)"`);
        });

        test("Node with parameters", () => {
            const node = new Cypher.Node({ labels: ["TestLabel"] });
            const pattern = new Pattern(node, { source: { labels: false } }).withParams({
                name: new Cypher.Param("test"),
                age: new Cypher.Param(123),
            });
            expect(pattern.getCypher(env)).toMatchInlineSnapshot(`"(this0 { name: $param0, age: $param1 })"`);
        });

        test("Node with parameters and labels", () => {
            const node = new Cypher.Node({ labels: ["TestLabel"] });
            const pattern = new Pattern(node).withParams({
                name: new Cypher.Param("test"),
                age: new Cypher.Param(123),
            });

            expect(pattern.getCypher(env)).toMatchInlineSnapshot(
                `"(this0:\`TestLabel\` { name: $param0, age: $param1 })"`
            );
        });
    });

    describe("Relationship", () => {
        test("Simple relationship", () => {
            const node1 = new Cypher.Node({ labels: ["Actor"] });
            const node2 = new Cypher.Node({ labels: ["Movie"] });
            const relationship = new Cypher.Relationship({ source: node1, target: node2, type: "ACTED_IN" });
            const pattern = new Pattern(relationship, {
                source: { labels: false },
                relationship: { type: false },
                target: { labels: false },
            });

            expect(pattern.getCypher(env)).toMatchInlineSnapshot(`"(this1)-[this0]->(this2)"`);
        });

        test("Simple relationship with default values", () => {
            const node1 = new Cypher.Node({ labels: ["Actor"] });
            const node2 = new Cypher.Node({ labels: ["Movie"] });
            const relationship = new Cypher.Relationship({ source: node1, target: node2, type: "ACTED_IN" });
            const pattern = new Pattern(relationship);

            expect(pattern.getCypher(env)).toMatchInlineSnapshot(
                `"(this1:\`Actor\`)-[this0:ACTED_IN]->(this2:\`Movie\`)"`
            );
        });

        test("Relationship with parameters", () => {
            const node1 = new Cypher.Node({ labels: ["Actor"] });
            const node2 = new Cypher.Node({ labels: ["Movie"] });
            const relationship = new Cypher.Relationship({ source: node1, target: node2, type: "ACTED_IN" });
            const pattern = new Pattern(relationship, {
                source: { labels: false },
                target: { labels: false },
            }).withParams({
                source: { name: new Cypher.Param("test") },
                relationship: {
                    value: new Cypher.Param("test"),
                },
                target: {
                    name: new Cypher.Param("test2"),
                },
            });

            expect(pattern.getCypher(env)).toMatchInlineSnapshot(
                `"(this1 { name: $param1 })-[this0:ACTED_IN { value: $param0 }]->(this2 { name: $param2 })"`
            );
        });
    });
});
