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
import { timestampDirective } from "../../../graphql/directives";
import { parseTimestampAnnotation } from "./timestamp-annotation";

const tests = [
    {
        name: "should parse correctly when CREATE operation is passed",
        directive: makeDirectiveNode("timestamp", { operations: ["CREATE"] }, timestampDirective),
        operations: ["CREATE"],
    },
    {
        name: "should parse correctly when UPDATE operation is passed",
        directive: makeDirectiveNode("timestamp", { operations: ["UPDATE"] }, timestampDirective),
        operations: ["UPDATE"],
    },
    {
        name: "should parse correctly when CREATE and UPDATE operations are passed",
        directive: makeDirectiveNode("timestamp", { operations: ["CREATE", "UPDATE"] }, timestampDirective),
        operations: ["CREATE", "UPDATE"],
    },
    {
        name: "should parse correctly when CREATE and UPDATE operations are passed",
        directive: makeDirectiveNode("timestamp", { operations: [] }, timestampDirective),
        operations: ["CREATE", "UPDATE"],
    },
];

describe("parseTimestampAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const timestampAnnotation = parseTimestampAnnotation(test.directive);
            expect(timestampAnnotation.operations).toEqual(test.operations);
        });
    });
});
