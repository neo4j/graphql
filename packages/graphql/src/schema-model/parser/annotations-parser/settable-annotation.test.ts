/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import { settableDirective } from "../../../graphql/directives";
import { parseSettableAnnotation } from "./settable-annotation";

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
