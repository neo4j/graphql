import Model, { ModelConstructor } from "./Model";

describe("Model", () => {
    test("should construct", () => {
        // @ts-ignore
        const input: ModelConstructor = { name: "Movie", selectionSet: "" };

        // @ts-ignore
        expect(new Model(input)).toMatchObject({});
    });
});
