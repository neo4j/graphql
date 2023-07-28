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
import { parseSettableAnnotation } from "./settable-annotation";
import { settableDirective } from "../../../graphql/directives";

const tests = [
    {
        name: "should parse correctly when onCreate is true and onUpdate is true",
        directive: makeDirectiveNode("settable", {
            onCreate: true,
            onUpdate: true,
        }, settableDirective),
        expected: {
            onCreate: true,
            onUpdate: true,
        },
    },
    {
        name: "should parse correctly when onCreate is true and onUpdate is false",
        directive: makeDirectiveNode("settable", {
            onCreate: true,
            onUpdate: false,
        }, settableDirective),
        expected: {
            onCreate: true,
            onUpdate: false,
        },
    },
    {
        name: "should parse correctly when onCreate is false and onUpdate is true",
        directive: makeDirectiveNode("settable", {
            onCreate: false,
            onUpdate: true,
        }),
        expected: {
            onCreate: false,
            onUpdate: true,
        },
    },
];

describe("parseSettableAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const settableAnnotation = parseSettableAnnotation(test.directive);
            expect(settableAnnotation.onCreate).toBe(test.expected.onCreate);
            expect(settableAnnotation.onUpdate).toBe(test.expected.onUpdate);
        });
    });
});
