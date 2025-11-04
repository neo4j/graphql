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

import { parseTime } from "./Time";

describe("Time Scalar", () => {
    describe("parseTime", () => {
        test.each(["22:20:00", "22:20"])("should properly parse %s", (input: string) => {
            const parsedTime = parseTime(input);
            expect(parsedTime).toEqual({
                hour: 22,
                minute: 20,
                second: 0,
                nanosecond: 0,
                timeZoneOffsetSeconds: 0,
            });
        });

        test("should properly parse time in RFC3339 format", () => {
            const parsedTime = parseTime("22:10:15.555-01:02");

            expect(parsedTime).toEqual({
                hour: 22,
                minute: 10,
                second: 15,
                nanosecond: 555000000,
                timeZoneOffsetSeconds: -3720,
            });
        });

        test.each(["22", "22:00.555"])("should not parse %s", (input: string) => {
            expect(() => parseTime(input)).toThrow();
        });
    });
});
