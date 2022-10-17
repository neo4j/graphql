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

import { Cypher } from "../Cypher";
import { TestClause } from "../utils/TestClause";

describe("Literal", () => {
    it("Serialize string value", () => {
        const stringLiteral = new CypherBuilder.Literal("hello");

        const testClause = new TestClause(stringLiteral);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"\\"hello\\""`);
    });

    it("Serialize boolean value", () => {
        const booleanLiteral = new CypherBuilder.Literal(true);

        const testClause = new TestClause(booleanLiteral);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"true"`);
    });

    it("Serialize number value", () => {
        const numberLiteral = new CypherBuilder.Literal(5);

        const testClause = new TestClause(numberLiteral);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"5"`);
    });

    it("Serialize array", () => {
        const literal = new CypherBuilder.Literal(["hello", 5, "hello"]);

        const testClause = new TestClause(literal);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"[\\"hello\\", 5, \\"hello\\"]"`);
    });

    it("Serialize null", () => {
        const literal = new CypherBuilder.Literal(null);

        const testClause = new TestClause(literal);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"NULL"`);
    });

    it("Null constant literal", () => {
        const testClause = new TestClause(CypherBuilder.Null);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"NULL"`);
    });
});
