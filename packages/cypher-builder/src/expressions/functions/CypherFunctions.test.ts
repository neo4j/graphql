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
import * as CypherBuilder from "../../Cypher";

describe("Functions", () => {
    test("coalesce", () => {
        const testParam = new CypherBuilder.Param("Hello");
        const nullParam = CypherBuilder.Null;
        const literal = new CypherBuilder.Literal("arthur");

        const coalesceFunction = CypherBuilder.coalesce(nullParam, testParam, literal);
        const queryResult = new TestClause(coalesceFunction).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"coalesce(NULL, $param0, \\"arthur\\")"`);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "Hello",
            }
        `);
    });

    test("cypherDatetime", () => {
        const datetimeFn = CypherBuilder.datetime();
        const queryResult = new TestClause(datetimeFn).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"datetime()"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
