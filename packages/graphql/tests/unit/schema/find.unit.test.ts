import { Neo4jGraphQL, Node } from "../../../src/classes";
import { findResolver } from "../../../src/schema/resolvers";

describe("find", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {};

        // @ts-ignore
        const node: Node = {
            // @ts-ignore
            name: "Movie",
        };

        const result = findResolver({ node, getSchema: () => neoSchema });
        expect(result.type).toEqual(`[Movie]!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
            options: `MovieOptions`,
        });
    });
});
