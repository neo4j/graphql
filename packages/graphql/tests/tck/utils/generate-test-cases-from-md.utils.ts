import fs from "fs";
import path from "path";

type Params = {
    [key: string]: unknown;
};

export type Test = {
    name: string;
    graphQlQuery: string;
    graphQlParams: Params;
    cypherQuery: string;
    cypherParams: Params;
};

export type Schema = string;

export type TestCase = { schema: Schema; tests: Test[]; file: string };

export function generateTestCasesFromMd(dir: string): TestCase[] {
    const files = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((dirent) => dirent.isFile())
        .map((dirent) => path.join(dir, dirent.name));
    return files.map(generateTests);
}
function generateTests(filePath): TestCase {
    const data = fs.readFileSync(filePath, { encoding: "utf8" });
    const out = {
        schema: extractSchema(data.toString()),
        tests: extractTests(data.toString()),
        file: filePath.split("/").pop(),
    };
    return out;
}

function extractSchema(contents: string): Schema {
    // eslint-disable-next-line
    const re = new RegExp("```schema(?<capture>(.|\n)*?)```");
    return captureOrEmptyString(contents, re);
}

function extractTests(contents: string): Test[] {
    const nameRe = /###(?<capture>([^\n]+))/;
    // eslint-disable-next-line
    const graphqlQueryRe = new RegExp("```graphql(?<capture>(.|\n)*?)```");
    // eslint-disable-next-line
    const graphqlParamsRe = new RegExp("```graphql-params(?<capture>(.|\n)*?)```");
    // eslint-disable-next-line
    const cypherQueryRe = new RegExp("```cypher(?<capture>(.|\n)*?)```");
    // eslint-disable-next-line
    const cypherParamsRe = new RegExp("```cypher-params(?<capture>(.|\n)*?)```");

    // Strip head of file
    const testParts = contents.split("---").slice(1);
    const generatedTests = testParts.map((t) => t.trim());
    return generatedTests
        .map(
            (t): Test => {
                const name = captureOrEmptyString(t, nameRe).trim();
                if (!name) {
                    return {} as Test;
                }
                const graphQlQuery = captureOrEmptyString(t, graphqlQueryRe);
                const graphQlParams = JSON.parse(captureOrEmptyString(t, graphqlParamsRe) || "{}") as Params;
                const cypherQuery = captureOrEmptyString(t, cypherQueryRe);
                const cypherParams = JSON.parse(captureOrEmptyString(t, cypherParamsRe) || "{}") as Params;
                const ret: Test = {
                    name,
                    graphQlQuery,
                    graphQlParams,
                    cypherQuery,
                    cypherParams,
                };
                return ret;
            }
        )
        .filter((t) => t.name);
}

function captureOrEmptyString(contents: string, re: RegExp): string {
    const m = contents.match(re);
    if (m?.groups?.capture) {
        return m.groups.capture.trim();
    }
    return "";
}
