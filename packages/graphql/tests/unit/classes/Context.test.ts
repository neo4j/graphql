import { describe, test, expect } from "@jest/globals";
import Context from "../../../src/classes/Context";

describe("Context", () => {
    test("should construct", () => {
        const input = {};

        // @ts-ignore
        expect(new Context(input)).toMatchObject({});
    });
});
