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

import * as Cypher from "../CypherBuilder";

describe("CypherBuilder With", () => {
    test("With *", () => {
        const withQuery = new Cypher.With("*");

        const queryResult = withQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"WITH *"`);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("With nodes", () => {
        const node = new Cypher.Node({
            labels: ["Movie"],
        });
        const withQuery = new Cypher.With(node);

        const queryResult = withQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"WITH this0"`);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("With multiple variables", () => {
        const node = new Cypher.Node({
            labels: ["Movie"],
        });
        const variable = new Cypher.Variable();
        const param = new Cypher.Param("Matrix");

        const withQuery = new Cypher.With(node, variable, param);

        const queryResult = withQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"WITH this0, var1, $param0"`);
        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "Matrix",
            }
        `);
    });

    describe("With alias", () => {
        test("With variable aliased", () => {
            const node = new Cypher.Node({
                labels: ["Movie"],
            });
            const alias = new Cypher.Variable();
            const withQuery = new Cypher.With([node, alias]);

            const queryResult = withQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"WITH this0 AS var1"`);
            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("With expression aliased", () => {
            const expr = Cypher.plus(new Cypher.Param("The "), new Cypher.Param("Matrix"));
            const alias = new Cypher.Variable();
            const withQuery = new Cypher.With([expr, alias]);

            const queryResult = withQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"WITH $param0 + $param1 AS var0"`);
            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "The ",
                  "param1": "Matrix",
                }
            `);
        });
    });
});
