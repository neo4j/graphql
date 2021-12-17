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

import generateGraphQLSafeName from "./generate-graphql-safe-name";

type Args = [string, string];

describe("generateGraphQLSafeName", () => {
    const cases: Args[] = [
        ["", ""],
        ["Abc", "Abc"],
        ["A1bc", "A1bc"],
        ["1234", "_1234"],
        ["12-34", "_12_34"],
    ];

    test.each<Args>(cases)("given input %p, returns %p", (inStr, expectedResult) => {
        const result = generateGraphQLSafeName(inStr);
        expect(result).toEqual(expectedResult);
    });
});
