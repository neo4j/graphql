/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
