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

import { TestClause } from "../utils/TestClause";
import * as CypherBuilder from "../CypherBuilder";

describe("Case", () => {
    test("case ... then ... else with comparator", () => {
        const testParam = new CypherBuilder.Param("Hello");

        const caseClause = new CypherBuilder.Case(testParam)
            .when(new CypherBuilder.Literal("Hello"))
            .then(new CypherBuilder.Literal(true));

        caseClause.else(new CypherBuilder.Literal(false));

        const queryResult = new TestClause(caseClause).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CASE $param0
                WHEN \\"Hello\\" THEN true
                ELSE false
            END"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "Hello",
            }
        `);
    });

    test("generic case ... then ... else without comparator", () => {
        const testParam = new CypherBuilder.Param("Hello");

        const caseClause = new CypherBuilder.Case()
            .when(CypherBuilder.eq(new CypherBuilder.Literal("Hello"), testParam))
            .then(new CypherBuilder.Literal(true));

        caseClause.else(new CypherBuilder.Literal(false));

        const queryResult = new TestClause(caseClause).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CASE
                WHEN \\"Hello\\" = $param0 THEN true
                ELSE false
            END"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "Hello",
            }
        `);
    });
});
