/* eslint-disable @typescript-eslint/ban-ts-comment */
import getFieldDirective from "../../../src/graphql/get-field-directive";

describe("getFieldDirective", () => {
    test("should return a single field directive by name", () => {
        const name = "NAME";

        const directives = [
            {
                name: { value: name },
            },
            {
                name: { value: "RANDOM 1" },
            },
            {
                name: { value: "RANDOM 2" },
            },
            {
                name: { value: "RANDOM 3" },
            },
            {
                name: { value: "RANDOM 4" },
            },
        ];

        // @ts-ignore
        const found = getFieldDirective({ directives }, name);

        expect(found).toMatchObject({ name: { value: name } });
    });
});
