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

describe("Property", () => {
    it("Serialize string property", () => {
        const variable = new Cypher.Variable();
        const property = variable.property("myProperty");

        const testClause = new TestClause(property);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0.myProperty"`);
    });

    it("Serialize nested string property", () => {
        const variable = new Cypher.Variable();
        const property = variable.property("myProperty").property("myNestedValue");

        const testClause = new TestClause(property);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0.myProperty.myNestedValue"`);
    });

    it("Nested properties should not modify parent prop", () => {
        const variable = new Cypher.Variable();
        const property = variable.property("myProperty");
        const nestedProp = property.property("myNestedValue");

        const testClause1 = new TestClause(property);
        const testClause2 = new TestClause(nestedProp);

        const queryResult = testClause1.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0.myProperty"`);

        const queryResult2 = testClause2.build();
        expect(queryResult2.cypher).toMatchInlineSnapshot(`"var0.myProperty.myNestedValue"`);
    });

    describe("Expression", () => {
        it("Serialize expression with []", () => {
            const variable = new Cypher.Variable();

            const expr = Cypher.date();
            const property = variable.property(expr);

            const testClause = new TestClause(property);

            const queryResult = testClause.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"var0[date()]"`);
        });

        it("Serialize nested expression with []", () => {
            const variable = new Cypher.Variable();

            const expr = Cypher.date();
            const expr2 = new Cypher.Literal("Hello");
            const property = variable.property(expr).property(expr2);

            const testClause = new TestClause(property);

            const queryResult = testClause.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"var0[date()][\\"Hello\\"]"`);
        });

        it("Serialize nested string after expression", () => {
            const variable = new Cypher.Variable();

            const expr = Cypher.date();
            const property = variable.property(expr);

            const testClause = new TestClause(property);

            const queryResult = testClause.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"var0[date()]"`);
        });

        it("Serialize nested expression after string expression", () => {
            const variable = new Cypher.Variable();

            const expr = Cypher.date();
            const property = variable.property(expr);

            const testClause = new TestClause(property);

            const queryResult = testClause.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`"var0[date()]"`);
        });
    });
});
