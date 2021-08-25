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

import { DECIMAL_VALUE_ERROR, parseDuration } from "./Duration";

type ParsedDuration = ReturnType<typeof parseDuration>;

describe("Duration Scalar", () => {
    test.each<any>([42, () => 5, { a: 3, b: 4 }, null, undefined])("should not match %p and throw error", (value) => {
        expect(() => parseDuration(value)).toThrow(TypeError);
    });
    test.each<string>(["P", "PT", "P233WT4H", "P5.2Y4M"])("should not match %s and throw error", (duration) => {
        expect(() => parseDuration(duration)).toThrow(TypeError);
    });
    test.each<string>(["P34.55Y", "P4Y5M5.4D", "P24.5W"])("should match %s but throw decimal error", (duration) => {
        expect(() => parseDuration(duration)).toThrow(new Error(DECIMAL_VALUE_ERROR));
    });
    test.each<[string, ParsedDuration]>([
        ["P2Y", { months: 2 * 12, days: 0, seconds: 0, nanoseconds: 0 }],
        ["P3M", { months: 3, days: 0, seconds: 0, nanoseconds: 0 }],
        ["P87D", { months: 0, days: 87, seconds: 0, nanoseconds: 0 }],
        ["P15W", { months: 0, days: 15 * 7, seconds: 0, nanoseconds: 0 }],
        ["PT50H", { months: 0, days: 0, seconds: 50 * 60 * 60, nanoseconds: 0 }],
        ["PT30M", { months: 0, days: 0, seconds: 30 * 60, nanoseconds: 0 }],
        ["PT6.5S", { months: 0, days: 0, seconds: 6, nanoseconds: 500000000 }],
        ["P6Y30M16DT30M", { months: 6 * 12 + 30, days: 16, seconds: 30 * 60, nanoseconds: 0 }],
        ["P18870605T120000", { months: 1887 * 12 + 6, days: 5, seconds: 12 * 60 * 60, nanoseconds: 0 }],
    ])("should match and parse %s correctly", (duration, parsed) => {
        expect(parseDuration(duration)).toStrictEqual(parsed);
    });
});
