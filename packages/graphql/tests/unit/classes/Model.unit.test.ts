import Model, { ModelConstructor } from "../../../src/classes/Model";

describe("Model", () => {
    test("should construct", () => {
        // @ts-ignore
        const input: ModelConstructor = { name: "Movie", selectionSet: "" };

        // @ts-ignore
        expect(new Model(input)).toMatchObject({});
    });
});
