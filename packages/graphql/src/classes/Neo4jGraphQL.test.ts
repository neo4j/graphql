import Neo4jGraphQL from "./Neo4jGraphQL";

describe("Neo4jGraphQL", () => {
    test("should construct", () => {
        // @ts-ignore
        expect(new Neo4jGraphQL({ typeDefs: "type User {id: ID}" })).toBeInstanceOf(Neo4jGraphQL);
    });

    describe("methods", () => {
        describe("verifyDatabase", () => {
            test("should throw neo4j-driver Driver missing", async () => {
                const neoSchema = new Neo4jGraphQL({ typeDefs: "type User {id: ID}" });

                await expect(neoSchema.verifyDatabase()).rejects.toThrow(`neo4j-driver Driver missing`);
            });
        });

        describe("debug", () => {
            test("should use console log as the default", () => {
                const msg = "hi its me the super cool msg";

                const oldConsoleLog = console.log;

                console.log = (m) => expect(m).toEqual(msg);

                const neoSchema = new Neo4jGraphQL({ typeDefs: "type User {id: ID}", debug: true });

                neoSchema.debug(msg);

                console.log = oldConsoleLog;
            });

            test("should use custom function", () => {
                const msg = "hi its me the super cool msg";

                const neoSchema = new Neo4jGraphQL({
                    typeDefs: "type User {id: ID}",
                    debug: (m: string) => expect(m).toEqual(msg),
                });

                neoSchema.debug(msg);
            });
        });
    });
});
