import { Node } from "../../classes";
import createResolver from "./create";

describe("Create resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const node: Node = {
            name: "Movie",
        };

        const result = createResolver({ node });
        expect(result.type).toEqual("CreateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            input: "[MovieCreateInput!]!",
        });
    });
});
