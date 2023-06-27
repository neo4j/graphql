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

import { getAuraDBIdFromText } from "./utils";

describe("getAuraDBIdFromText", () => {
    const tests = [
        {
            input: "",
            expected: null,
        },
        {
            input: null,
            expected: null,
        },
        {
            input: "http://localhost:7687",
            expected: null,
        },
        {
            input: "https://dsfsdfsdf.random.se:7687",
            expected: null,
        },
        {
            input: "neo4j+s://er56rt56.databases.neo4j.io",
            expected: "er56rt56",
        },
        {
            input: "neo4j+s://er56rt56.databases.neo4j.io:7687",
            expected: "er56rt56",
        },
        {
            input: "neo4j://er56rt56.databases.neo4j.io",
            expected: "er56rt56",
        },
        {
            input: "neo4j+s://er56rt56.database.neo4j.io",
            expected: null,
        },
    ];

    tests.forEach((test) => {
        it(`input: ${test.input}, expected: ${test.expected}`, () => {
            expect(getAuraDBIdFromText(test.input)).toBe(test.expected);
        });
    });
});
