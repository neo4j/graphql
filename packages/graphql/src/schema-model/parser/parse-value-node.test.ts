/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ValueNode } from "graphql";
import { parse } from "graphql";
import { parseValueNode } from "./parse-value-node";

describe("parseValueNode", () => {
    test("should return a correct nested object", () => {
        const typeDefs = `
            type Movie @Auth(rules: [{ str: "string", int: 123, float: 12.3, bool: true }]) @node {
                name: String
            }
        `;

        // @ts-ignore
        const valueNode = parse(typeDefs).definitions[0].directives[0].arguments[0].value as ValueNode;

        expect(parseValueNode(valueNode)).toMatchObject([{ str: "string", int: 123, float: 12.3, bool: true }]);
    });
});
