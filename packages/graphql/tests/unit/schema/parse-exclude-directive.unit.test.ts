import { parse } from "graphql";
import parseExcludeDirective from "../../../src/schema/parse-exclude-directive";
import { Exclude } from "../../../src/classes";

describe("parseExcludeDirective", () => {
    test("should throw an error if incorrect directive is passed in", () => {
        const typeDefs = `
            type TestType @wrongdirective {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        // @ts-ignore
        expect(() => parseExcludeDirective(directive, "TestType")).toThrow(
            "Undefined or incorrect directive passed into parseExcludeDirective function"
        );
    });

    test("should return array of operations to ignore given valid array input", () => {
        const typeDefs = `
            type TestType @exclude(operations: [CREATE, DELETE]) {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        const expected = new Exclude({ operations: ["create", "delete"] });

        // @ts-ignore
        expect(parseExcludeDirective(directive, "TestType")).toMatchObject(expected);
    });

    test("should return array of all operations to ignore given valid input of '*'", () => {
        const typeDefs = `
            type TestType @exclude {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        const expected = new Exclude({ operations: ["create", "read", "update", "delete"] });

        // @ts-ignore
        expect(parseExcludeDirective(directive, "TestType")).toMatchObject(expected);
    });

    test("should throw an error if an argument other than 'operations' is given in the directive", () => {
        const typeDefs = `
            type TestType @exclude(queries: [READ]) {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        // @ts-ignore
        expect(() => parseExcludeDirective(directive, "TestType")).toThrow(
            "type TestType does not implement directive exclude correctly"
        );
    });

    test("should throw an error if an unknown operations is specified within the 'operations' argument", () => {
        const typeDefs = `
            type TestType @exclude(operations: [UNKNOWN]) {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        // @ts-ignore
        expect(() => parseExcludeDirective(directive, "TestType")).toThrow(
            "type TestType does not implement directive exclude correctly"
        );
    });
});
