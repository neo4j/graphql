import removeTypeMeta from "../../../src/graphql/remove-type-meta";

describe("removeTypeMeta", () => {
    test("should remove []", () => {
        const initial = "[Movie]";

        expect(removeTypeMeta(initial)).toEqual("Movie");
    });

    test("should remove !", () => {
        const initial = "Movie!";

        expect(removeTypeMeta(initial)).toEqual("Movie");
    });

    test("should remove [] & !", () => {
        const initial = "[Movie!]!";

        expect(removeTypeMeta(initial)).toEqual("Movie");
    });
});
