import createUpdateAndParams from "../../../src/translate/create-update-and-params";
import { NeoSchema } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

describe("createUpdateAndParams", () => {
    test("should return the correct projection with 1 selection", () => {
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

        const result = createUpdateAndParams({
            updateInput: { id: "new" },
            node,
            neoSchema,
            varName: "this",
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                SET this.id = $this_update_id
            `)
        );

        expect(result[1]).toMatchObject({
            this_update_id: "new",
        });
    });
});
