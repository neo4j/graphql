/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
