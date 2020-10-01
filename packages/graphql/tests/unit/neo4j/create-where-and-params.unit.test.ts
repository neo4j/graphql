import createWhereAndParams from "../../../src/neo4j/create-where-and-params";

describe("createWhereAndParams", () => {
    test("should be a function", () => {
        expect(createWhereAndParams).toBeInstanceOf(Function);
    });

    test("should return the correct clause with 1 param", () => {
        const query = {
            title: "some title",
        };

        const varName = "this";

        const result = createWhereAndParams({ query, varName });

        expect(result[0]).toEqual(`WHERE this.title = $this_title`);
        expect(result[1]).toMatchObject({ this_title: query.title });
    });
});
