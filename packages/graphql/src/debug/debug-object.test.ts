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

import type { Debugger } from "debug";
import Debug from "debug";
import { debugObject } from "./debug-object";

describe("debugObject", () => {
    let log: jest.Mock;
    let debug: Debugger;

    beforeEach(() => {
        log = jest.fn();

        debug = Debug("test");
        debug.enabled = true;
        // comment out to visually inspect output in console
        debug.log = log;
    });

    test("logs complex object over multiple lines with chosen name", () => {
        debugObject(debug, "incoming context", {
            token: "some jwt token",
            cypherParams: { param1: { nested1: { value: "some value" } } },
        });

        expect(log.mock.calls[0][0]).toMatchInlineSnapshot(`
            "  [38;5;26;1mtest [0m%s: {
              [38;5;26;1mtest [0m  token: [32m'some jwt token'[39m,
              [38;5;26;1mtest [0m  cypherParams: { param1: { nested1: [36m[Object][39m } }
              [38;5;26;1mtest [0m}"
        `);
        expect(log.mock.calls[0][1]).toBe("incoming context");
    });
});
