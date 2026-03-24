/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import { selectableDirective } from "../../../graphql/directives";
import { parseSelectableAnnotation } from "./selectable-annotation";

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
