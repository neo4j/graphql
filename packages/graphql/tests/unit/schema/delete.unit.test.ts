import { NeoSchema, Node } from "../../../src/classes";
import deleteResolver from "../../../src/schema/delete";

describe("delete", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: NeoSchema = {};

        // @ts-ignore
        const node: Node = {
            // @ts-ignore
            name: "Movie",
            relationFields: [],
        };

        const result = deleteResolver({ node, getSchema: () => neoSchema });
        expect(result.type).toEqual(`DeleteInfo!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
        });
    });
});
