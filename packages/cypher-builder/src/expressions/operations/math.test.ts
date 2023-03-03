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

import Cypher from "../..";
import { TestClause } from "../../utils/TestClause";

describe("math operators", () => {
    const literal1 = new Cypher.Literal(4);
    const literal2 = new Cypher.Literal(3);

    test("unary plus", () => {
        const plus = Cypher.plus(literal1);
        const { cypher } = new TestClause(plus).build();
        expect(cypher).toMatchInlineSnapshot(`"+4"`);
    });

    test("unary minus", () => {
        const minus = Cypher.minus(literal1);
        const { cypher } = new TestClause(minus).build();
        expect(cypher).toMatchInlineSnapshot(`"-4"`);
    });

    test("add", () => {
        const add = Cypher.add(literal1, literal2);
        const { cypher } = new TestClause(add).build();
        expect(cypher).toMatchInlineSnapshot(`"4 + 3"`);
    });

    test("subtract", () => {
        const subtract = Cypher.subtract(literal1, literal2);
        const { cypher } = new TestClause(subtract).build();
        expect(cypher).toMatchInlineSnapshot(`"4 - 3"`);
    });

    test("divide", () => {
        const divide = Cypher.divide(literal1, literal2);
        const { cypher } = new TestClause(divide).build();
        expect(cypher).toMatchInlineSnapshot(`"4 / 3"`);
    });

    test("multiply", () => {
        const multiply = Cypher.multiply(literal1, literal2);
        const { cypher } = new TestClause(multiply).build();
        expect(cypher).toMatchInlineSnapshot(`"4 * 3"`);
    });

    test("remainder", () => {
        const remainder = Cypher.remainder(literal1, literal2);
        const { cypher } = new TestClause(remainder).build();
        expect(cypher).toMatchInlineSnapshot(`"4 % 3"`);
    });

    test("pow", () => {
        const pow = Cypher.pow(literal1, literal2);
        const { cypher } = new TestClause(pow).build();
        expect(cypher).toMatchInlineSnapshot(`"4 ^ 3"`);
    });
});
