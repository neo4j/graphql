import createCreateAndParams from "../../../src/translate/create-create-and-params";
import { NeoSchema } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

describe("createCreateAndParams", () => {
    test("should return the correct create and params", () => {
        const input = {
            title: "some title",
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

        const result = createCreateAndParams({
            input,
            node,
            neoSchema,
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
