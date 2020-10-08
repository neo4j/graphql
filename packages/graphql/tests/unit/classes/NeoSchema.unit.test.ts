import NeoSchema from "../../../src/classes/NeoSchema";

describe("NeoSchema", () => {
    test("should construct", () => {
        const input = {
            // @ts-ignore
            schema: "todo",
        };

        // @ts-ignore
        expect(new NeoSchema(input)).toMatchObject({ schema: "todo" });
    });
});
