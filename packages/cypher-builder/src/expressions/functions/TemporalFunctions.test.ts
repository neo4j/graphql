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
import Cypher from "../..";

describe("Functions", () => {
    describe("date()", () => {
        test("date without parameters", () => {
            const dateFunction = Cypher.date();
            const queryResult = new TestClause(dateFunction).build();

            expect(queryResult.cypher).toMatchInlineSnapshot(`"date()"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("date with timezone string parameter", () => {
            const dateFunction = Cypher.date(new Cypher.Param("9999-01-01"));
            const queryResult = new TestClause(dateFunction).build();

            expect(queryResult.cypher).toMatchInlineSnapshot(`"date($param0)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "9999-01-01",
                }
            `);
        });

        test("date with timezone string literal", () => {
            const dateFunction = Cypher.date(new Cypher.Literal("9999-01-01"));
            const queryResult = new TestClause(dateFunction).build();

            expect(queryResult.cypher).toMatchInlineSnapshot(`"date(\\"9999-01-01\\")"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("date with timezone object", () => {
            const dateFunction = Cypher.date(new Cypher.Map({ timezone: new Cypher.Literal("America/Los Angeles") }));
            const queryResult = new TestClause(dateFunction).build();

            expect(queryResult.cypher).toMatchInlineSnapshot(`"date({ timezone: \\"America/Los Angeles\\" })"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });
    });

    describe("datetime()", () => {
        test("datetime without params", () => {
            const datetimeFn = Cypher.datetime();
            const queryResult = new TestClause(datetimeFn).build();

            expect(queryResult.cypher).toMatchInlineSnapshot(`"datetime()"`);

            expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
        });

        test("datetime with params", () => {
            const datetimeFn = Cypher.datetime(new Cypher.Param("9999-01-10"));
            const queryResult = new TestClause(datetimeFn).build();

            expect(queryResult.cypher).toMatchInlineSnapshot(`"datetime($param0)"`);

            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "9999-01-10",
                }
            `);
        });
    });
});
