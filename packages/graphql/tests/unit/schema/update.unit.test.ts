import { describe, test, expect } from "@jest/globals";
import { NeoSchema, Node } from "../../../src/classes";
import update from "../../../src/schema/update";

describe("update", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: NeoSchema = {};

        // @ts-ignore
        const node: Node = {
            name: "Movie",
            // @ts-ignore
            relationFields: [{}, {}],
        };

        const result = update({ node, getSchema: () => neoSchema });
        expect(result.type).toEqual(`[Movie]!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
            update: `MovieUpdateInput`,
            connect: `MovieConnectInput`,
            disconnect: `MovieDisconnectInput`,
        });
    });
});
