/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import { queryDirective } from "../../../graphql/directives";
import { parseQueryAnnotation } from "./query-annotation";

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
