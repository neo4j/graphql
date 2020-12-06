import { describe, test, expect } from "@jest/globals";
import { parse, ValueNode } from "graphql";
import parseValueNode from "../../../src/schema/parse-value-node";

describe("parseValueNode", () => {
    test("should return a correct nested object", () => {
        const typeDefs = `
            type Movie @Auth(rules: [{ str: "string", int: 123, float: 12.3, bool: true }]) {
                name: String
            }
        `;

        // @ts-ignore
        const valueNode = parse(typeDefs).definitions[0].directives[0].arguments[0].value as ValueNode;

        expect(parseValueNode(valueNode)).toMatchObject([{ str: "string", int: 123, float: 12.3, bool: true }]);
    });
});
