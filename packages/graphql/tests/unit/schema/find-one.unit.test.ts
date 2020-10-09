import { ObjectTypeDefinitionNode } from "graphql";
import { NeoSchema } from "../../../src/classes";
import findOne from "../../../src/schema/find-one";

describe("findOne", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: NeoSchema = {};

        // @ts-ignore
        const definition: ObjectTypeDefinitionNode = {
            // @ts-ignore
            name: {
                value: "Movie",
            },
        };

        const result = findOne({ definition, getSchema: () => neoSchema });
        expect(result.type).toEqual(`Movie`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
        });
    });
});
