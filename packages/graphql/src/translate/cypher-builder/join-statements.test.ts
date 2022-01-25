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

import { CypherStatement } from "../types";
import { joinStatements } from "./join-statements";

describe("translation utils", () => {
    test("empty array", () => {
        const result = joinStatements([]);

        expect(result).toEqual(["", {}]);
    });

    test("join multiple statements and strings", () => {
        const statements = [["Hello", { text1: "Hello" }], ["World", { text2: "World" }], "!"] as Array<
            CypherStatement | string
        >;
        const result = joinStatements(statements);

        expect(result).toEqual([
            "Hello\nWorld\n!",
            {
                text1: "Hello",
                text2: "World",
            },
        ]);
    });

    test("join statements with custom separator", () => {
        const result = joinStatements(["Hello", "World"], " ");

        expect(result).toEqual(["Hello World", {}]);
    });

    test("join statement of a single statement returns the same statement", () => {
        const result = joinStatements([joinStatements(["Hello", "World"], " ")]);

        expect(result).toEqual(["Hello World", {}]);
    });
});
