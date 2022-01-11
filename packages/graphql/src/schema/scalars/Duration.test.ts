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

import { parseDuration, MONTHS_PER_YEAR, DAYS_PER_WEEK, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from "./Duration";

type ParsedDuration = ReturnType<typeof parseDuration>;

describe("Duration Scalar", () => {
    test.each<any>([42, () => 5, { a: 3, b: 4 }, null, undefined])("should not match %p and throw error", (value) =>
        expect(() => parseDuration(value)).toThrow(TypeError)
    );
    test.each<string>([
        "P",
        "PT",
        "P233WT4H",
        "P5.2Y4M",
        "P18871104T12:00:00",
        "P1887-11-04T120000",
    ])("should not match %s and throw error", (value) => expect(() => parseDuration(value)).toThrow(TypeError));
    test.each<[string, ParsedDuration]>([
        ["P2Y", { months: 2 * MONTHS_PER_YEAR, days: 0, seconds: 0, nanoseconds: 0 }],
        ["P2Y-3M", { months: 2 * MONTHS_PER_YEAR - 3, days: 0, seconds: 0, nanoseconds: 0 }],
        ["-P2Y-3M", { months: -2 * MONTHS_PER_YEAR + 3, days: 0, seconds: 0, nanoseconds: 0 }],
        ["P3M", { months: 3, days: 0, seconds: 0, nanoseconds: 0 }],
        ["P87D", { months: 0, days: 87, seconds: 0, nanoseconds: 0 }],
        ["P15W", { months: 0, days: 15 * DAYS_PER_WEEK, seconds: 0, nanoseconds: 0 }],
        ["P-15W", { months: 0, days: -15 * DAYS_PER_WEEK, seconds: 0, nanoseconds: 0 }],
        ["-P-15W", { months: 0, days: 15 * DAYS_PER_WEEK, seconds: 0, nanoseconds: 0 }],
        ["PT50H", { months: 0, days: 0, seconds: 50 * SECONDS_PER_HOUR, nanoseconds: 0 }],
        ["P4Y-5M-3DT5H", { months: 4 * MONTHS_PER_YEAR - 5, days: -3, seconds: 5 * SECONDS_PER_HOUR, nanoseconds: 0 }],
        ["PT30M", { months: 0, days: 0, seconds: 30 * SECONDS_PER_MINUTE, nanoseconds: 0 }],
        ["PT6.5S", { months: 0, days: 0, seconds: 6, nanoseconds: 500000000 }],
        ["P34.5Y", { months: 414, days: 0, seconds: 0, nanoseconds: 0 }],
        ["P6.5M", { months: 6, days: 15, seconds: 18873, nanoseconds: 0 }],
        ["P3.5D", { months: 0, days: 3, seconds: 43200, nanoseconds: 0 }],
        ["P7M-4.5D", { months: 7, days: -4, seconds: -43200, nanoseconds: 0 }],
        ["P6M-4DT0.75H", { months: 6, days: -4, seconds: 2700, nanoseconds: 0 }],
        ["P4Y8M-24DT67987.4M", { months: 56, days: -24, seconds: 4079244, nanoseconds: 0 }],
        [
            "P6Y30M16DT30M",
            { months: 6 * MONTHS_PER_YEAR + 30, days: 16, seconds: 30 * SECONDS_PER_MINUTE, nanoseconds: 0 },
        ],
        ["P18870605T120000", { months: 1887 * MONTHS_PER_YEAR + 6, days: 5, seconds: 12 * 60 * 60, nanoseconds: 0 }],
        ["P1887-06-05T12:00:00", { months: 1887 * 12 + 6, days: 5, seconds: 12 * 60 * 60, nanoseconds: 0 }],
    ])("should match and parse %s correctly", (duration, parsed) =>
        expect(parseDuration(duration)).toStrictEqual(parsed)
    );
});
