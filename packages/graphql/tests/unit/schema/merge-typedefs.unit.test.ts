import { describe, test, expect } from "@jest/globals";
import { parse, print } from "graphql";
import mergeTypeDefs from "../../../src/schema/merge-typedefs";

describe("mergeTypeDefs", () => {
    test("should return merged typeDefs", () => {
        const a = `
            type A {
                id: ID
            }
       `;

        const b = parse(`
            type B {
                id: ID
            }
       `);

        const merged = mergeTypeDefs([a, b]);

        const printMerge = print(merged);

        expect(printMerge).toEqual(
            print(
                parse(`
            type A {
                id: ID
            }

            type B {
                id: ID
            }
       `)
            )
        );
    });
});
