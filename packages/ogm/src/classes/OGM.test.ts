import OGM from "./OGM";

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
        describe("model", () => {
            test("should throw cannot find model", () => {
                const ogm = new OGM({ typeDefs: `type User {id:ID}` });

                const model = "not-real";

                expect(() => ogm.model(model)).toThrow(`Could not find model ${model}`);
            });
        });
    });
});
