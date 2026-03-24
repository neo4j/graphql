/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import { parseKeyAnnotation } from "./key-annotation";

const tests = [
    {
        name: "should parse when there is only one directive",
        directives: [makeDirectiveNode("key", { fields: "sku variation { id }" })],
        expected: {
            resolvable: true,
        },
    },
    {
        name: "should parse when there are two directives",
        directives: [
            makeDirectiveNode("key", { fields: "sku variation { id }" }),
            makeDirectiveNode("key", { fields: "sku variation { id }" }),
        ],
        expected: {
            resolvable: true,
        },
    },
    {
        name: "should parse resolvable when there is only one directive",
        directives: [makeDirectiveNode("key", { fields: "sku variation { id }", resolvable: true })],
        expected: {
            resolvable: true,
        },
    },
    {
        name: "should parse resolvable when there are two directives",
        directives: [
            makeDirectiveNode("key", { fields: "sku variation { id }", resolvable: true }),
            makeDirectiveNode("key", { fields: "sku variation { id }" }),
        ],
        expected: {
            resolvable: true,
        },
    },
];

describe("parseKeyAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const keyAnnotation = parseKeyAnnotation(test.directives[0]!, test.directives);
            expect(keyAnnotation.resolvable).toBe(test.expected.resolvable);
        });
    });
});
