import upperFirstLetter from "./upper-first-letter";

describe("upperFirstLetter", () => {
    test("should uppercase the first letter and return the word", () => {
        const initial = "movie";

        const result = upperFirstLetter(initial);

        expect(result).toEqual("Movie");
    });
});
