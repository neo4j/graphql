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
    test("Match node with mathematical operator", () => {
        const yearParam = new Cypher.Param(2000);
        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });
        const matchQuery = new Cypher.Match(movieNode)
            .where(Cypher.eq(movieNode.property("released"), Cypher.plus(new Cypher.Literal(10), yearParam)))
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                  "MATCH (this0:\`Movie\`)
                  WHERE this0.released = 10 + $param0
                  RETURN this0"
              `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                  Object {
                    "param0": 2000,
                  }
              `);
    });

    test("plus", () => {
        const add = Cypher.plus(new Cypher.Literal(10), new Cypher.Literal(3));
        const { cypher } = new TestClause(add).build();
        expect(cypher).toMatchInlineSnapshot(`"10 + 3"`);
    });

    test("minus", () => {
        const subtract = Cypher.minus(new Cypher.Literal(10), new Cypher.Literal(3));
        const { cypher } = new TestClause(subtract).build();
        expect(cypher).toMatchInlineSnapshot(`"10 - 3"`);
    });

    test("divide", () => {
        const divide = Cypher.divide(new Cypher.Literal(10), new Cypher.Literal(3));
        const { cypher } = new TestClause(divide).build();
        expect(cypher).toMatchInlineSnapshot(`"10 / 3"`);
    });

    test("multiply", () => {
        const multiply = Cypher.multiply(new Cypher.Literal(10), new Cypher.Literal(3));
        const { cypher } = new TestClause(multiply).build();
        expect(cypher).toMatchInlineSnapshot(`"10 * 3"`);
    });

    test("mod", () => {
        const mod = Cypher.mod(new Cypher.Literal(10), new Cypher.Literal(3));
        const { cypher } = new TestClause(mod).build();
        expect(cypher).toMatchInlineSnapshot(`"10 % 3"`);
    });

    test("pow", () => {
        const pow = Cypher.pow(new Cypher.Literal(10), new Cypher.Literal(3));
        const { cypher } = new TestClause(pow).build();
        expect(cypher).toMatchInlineSnapshot(`"10 ^ 3"`);
    });

    test("complex expression", () => {
        const add = Cypher.plus(new Cypher.Literal(10), new Cypher.Literal(3), new Cypher.Literal(5));
        const minus = Cypher.minus(add, new Cypher.Literal(3));
        const divide = Cypher.divide(minus, new Cypher.Literal(2));
        const multiply = Cypher.multiply(divide, new Cypher.Literal(3));
        const pow = Cypher.pow(multiply, new Cypher.Literal(3));
        const { cypher } = new TestClause(pow).build();
        expect(cypher).toMatchInlineSnapshot(`"10 + 3 + 5 - 3 / 2 * 3 ^ 3"`);
    });
});
