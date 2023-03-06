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

import { escapeString } from "./escape-string";

describe("CypherBuilder Utils", () => {
    describe("escapeString", () => {
        const cases = [
            ["`", "````"],
            ["\u0060", "````"],
            ["\\u0060", "````"],
            ["\\\u0060", "`\\```"],
            ["```", "````````"],
            ["\u0060\u0060\u0060", "````````"],
            ["\\u0060\\u0060\\u0060", "````````"],
            ["Hello`", "`Hello```"],
            ["Hi````there", "`Hi````````there`"],
            ["Hi`````there", "`Hi``````````there`"],
            ["`a`b`c`", "```a``b``c```"],
            ["\u0060a`b`c\u0060d\u0060", "```a``b``c``d```"],
            ["\\u0060a`b`c\\u0060d\\u0060", "```a``b``c``d```"],
            ["ABC", "`ABC`"],
            ["A C", "`A C`"],
            ["A` C", "`A`` C`"],
            ["A`` C", "`A```` C`"],
            ["ALabel", "`ALabel`"],
            ["A Label", "`A Label`"],
            ["A `Label", "`A ``Label`"],
            ["`A `Label", "```A ``Label`"],
            ["Spring Data Neo4j⚡️RX", "`Spring Data Neo4j⚡️RX`"],
            ["Foo \u0060", "`Foo ```"], // This is the backtick itself in the string
            ["Foo \\u0060", "`Foo ```"], // This is the backtick unicode escaped so that without further processing `foo \u0060` would end up at Cypher
            ["Foo``bar", "`Foo````bar`"],
            ["Foo\\``bar", "`Foo\\````bar`"],
            ["Foo\\\\``bar", "`Foo\\\\````bar`"],
            ["Foo\u005cbar", "`Foo\\bar`"],
            ["Foo\u005c\u0060bar", "`Foo\\``bar`"],
            ["Foo\u005cu0060bar", "`Foo``bar`"],
            ["Foo\\u005cu0060bar", "`Foo\\u005cu0060bar`"],
            ["Foo\u005c\\u0060bar", "`Foo\\``bar`"],
            ["\u005c\u005cu0060", "`\\```"],
            ["\u005cu005cu0060", "`\\u005cu0060`"],
        ];
        test.each(cases)('Parse "%s"', (value, expected) => {
            const escapedLabel = escapeString(value);
            expect(escapedLabel).toBe(expected);
        });
    });
});
