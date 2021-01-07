import { describe, test, expect } from "@jest/globals";
import { parse, ValueNode } from "graphql";
import parseIgnoredDirective from "../../../src/schema/parse-ignored-directive";
import Node from "../../../src/classes/Node";
import { Ignored } from "../../../src/classes";

describe("parseIgnoredDirective", () => {
    test("should throw an error if incorrect directive is passed in", () => {
        const typeDefs = `
            type TestType @wrongdirective {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        // @ts-ignore
        expect(() => parseIgnoredDirective(directive, "TestType")).toThrow(
            "Undefined or incorrect directive passed into parseIgnoredDirective function"
        );
    });

    test("should return array of resolvers to ignore given valid array input", () => {
        const typeDefs = `
            type TestType @ignored(resolvers: ["create", "delete"]) {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        const expected = new Ignored({ resolvers: ["create", "delete"] });

        // @ts-ignore
        expect(parseIgnoredDirective(directive, "TestType")).toMatchObject(expected);
    });

    test("should return array of all resolvers to ignore given valid input of '*'", () => {
        const typeDefs = `
            type TestType @ignored(resolvers: "*") {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        const expected = new Ignored({ resolvers: ["create", "read", "update", "delete"] });

        // @ts-ignore
        expect(parseIgnoredDirective(directive, "TestType")).toMatchObject(expected);
    });

    test("should throw an error if an argument other than 'resolvers' is given in the directive", () => {
        const typeDefs = `
            type TestType @ignored(queries: ["read"]) {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        // @ts-ignore
        expect(() => parseIgnoredDirective(directive, "TestType")).toThrow(
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
        const directive = parse(typeDefs).definitions[0].directives[0];

        // @ts-ignore
        expect(() => parseIgnoredDirective(directive, "TestType")).toThrow(
            "type TestType does not implement directive ignored correctly"
        );
    });
});
