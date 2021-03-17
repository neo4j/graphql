import OGM from "../../../src/classes/OGM";

describe("OGM", () => {
    test("should construct", () => {
        // @ts-ignore
        expect(new OGM({ typeDefs: "type User {id: ID}" })).toBeInstanceOf(OGM);
    });

    describe("methods", () => {
        describe("verifyDatabase", () => {
            test("should neo4j-driver Driver missing", async () => {
                // @ts-ignore
                const ogm = new OGM({ typeDefs: "type User {id: ID}" });

                await expect(ogm.verifyDatabase()).rejects.toThrow(`neo4j-driver Driver missing`);
            });
        });
    });
});
