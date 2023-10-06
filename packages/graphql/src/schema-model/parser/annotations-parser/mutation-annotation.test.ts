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
import { MutationOperations, mutationDirective } from "../../../graphql/directives/mutation";
import { parseMutationAnnotation } from "./mutation-annotation";

const tests = [
    {
        name: "should parse correctly with a CREATE operation set",
        directive: makeDirectiveNode("mutation", { operations: [MutationOperations.CREATE] }, mutationDirective),
        expected: { operations: new Set([MutationOperations.CREATE]) },
    },
    {
        name: "should parse correctly with an UPDATE operation set",
        directive: makeDirectiveNode("mutation", { operations: [MutationOperations.UPDATE] }, mutationDirective),
        expected: { operations: new Set([MutationOperations.UPDATE]) },
    },
    {
        name: "should parse correctly with a DELETE operation set",
        directive: makeDirectiveNode("mutation", { operations: [MutationOperations.DELETE] }, mutationDirective),
        expected: { operations: new Set([MutationOperations.DELETE]) },
    },
    {
        name: "should parse correctly with a CREATE and UPDATE operation set",
        directive: makeDirectiveNode(
            "mutation",
            {
                operations: [MutationOperations.CREATE, MutationOperations.UPDATE],
            },
            mutationDirective
        ),
        expected: { operations: new Set([MutationOperations.CREATE, MutationOperations.UPDATE]) },
    },
    {
        name: "should parse correctly with a CREATE, UPDATE and DELETE operation set",
        directive: makeDirectiveNode(
            "mutation",
            {
                operations: [MutationOperations.CREATE, MutationOperations.UPDATE, MutationOperations.DELETE],
            },
            mutationDirective
        ),
        expected: {
            operations: new Set([MutationOperations.CREATE, MutationOperations.UPDATE, MutationOperations.DELETE]),
        },
    },
];

describe("parseMutationAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const mutationAnnotation = parseMutationAnnotation(test.directive);
            expect(mutationAnnotation.operations).toEqual(test.expected.operations);
        });
    });
});
