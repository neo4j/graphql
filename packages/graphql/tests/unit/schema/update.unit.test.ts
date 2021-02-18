import { describe, test, expect } from "@jest/globals";
import { Neo4jGraphQL, Node } from "../../../src/classes";
import { updateResolver } from "../../../src/schema/resolvers";

describe("update", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {};

        // @ts-ignore
        const node: Node = {
            name: "Movie",
            // @ts-ignore
            relationFields: [{}, {}],
        };

        const result = updateResolver({ node, getSchema: () => neoSchema });
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
