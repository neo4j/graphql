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

import * as CypherBuilder from "./CypherBuilder";
import { CypherContext } from "./CypherContext";
import { MatchPattern } from "./MatchPattern";

describe("MatchPattern", () => {
    let context: CypherContext;

    beforeEach(() => {
        context = new CypherContext();
    });
    describe("Node", () => {
        test("Simple node", () => {
            const node = new CypherBuilder.Node({ labels: ["TestLabel"] });
            const pattern = new MatchPattern(node, { labels: false });

            expect(pattern.getCypher(context)).toBe(`(this0)`);
        });

        test("Simple node with labels", () => {
            const node = new CypherBuilder.Node({ labels: ["TestLabel"] });
            const pattern = new MatchPattern(node);

            expect(pattern.getCypher(context)).toBe(`(this0:\`TestLabel\`)`);
        });

        test("Node with parameters", () => {
            const node = new CypherBuilder.Node({ labels: ["TestLabel"] });
            const pattern = new MatchPattern(node, { labels: false }).withParams({
                name: new CypherBuilder.Param("test"),
                age: new CypherBuilder.Param(123),
            });

            expect(pattern.getCypher(context)).toBe(`(this0 { name: $param0, age: $param1 })`);
        });

        test("Node with parameters and labels", () => {
            const node = new CypherBuilder.Node({ labels: ["TestLabel"] });
            const pattern = new MatchPattern(node).withParams({
                name: new CypherBuilder.Param("test"),
                age: new CypherBuilder.Param(123),
            });

            expect(pattern.getCypher(context)).toBe(`(this0:\`TestLabel\` { name: $param0, age: $param1 })`);
        });
    });

    describe("Relationship", () => {
        test("Simple relationship", () => {
            const node1 = new CypherBuilder.Node({ labels: ["Actor"] });
            const node2 = new CypherBuilder.Node({ labels: ["Movie"] });
            const relationship = new CypherBuilder.Relationship({ source: node1, target: node2, type: "ACTED_IN" });
            const pattern = new MatchPattern(relationship, { labels: false, relationshipTypes: false });

            expect(pattern.getCypher(context)).toBe(`(this1)-[this0]->(this2)`);
        });

        test("Simple relationship with labels", () => {
            const node1 = new CypherBuilder.Node({ labels: ["Actor"] });
            const node2 = new CypherBuilder.Node({ labels: ["Movie"] });
            const relationship = new CypherBuilder.Relationship({ source: node1, target: node2, type: "ACTED_IN" });
            const pattern = new MatchPattern(relationship);

            expect(pattern.getCypher(context)).toBe(`(this1:\`Actor\`)-[this0:\`ACTED_IN\`]->(this2:\`Movie\`)`);
        });

        test("Relationship with parameters", () => {
            const node1 = new CypherBuilder.Node({ labels: ["Actor"] });
            const node2 = new CypherBuilder.Node({ labels: ["Movie"] });
            const relationship = new CypherBuilder.Relationship({ source: node1, target: node2, type: "ACTED_IN" });
            const pattern = new MatchPattern(relationship, { labels: false }).withParams({
                source: { name: new CypherBuilder.Param("test") },
                relationship: {
                    value: new CypherBuilder.Param("test"),
                },
                target: {
                    name: new CypherBuilder.Param("test2"),
                },
            });

            expect(pattern.getCypher(context)).toBe(
                `(this1 { name: $param0 })-[this0:\`ACTED_IN\` { value: $param1 }]->(this2 { name: $param2 })`
            );
        });
    });
});
