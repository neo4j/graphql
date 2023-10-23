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
import { debugCypherAndParams } from "./debug-cypher-and-params";

describe("debugCypherAndParams", () => {
    let log: jest.Mock;
    let debug: Debugger;

    beforeEach(() => {
        log = jest.fn();

        debug = Debug("test");
        debug.enabled = true;
        // comment out to visually inspect output in console
        debug.log = log;
    });

    test("logs cypher query and params nicely", () => {
        debugCypherAndParams(
            debug,
            `MATCH (this)
        WHERE this.id = $id
        RETURN this`,
            {
                id: 1,
            }
        );

        expect(log.mock.calls[0][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mexecuting cypher"`);
        expect(log.mock.calls[1][0]).toMatchInlineSnapshot(`
            "  [38;5;26;1mtest [0mMATCH (this)
              [38;5;26;1mtest [0m        WHERE this.id = $id
              [38;5;26;1mtest [0m        RETURN this"
        `);
        expect(log.mock.calls[2][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mcypher params: { id: [33m1[39m }"`);
    });
});
