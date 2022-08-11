import { parseEnvironmentQueryOptions } from "./parse-environment-query-options";

describe("parseEnvironmentQueryOptions", () => {
    let env: NodeJS.ProcessEnv;

    beforeEach(() => {
        env = process.env;
    });

    afterEach(() => {
        process.env = env;
    });

    test("throws an Error if invalid Cypher query option in environment", () => {
        process.env.CYPHER_RUNTIME = "invalid";

        expect(parseEnvironmentQueryOptions()).toThrow();
    });
});
