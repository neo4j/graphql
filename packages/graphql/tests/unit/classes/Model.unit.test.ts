/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, test, expect } from "@jest/globals";
import Model, { ModelConstructor } from "../../../src/classes/Model";

describe("Model", () => {
    test("should construct", () => {
        // @ts-ignore
        const input: ModelConstructor = { name: "Movie", selectionSet: "", getGraphQLSchema: () => ({}) };

        // @ts-ignore
        expect(new Model(input)).toMatchObject({});
    });
});
