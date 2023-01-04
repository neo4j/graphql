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
import { normalizeVariable } from "./normalize-variable";

describe("normalizeVariable", () => {
    test("returns the same variable if it is a CypherCompilable", () => {
        const originalVariable = new Cypher.Literal("hello");
        const result = normalizeVariable(originalVariable);

        expect(result).toEqual(originalVariable);
    });

    test("generates a new literal variable if it is a primitive value", () => {
        const result = normalizeVariable(5);

        expect(result).toBeInstanceOf(Cypher.Literal);
    });
});
