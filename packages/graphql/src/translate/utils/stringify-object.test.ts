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

import { stringifyObject } from "./stringify-object";

describe("stringifyObject", () => {
    test("creates a valid cypher object from a js object", () => {
        const result = stringifyObject({
            this: "this",
            that: `"that"`,
        });

        expect(result).toEqual(`{ this: this, that: "that" }`);
    });

    test("ignores undefined, null and empty string values", () => {
        const result = stringifyObject({
            nobody: "expects",
            the: undefined,
            spanish: null,
            inquisition: "",
        });

        expect(result).toEqual(`{ nobody: expects }`);
    });
});
