import { describe, test, expect } from "@jest/globals";
import createProjectionAndParams from "../../../src/translate/create-projection-and-params";
import { NeoSchema, Context } from "../../../src/classes";

describe("createProjectionAndParams", () => {
    test("should be a function", () => {
        expect(createProjectionAndParams).toBeInstanceOf(Function);
    });

    test("should return the correct projection with 1 selection", () => {
        const fieldsByTypeName = {
            Movie: {
                title: {
                    name: "title",
                    alias: "title",
                    args: {},
                    fieldsByTypeName: {},
                },
            },
        };

        const node = {
            name: "Movie",
            relationFields: [],
            cypherFields: [],
            primitiveFields: [
                {
                    fieldName: "title",
                    typeMeta: {
                        name: "String",
                        array: false,
                        required: false,
                        pretty: "String",
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
        };

        // @ts-ignore
        const neoSchema: NeoSchema = {
            nodes: [node],
        };

        // @ts-ignore
        const context = new Context({ neoSchema });

        const result = createProjectionAndParams({ fieldsByTypeName, node, context, varName: "this" });

        expect(result[0]).toEqual(`{ .title }`);
        expect(result[1]).toMatchObject({});
    });
});
