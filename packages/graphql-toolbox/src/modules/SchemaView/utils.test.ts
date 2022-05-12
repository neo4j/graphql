import { getSchemaForLintAndAutocompletion } from "./utils";

describe("getSchemaForLintAndAutocompletion", () => {
    test("schema has directives", () => {
        const schema = getSchemaForLintAndAutocompletion();
        expect(schema.getDirectives()).toBeDefined();
        expect(schema.getDirectives().length).toBeGreaterThan(15);
        expect(schema.getDirectives().join(",")).toContain("@callback");
        expect(schema.getDirectives().join(",")).toContain("@id");
        expect(schema.getDirectives().join(",")).toContain("@relationship");
    });
});
