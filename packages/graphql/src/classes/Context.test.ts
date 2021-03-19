import Context from "./Context";

describe("Context", () => {
    test("should construct", () => {
        const input = {};

        // @ts-ignore
        expect(new Context(input)).toMatchObject({});
    });
});
