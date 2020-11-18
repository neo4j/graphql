/* eslint-disable @typescript-eslint/ban-ts-comment */
import Auth from "../../../src/classes/Auth";

describe("Auth", () => {
    test("should construct", () => {
        const input = {};

        // @ts-ignore
        expect(new Auth(input)).toMatchObject({});
    });
});
