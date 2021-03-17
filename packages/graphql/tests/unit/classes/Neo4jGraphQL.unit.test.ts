import Neo4jGraphQL from "../../../src/classes/Neo4jGraphQL";

describe("Neo4jGraphQL", () => {
    test("should construct", () => {
        // @ts-ignore
        expect(new Neo4jGraphQL({ typeDefs: "type User {id: ID}" })).toBeInstanceOf(Neo4jGraphQL);
    });

    describe("methods", () => {
        describe("verify", () => {
            test("should neo4j-driver Driver missing", async () => {
                const neoSchema = new Neo4jGraphQL({ typeDefs: "type User {id: ID}" });

                await expect(neoSchema.verify()).rejects.toThrow(`neo4j-driver Driver missing`);
            });
        });
    });
});
