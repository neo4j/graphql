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

import * as CypherBuilder from "../../CypherBuilder";
import { TestClause } from "../../utils/TestClause";

describe("List comprehension", () => {
    test("comprehension without filter", () => {
        const variable = new CypherBuilder.Variable();
        const exprVariable = new CypherBuilder.Param([1, 2, 5]);

        const listComprehension = new CypherBuilder.ListComprehension(variable, exprVariable);

        const queryResult = new TestClause(listComprehension).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"[var0 IN $param0]"`);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": Array [
                1,
                2,
                5,
              ],
            }
        `);
    });

    test("comprehension with filter", () => {
        const variable = new CypherBuilder.Variable();
        const exprVariable = new CypherBuilder.Param([1, 2, 5]);
        const andExpr = CypherBuilder.eq(variable, new CypherBuilder.Param(5));

        const listComprehension = new CypherBuilder.ListComprehension(variable, exprVariable).where(andExpr);

        const queryResult = new TestClause(listComprehension).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"[var0 IN $param1 WHERE var0 = $param0]"`);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 5,
              "param1": Array [
                1,
                2,
                5,
              ],
            }
        `);
    });
});
