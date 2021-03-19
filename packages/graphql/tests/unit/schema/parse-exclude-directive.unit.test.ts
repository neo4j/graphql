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

        expect(() => parseExcludeDirective(directive)).toThrow(
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

        expect(parseExcludeDirective(directive)).toMatchObject(expected);
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

        expect(parseExcludeDirective(directive)).toMatchObject(expected);
    });
});
