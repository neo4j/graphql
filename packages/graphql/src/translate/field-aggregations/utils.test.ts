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

import { escapeQuery, wrapApocRun, generateResultObject } from "./utils";

describe("field-aggregation utils", () => {
    describe("escapeQuery", () => {
        test("escape query with normal text", () => {
            const escaped = escapeQuery("Hello");
            expect(escaped).toEqual("Hello");
        });

        test("escape query with double quotes", () => {
            const escaped = escapeQuery(`"Hello"`);
            expect(escaped).toEqual(`\\"Hello\\"`);
        });

        test("escape query with single and double quotes", () => {
            const escaped = escapeQuery(`"Hello" and 'goodbye'`);
            expect(escaped).toEqual(`\\"Hello\\" and \\'goodbye\\'`);
        });
    });

    describe("wrapApocRun", () => {
        test("wraps and escapes a query inside runFirstColumn", () => {
            const result = wrapApocRun(`MATCH(n) RETURN n, "Hello"`);
            expect(result).toEqual(
                `head(apoc.cypher.runFirstColumn(" MATCH(n) RETURN n, \\"Hello\\" ", { this: this }))`
            );
        });
        test("adds extra params", () => {
            const result = wrapApocRun(`MATCH(n) RETURN n`, { auth: "auth" });
            expect(result).toEqual(
                `head(apoc.cypher.runFirstColumn(" MATCH(n) RETURN n ", { this: this, auth: auth }))`
            );
        });
    });

    describe("generateResultObject", () => {
        test("creates a valid cypher object from a js object", () => {
            const result = generateResultObject({
                this: "this",
                that: `"that"`,
            });

            expect(result).toEqual(`{ this: this, that: "that" }`);
        });

        test("ignores undefined, null and empty string values", () => {
            const result = generateResultObject({
                nobody: "expects",
                the: undefined,
                spanish: null,
                inquisition: "",
            });

            expect(result).toEqual(`{ nobody: expects }`);
        });
    });
});
