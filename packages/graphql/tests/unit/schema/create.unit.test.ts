import { NeoSchema, Node } from "../../../src/classes";
import create from "../../../src/schema/create";

describe("create", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: NeoSchema = {};

        // @ts-ignore
        const node: Node = {
            name: "Movie",
        };

        const result = create({ node, getSchema: () => neoSchema });
        expect(result.type).toEqual("CreateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            input: "[MovieCreateInput]!",
        });
    });
});
