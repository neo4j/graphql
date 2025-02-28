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
import { sortableDirective } from "../../../graphql/directives";
import { parseSortableAnnotation } from "./sortable-annotation";

const tests = [
    {
        name: "should parse correctly when byValue is true",
        directive: makeDirectiveNode(
            "sortable",
            {
                byValue: true,
            },
            sortableDirective
        ),
        expected: {
            byValue: true,
        },
    },
    {
        name: "should parse correctly when byValue is false",
        directive: makeDirectiveNode(
            "sortable",
            {
                byValue: false,
            },
            sortableDirective
        ),
        expected: {
            byValue: false,
        },
    },
];

describe("parseSortableAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const sortableAnnotation = parseSortableAnnotation(test.directive);
            expect(sortableAnnotation.byValue).toBe(test.expected.byValue);
        });
    });
});
