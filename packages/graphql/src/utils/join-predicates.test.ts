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

import joinPredicates from "./join-predicates";
import trimmer from "./trimmer";

describe("join predicates", () => {
    describe("AND", () => {
        test("it should return a single predicate as-is", () => {
            expect(joinPredicates(["true"], "AND")).toBe(trimmer("true"));
        });

        test("it should join predicates and wrap them in parentheses", () => {
            expect(joinPredicates(["true", "false"], "AND")).toBe(trimmer("(true AND false)"));
        });

        test("it should work with an arbitrary number of predicates", () => {
            expect(joinPredicates(["yes", "no", "maybe"], "AND")).toBe(trimmer("(yes AND no AND maybe)"));
        });
    });

    describe("OR", () => {
        test("it should return a single predicate as-is", () => {
            expect(joinPredicates(["true"], "OR")).toBe(trimmer("true"));
        });

        test("it should wrap predicates in parentheses, then join, and wrap in outer parentheses", () => {
            expect(joinPredicates(["true", "false"], "OR")).toBe(trimmer("((true) OR (false))"));
        });

        test("it should work with an arbitrary number of predicates", () => {
            expect(joinPredicates(["yes", "no", "maybe"], "OR")).toBe(trimmer("((yes) OR (no) OR (maybe))"));
        });
    });
});
