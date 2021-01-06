import { describe, test, expect } from "@jest/globals";
import { parse, ValueNode } from "graphql";
import parseIgnoredDirective from "../../../src/schema/parse-ignored-directive";
import Node from "../../../src/classes/Node";

describe("parseIgnoredDirective", () => {
    test("should return an empty array if the @ignored directive is not specified on a type", () => {
        const input = {
            name: "TestType",
        };

        // @ts-ignore
        expect(parseIgnoredDirective(new Node(input))).toMatchObject([]);
    });

    test("should return array of resolvers to ignore given valid array input", () => {
        const typeDefs = `
            type TestType @ignored(resolvers: ["create", "delete"]) {
                name: String
            }
        `;

        // @ts-ignore
        const directives = parse(typeDefs).definitions[0].directives;

        const nodeInput = {
            name: "TestType",
            neoDirectives: directives,
        };

        // @ts-ignore
        expect(parseIgnoredDirective(new Node(nodeInput))).toMatchObject(["create", "delete"]);
    });

    test("should return array of all resolvers to ignore given valid input of '*'", () => {
        const typeDefs = `
            type TestType @ignored(resolvers: "*") {
                name: String
            }
        `;

        // @ts-ignore
        const directives = parse(typeDefs).definitions[0].directives;

        const nodeInput = {
            name: "TestType",
            neoDirectives: directives,
        };

        // @ts-ignore
        expect(parseIgnoredDirective(new Node(nodeInput))).toMatchObject(["create", "read", "update", "delete"]);
    });

    test("should throw an error if an argument other than 'resolvers' is given in the directive", () => {
        const typeDefs = `
            type TestType @ignored(queries: ["read"]) {
                name: String
            }
        `;

        // @ts-ignore
        const directives = parse(typeDefs).definitions[0].directives;

        const nodeInput = {
            name: "TestType",
            neoDirectives: directives,
        };

        // @ts-ignore
        expect(() => parseIgnoredDirective(new Node(nodeInput))).toThrow(
            "type TestType does not implement directive ignored correctly"
        );
    });

    test("should throw an error if an unknown resolvers is specified within the 'resolvers' argument", () => {
        const typeDefs = `
            type TestType @ignored(resolvers: ["unknown"]) {
                name: String
            }
        `;

        // @ts-ignore
        const directives = parse(typeDefs).definitions[0].directives;

        const nodeInput = {
            name: "TestType",
            neoDirectives: directives,
        };

        // @ts-ignore
        expect(() => parseIgnoredDirective(new Node(nodeInput))).toThrow(
            "type TestType does not implement directive ignored correctly"
        );
    });
});
