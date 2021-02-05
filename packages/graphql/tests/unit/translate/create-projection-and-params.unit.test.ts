import { describe, test, expect } from "@jest/globals";
import createProjectionAndParams from "../../../src/translate/create-projection-and-params";
import { NeoSchema, Context, Node } from "../../../src/classes";

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

        // @ts-ignore
        const node: Node = {
            name: "Movie",
            relationFields: [],
            cypherFields: [],
            enumFields: [],
            scalarFields: [],
            primitiveFields: [
                {
                    fieldName: "title",
                    typeMeta: {
                        name: "String",
                        array: false,
                        required: false,
                        pretty: "String",
                        input: {
                            name: "String",
                            pretty: "String",
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            dateTimeFields: [],
            pointFields: [],
            interfaceFields: [],
            objectFields: [],
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
