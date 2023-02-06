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

import Cypher from "..";
import { TestClause } from "../utils/TestClause";

describe("RelationshipRef", () => {
    it("Create relationship from node", () => {
        const node1 = new Cypher.Node({
            labels: ["Actor"],
        });

        const node2 = new Cypher.Node({ labels: ["Movie"] });

        const actedIn = node1.related(new Cypher.Relationship({ type: "ACTED_IN" })).to(node2);
        const testClause = new TestClause(actedIn);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"(this0:\`Actor\`)-[this1:\`ACTED_IN\`]->(this2:\`Movie\`)"`);
    });
});
