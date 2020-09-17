import { add } from "./index";

describe("Index test", () => {
    test("add function", () => {
        expect(add(1, 2)).toEqual(3);
    });
});
