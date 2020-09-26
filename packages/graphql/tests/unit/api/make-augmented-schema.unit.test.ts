import makeAugmentedSchema from "../../../src/api/make-augmented-schema";
import { NeoSchema } from "../../../src/classes";

describe("makeAugmentedSchema", () => {
    test("should be a function", () => {
        expect(makeAugmentedSchema).toBeInstanceOf(Function);
    });

    test("should", () => {
        const typeDefs = `
            type Movie {
                id: ID!
                title: String!
            }
        `;

        const schema = makeAugmentedSchema({ typeDefs });

        expect(schema).toBeInstanceOf(NeoSchema);
    });
});
