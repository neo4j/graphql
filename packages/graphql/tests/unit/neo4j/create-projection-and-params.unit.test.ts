import createProjectionAndParams from "../../../src/neo4j/create-projection-and-params";

describe("createProjectionAndParams", () => {
    test("should be a function", () => {
        expect(createProjectionAndParams).toBeInstanceOf(Function);
    });
});
