import { describe, expect, test } from "@jest/globals";
import lowFirstLetter from "../../../src/utils/low-first-letter";

describe("lowFirstLetter", () => {
    test("should lower case the first letter of a word", () => {
        const initial = "Hello";

        const result = lowFirstLetter(initial);

        expect(result).toEqual("hello");
    });
});
