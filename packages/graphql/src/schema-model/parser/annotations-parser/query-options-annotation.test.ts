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
import { parseQueryOptionsAnnotation } from "./query-options-annotation";
import { queryOptionsDirective } from "../../../graphql/directives";

const tests = [
    {
        name: "should parse correctly with both limit arguments",
        directive: makeDirectiveNode("queryOptions", {
            limit: {
                default: 25,
                max: 100,
            },
        }, queryOptionsDirective),
        expected: {
            limit: {
                default: 25,
                max: 100,
            },
        },
    },
    {
        name: "should parse correctly with only default limit argument",
        directive: makeDirectiveNode("queryOptions", {
            limit: {
                default: 25,
            },
        }, queryOptionsDirective),
        expected: {
            limit: {
                default: 25,
                max: undefined,
            },
        },
    },
    {
        name: "should parse correctly with only max limit argument",
        directive: makeDirectiveNode("queryOptions", {
            limit: {
                max: 100,
            },
        }, queryOptionsDirective),
        expected: {
            limit: {
                default: undefined,
                max: 100,
            },
        },
    },
];

describe("parseQueryOptionsAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const queryOptionsAnnotation = parseQueryOptionsAnnotation(test.directive);
            expect(queryOptionsAnnotation.limit).toEqual(test.expected.limit);
        });
    });
});
