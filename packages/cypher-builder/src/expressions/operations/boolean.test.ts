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

describe("boolean operations", () => {
    const predicate1 = Cypher.coalesce(new Cypher.Variable());
    const predicate2 = Cypher.max(new Cypher.Variable());
    const predicate3 = Cypher.min(new Cypher.Variable());

    describe("and", () => {
        test("and operation with 2 predicates", () => {
            const and = Cypher.and(predicate1, predicate2);
            const { cypher } = new TestClause(and).build();
            expect(cypher).toMatchInlineSnapshot(`"(coalesce(var0) AND max(var1))"`);
        });

        test("and operation with single predicates", () => {
            const and = Cypher.and(predicate1);
            const { cypher } = new TestClause(and).build();
            expect(cypher).toMatchInlineSnapshot(`"coalesce(var0)"`);
        });

        test("and operation with three predicates", () => {
            const and = Cypher.and(predicate1, predicate2, predicate3);
            const { cypher } = new TestClause(and).build();
            expect(cypher).toMatchInlineSnapshot(`"(coalesce(var0) AND max(var1) AND min(var2))"`);
        });

        test("and operation without parameters", () => {
            const and = Cypher.and();
            expect(and).toBeUndefined();
        });

        test("and operation with undefined", () => {
            const and = Cypher.and(undefined, undefined);
            expect(and).toBeUndefined();
        });
    });
    describe("not", () => {
        test("not operation with simple predicate", () => {
            const not = Cypher.not(predicate1);
            const { cypher } = new TestClause(not).build();
            expect(cypher).toMatchInlineSnapshot(`"NOT (coalesce(var0))"`);
        });
        test("nested not operation with single predicates", () => {
            const yes = Cypher.not(Cypher.not(predicate1));
            const { cypher } = new TestClause(yes).build();
            expect(cypher).toMatchInlineSnapshot(`"NOT (NOT (coalesce(var0)))"`);
        });
    });
    describe("or", () => {
        test("or operation with 2 predicates", () => {
            const or = Cypher.or(predicate1, predicate2);
            const { cypher } = new TestClause(or).build();
            expect(cypher).toMatchInlineSnapshot(`"(coalesce(var0) OR max(var1))"`);
        });

        test("or operation with single predicates", () => {
            const or = Cypher.or(predicate1);
            const { cypher } = new TestClause(or).build();
            expect(cypher).toMatchInlineSnapshot(`"coalesce(var0)"`);
        });

        test("or operation with three predicates", () => {
            const or = Cypher.or(predicate1, predicate2, predicate3);
            const { cypher } = new TestClause(or).build();
            expect(cypher).toMatchInlineSnapshot(`"(coalesce(var0) OR max(var1) OR min(var2))"`);
        });

        test("or operation without parameters", () => {
            const or = Cypher.or();
            expect(or).toBeUndefined();
        });

        test("or operation with undefined", () => {
            const or = Cypher.or(undefined, undefined);
            expect(or).toBeUndefined();
        });
    });
    describe("xor", () => {
        test("xor operation with 2 predicates", () => {
            const xor = Cypher.xor(predicate1, predicate2);
            const { cypher } = new TestClause(xor).build();
            expect(cypher).toMatchInlineSnapshot(`"(coalesce(var0) XOR max(var1))"`);
        });

        test("xor operation with single predicates", () => {
            const xor = Cypher.xor(predicate1);
            const { cypher } = new TestClause(xor).build();
            expect(cypher).toMatchInlineSnapshot(`"coalesce(var0)"`);
        });

        test("xor operation with three predicates", () => {
            const xor = Cypher.xor(predicate1, predicate2, predicate3);
            const { cypher } = new TestClause(xor).build();
            expect(cypher).toMatchInlineSnapshot(`"(coalesce(var0) XOR max(var1) XOR min(var2))"`);
        });

        test("xor operation without parameters", () => {
            const xor = Cypher.xor();
            expect(xor).toBeUndefined();
        });

        test("xor operation with undefined", () => {
            const xor = Cypher.xor(undefined, undefined);
            expect(xor).toBeUndefined();
        });
    });
});
