import translate from "./translate";
import Neo4jGraphQL from "../classes/Neo4jGraphQL";

describe("translate", () => {
    test("should throw neo4j-driver Driver missing", () => {
        // @ts-ignore
        expect(() =>
            // @ts-ignore
            translate({ context: { neoSchema: new Neo4jGraphQL({ typeDefs: `type User {id: ID}` }) }, resolveInfo: {} })
        ).toThrow("neo4j-driver Driver missing");
    });
});
