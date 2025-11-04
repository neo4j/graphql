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
import { parseKeyAnnotation } from "./key-annotation";

const tests = [
    {
        name: "should parse when there is only one directive",
        directives: [makeDirectiveNode("key", { fields: "sku variation { id }" })],
        expected: {
            resolvable: true,
        },
    },
    {
        name: "should parse when there are two directives",
        directives: [
            makeDirectiveNode("key", { fields: "sku variation { id }" }),
            makeDirectiveNode("key", { fields: "sku variation { id }" }),
        ],
        expected: {
            resolvable: true,
        },
    },
    {
        name: "should parse resolvable when there is only one directive",
        directives: [makeDirectiveNode("key", { fields: "sku variation { id }", resolvable: true })],
        expected: {
            resolvable: true,
        },
    },
    {
        name: "should parse resolvable when there are two directives",
        directives: [
            makeDirectiveNode("key", { fields: "sku variation { id }", resolvable: true }),
            makeDirectiveNode("key", { fields: "sku variation { id }" }),
        ],
        expected: {
            resolvable: true,
        },
    },
];

describe("parseKeyAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const keyAnnotation = parseKeyAnnotation(test.directives[0]!, test.directives);
            expect(keyAnnotation.resolvable).toBe(test.expected.resolvable);
        });
    });
});
