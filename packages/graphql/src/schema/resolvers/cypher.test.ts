import cypherResolver from "./cypher";
import { BaseField } from "../../types";

describe("Cypher resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const field: BaseField = {
            // @ts-ignore
            typeMeta: { name: "Test", pretty: "[Test]" },
            arguments: [],
        };

        const result = cypherResolver({ field, statement: "" });
        expect(result.type).toEqual(field.typeMeta.pretty);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({});
    });
});
