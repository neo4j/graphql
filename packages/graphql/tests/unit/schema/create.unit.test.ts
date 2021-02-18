import { Neo4jGraphQL, Node } from "../../../src/classes";
import { createResolver } from "../../../src/schema/resolvers";

describe("create", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {};

        // @ts-ignore
        const node: Node = {
            name: "Movie",
        };

        const result = createResolver({ node, getSchema: () => neoSchema });
        expect(result.type).toEqual("CreateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            input: "[MovieCreateInput]!",
        });
    });
});
