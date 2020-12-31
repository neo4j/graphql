import { describe, test, expect } from "@jest/globals";
import { NeoSchema, Node } from "../../../src/classes";
import cypherResolver from "../../../src/schema/cypher-resolver";
import { BaseField } from "../../../src/types";

describe("cypherResolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: NeoSchema = {};

        // @ts-ignore
        const field: BaseField = {
            // @ts-ignore
            typeMeta: { name: "Test", pretty: "[Test]" },
            arguments: [],
        };

        const result = cypherResolver({ field, statement: "", getSchema: () => neoSchema, defaultAccessMode: "READ" });
        expect(result.type).toEqual(field.typeMeta.pretty);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({});
    });
});
