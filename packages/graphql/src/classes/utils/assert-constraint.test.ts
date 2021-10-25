import { LegacyConstraint, parseLegacyConstraint } from "./asserts-constraints";

describe("parseLegacyConstraint", () => {
    test("parses record", () => {
        const record: LegacyConstraint = {
            description:
                "CONSTRAINT ON ( cjzrqcaflcfrvpjdmctjjvtbkmaqtvdkbook:cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook ) ASSERT (cjzrqcaflcfrvpjdmctjjvtbkmaqtvdkbook.isbn) IS UNIQUE",
            details:
                "Constraint( id=4, name='cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook_isbn', type='UNIQUENESS', schema=(:cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook {isbn}), ownedIndex=3 )",
            name: "cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook_isbn",
        };

        const constraint = parseLegacyConstraint(record);

        expect(constraint).toEqual({
            id: 4,
            name: "cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook_isbn",
            type: "UNIQUENESS",
            entityType: "NODE",
            labelsOrTypes: ["cJzrQcaFLCFRvPJDmCTJjvtBkmaQtvdkBook"],
            properties: ["isbn"],
            ownedIndexId: 3,
        });
    });
});
