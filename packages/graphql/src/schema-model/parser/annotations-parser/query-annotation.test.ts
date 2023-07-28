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
import { parseQueryAnnotation } from "./query-annotation";
import { queryDirective } from "../../../graphql/directives";

const tests = [
    {
        name: "should parse correctly when read is true and aggregate is false",
        directive: makeDirectiveNode("query", {
            read: true,
            aggregate: false,
        }, queryDirective),
        expected: {
            read: true,
            aggregate: false,
        },
    },
    {
        name: "should parse correctly when read is false and aggregate is true",
        directive: makeDirectiveNode("query", {
            read: false,
            aggregate: true,
        }, queryDirective),
        expected: {
            read: false,
            aggregate: true,
        },
    },
];

describe("parseQueryAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const queryAnnotation = parseQueryAnnotation(test.directive);
            expect(queryAnnotation.read).toBe(test.expected.read);
            expect(queryAnnotation.aggregate).toBe(test.expected.aggregate);
        });
    });
});
