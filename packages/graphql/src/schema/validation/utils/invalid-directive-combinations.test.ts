import {
    invalidFieldCombinations,
    invalidInterfaceCombinations,
    invalidObjectCombinations,
} from "./invalid-directive-combinations";

describe("invalid-directive-combinations", () => {
    // For example, if @alias is invalid with @cypher, then @cypher should be invalid with @alias
    for (const [directive, invalidDirectives] of Object.entries(invalidFieldCombinations)) {
        for (const invalidDirective of invalidDirectives) {
            test(`${directive} should be invalid with ${invalidDirective}`, () => {
                expect(invalidFieldCombinations[invalidDirective]).toContain(directive);
            });
        }
    }
    for (const [directive, invalidDirectives] of Object.entries(invalidObjectCombinations)) {
        for (const invalidDirective of invalidDirectives) {
            test(`${directive} should be invalid with ${invalidDirective}`, () => {
                expect(invalidFieldCombinations[invalidDirective]).toContain(directive);
            });
        }
    }
    for (const [directive, invalidDirectives] of Object.entries(invalidInterfaceCombinations)) {
        for (const invalidDirective of invalidDirectives) {
            test(`${directive} should be invalid with ${invalidDirective}`, () => {
                expect(invalidFieldCombinations[invalidDirective]).toContain(directive);
            });
        }
    }
});
