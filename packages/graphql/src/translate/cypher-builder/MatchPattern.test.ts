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

    test("Node", () => {
        const node = new CypherBuilder.Node({ labels: ["TestLabel"] });
        const pattern = new MatchPattern(node);

        expect(pattern.getCypher(context)).toBe(`(this0:\`TestLabel\`)`);
    });

    test("Relationship", () => {
        const node1 = new CypherBuilder.Node({ labels: ["Actor"] });
        const node2 = new CypherBuilder.Node({ labels: ["Movie"] });
        const relationship = new CypherBuilder.Relationship({ source: node1, target: node2, type: "ACTED_IN" });
        const pattern = new MatchPattern(relationship);

        expect(pattern.getCypher(context)).toBe(`(this1)-[this0:\`ACTED_IN\`]->(this2)`);
    });
});
