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

import uniqueString from "./unique-string";

type Args = [string, string[], string];

describe("uniqueString", () => {
    const cases: Args[] = [
        ["", [], ""],
        ["", ["b", "c"], ""],
        ["a", [], "a"],
        ["a", ["b", "c"], "a"],
        ["a", ["a3", "c"], "a"],
        ["a", ["a2", "c"], "a"],
        ["a", ["a", "c"], "a2"],
        ["a", ["a", "a2", "c"], "a3"],
    ];

    test.each<Args>(cases)("given candidate %p and pool %p, returns %p", (candidate, pool, expectedResult) => {
        const result = uniqueString(candidate, pool);
        expect(result).toEqual(expectedResult);
    });
});
