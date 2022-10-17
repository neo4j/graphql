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

import { TestClause } from "../../utils/TestClause";
import * as CypherBuilder from "../..";

describe("Pattern comprehension", () => {
    test("comprehension with filter", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });
        const andExpr = CypherBuilder.eq(node.property("released"), new CypherBuilder.Param(1999));

        const comprehension = new CypherBuilder.PatternComprehension(node.pattern(), andExpr);

        const queryResult = new TestClause(comprehension).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"[(this0:\`Movie\`) | this0.released = $param0]"`);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 1999,
            }
        `);
    });

    test("comprehension without filter", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });

        const comprehension = new CypherBuilder.PatternComprehension(node.pattern());

        const queryResult = new TestClause(comprehension).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"[(this0:\`Movie\`)]"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
