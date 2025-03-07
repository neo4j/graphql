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

import { deepMerge } from "./deep-merge";

describe("deep merge", () => {
    test.each<[Array<any>, any]>([
        [[{ a: "1" }, { a: "2" }], { a: "2" }],
        [[{ a: "1" }, { b: "2" }], { a: "1", b: "2" }],
        [
            [
                { a: { foo: "bar" }, d: 10 },
                { b: "2", a: { foo: "bar2", c: 10 } },
            ],
            { b: "2", a: { foo: "bar2", c: 10 }, d: 10 },
        ],
        [[{ a: "1" }, { a: "2", b: "test" }, { a: 10 }], { a: 10, b: "test" }],
        [[{}], {}],

        // Null and undefined
        [[{ a: "1" }, undefined, { a: "2" }], { a: "2" }],
        [[undefined], {}],
        [[null], {}],
        [[{ a: 2 }, { a: null }], { a: null }],
        [[{ a: 2 }, { a: undefined }], { a: 2 }],

        // Arrays
        [[{ a: [1, 2] }, { a: [2, 3] }], { a: [2, 3] }],
        [[{ a: [{ b: 2 }] }, { a: [{ c: 3 }] }], { a: [{ c: 3 }] }],
        [[{ a: { foo: "bar" } }, { a: "bar2" }], { a: "bar2" }],

        // Objects with non-objects
        [[{ a: { b: 2 } }, { a: 5 }], { a: 5 }],
        [[{ a: 5 }, { a: { b: 2 } }], { a: { b: 2 } }],
    ])(`deepMerge(%j) returns %j`, (input, expected) => {
        const result = deepMerge(input);
        expect(result).toEqual(expected);
    });
});
