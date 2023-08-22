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

import { makeDirectiveNode } from "@graphql-tools/utils";
import { parseIDAnnotation } from "./id-annotation";
import { idDirective } from "../../../graphql/directives";
const tests = [
    {
        name: "should parse correctly with all properties set to true",
        directive: makeDirectiveNode("id", { autogenerate: true, unique: true }, idDirective),
        expected: {
            autogenerate: true,
            unique: true,
        },
    },
    {
        name: "should parse correctly with all properties set to false",
        directive: makeDirectiveNode("id", { autogenerate: false, unique: false }, idDirective),
        expected: {
            autogenerate: false,
            unique: false,
        },
    },
    {
        name: "should parse correctly with autogenerate set to false, unique and global set to true",
        directive: makeDirectiveNode("id", { autogenerate: false, unique: true }, idDirective),
        expected: {
            autogenerate: false,
            unique: true,
        },
    },
];

describe("parseIDAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const idAnnotation = parseIDAnnotation(test.directive);
            expect(idAnnotation.autogenerate).toBe(test.expected.autogenerate);
            expect(idAnnotation.unique).toBe(test.expected.unique);
        });
    });
});
