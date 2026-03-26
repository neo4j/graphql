/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import { limitDirective } from "../../../graphql/directives";
import { parseLimitAnnotation } from "./limit-annotation";

const tests = [
    {
        name: "should parse correctly with both limit arguments",
        directive: makeDirectiveNode(
            "limit",
            {
                default: 25,
                max: 100,
            },
            limitDirective
        ),
        expected: {
            default: 25,
            max: 100,
        },
    },
    {
        name: "should parse correctly with only default limit argument",
        directive: makeDirectiveNode(
            "limit",
            {
                default: 25,
            },
            limitDirective
        ),
        expected: {
            default: 25,
            max: undefined,
        },
    },
    {
        name: "should parse correctly with only max limit argument",
        directive: makeDirectiveNode(
            "limit",
            {
                max: 100,
            },
            limitDirective
        ),
        expected: {
            default: undefined,
            max: 100,
        },
    },
];

describe("parseQueryOptionsAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const limitAnnotation = parseLimitAnnotation(test.directive);
            expect(limitAnnotation.default).toEqual(test.expected.default);
            expect(limitAnnotation.max).toEqual(test.expected.max);
        });
    });
});
