import { ObjectTypeDefinitionNode } from "graphql";
import { NeoSchema } from "../../../src/classes";
import find from "../../../src/schema/find";

describe("find", () => {
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

        const result = find({ definition, getSchema: () => neoSchema });
        expect(result.type).toEqual(`[Movie]!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
            options: `MovieOptions`,
        });
    });
});
