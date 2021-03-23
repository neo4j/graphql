import { Node } from "../../classes";
import updateResolver from "./update";

describe("Update resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const node: Node = {
            name: "Movie",
            // @ts-ignore
            relationFields: [{}, {}],
        };

        const result = updateResolver({ node });
        expect(result.type).toEqual("UpdateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: "MovieWhere",
            update: "MovieUpdateInput",
            connect: "MovieConnectInput",
            disconnect: "MovieDisconnectInput",
        });
    });
});
