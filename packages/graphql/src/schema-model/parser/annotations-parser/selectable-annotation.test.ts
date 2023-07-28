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
import { parseSelectableAnnotation } from "./selectable-annotation";
import { selectableDirective } from "../../../graphql/directives";

const tests = [
    {
        name: "should parse correctly when onRead is true and onAggregate is true",
        directive: makeDirectiveNode("selectable", {
            onRead: true,
            onAggregate: true,
        }, selectableDirective),
        expected: {
            onRead: true,
            onAggregate: true,
        },
    },
    {
        name: "should parse correctly when onRead is true and onAggregate is false",
        directive: makeDirectiveNode("selectable", {
            onRead: true,
            onAggregate: false,
        }, selectableDirective),
        expected: {
            onRead: true,
            onAggregate: false,
        },
    },
    {
        name: "should parse correctly when onRead is false and onAggregate is true",
        directive: makeDirectiveNode("selectable", {
            onRead: false,
            onAggregate: true,
        }),
        expected: {
            onRead: false,
            onAggregate: true,
        },
    },
];

describe("parseSelectableAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const selectableAnnotation = parseSelectableAnnotation(test.directive);
            expect(selectableAnnotation.onRead).toBe(test.expected.onRead);
            expect(selectableAnnotation.onAggregate).toBe(test.expected.onAggregate);
        });
    });
});
