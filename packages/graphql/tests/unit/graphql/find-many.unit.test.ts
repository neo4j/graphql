import { ObjectTypeDefinitionNode } from "graphql";
import { NeoSchema } from "../../../src/classes";
import findMany from "../../../src/graphql/find-many";

describe("findMany", () => {
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

        const result = findMany({ definition, getSchema: () => neoSchema });
        expect(result.type).toEqual(`[Movie]!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            query: `MovieQuery`,
            options: `MovieOptions`,
        });
    });
});
