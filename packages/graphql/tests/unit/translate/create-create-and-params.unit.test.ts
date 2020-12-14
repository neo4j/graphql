import { describe, test, expect } from "@jest/globals";
import createCreateAndParams from "../../../src/translate/create-create-and-params";
import { NeoSchema, Context, Node } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

describe("createCreateAndParams", () => {
    test("should return the correct projection with 1 selection", () => {
        const input = {
            title: "some title",
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

        const result = createCreateAndParams({
            input,
            node,
            context,
            varName: "this0",
            withVars: ["this0"],
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                CREATE (this0:Movie)
                SET this0.title = $this0_title
            `)
        );

        expect(result[1]).toMatchObject({
            this0_title: "some title",
        });
    });
});
