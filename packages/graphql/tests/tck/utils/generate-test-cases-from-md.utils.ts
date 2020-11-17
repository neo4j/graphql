import fs from "fs";
import path from "path";

type Params = {
    [key: string]: unknown;
};

type Kind = "cypher" | "schema";

export type Test = {
    name: string;
    graphQlQuery?: string;
    graphQlParams?: Params;
    cypherQuery?: string;
    cypherParams?: Params;
    typeDefs?: string;
    schemaOutPut?: string;
};

export type TestCase = {
    kind: Kind;
    schema?: string;
    tests: Test[];
    file: string;
};

export function generateTestCasesFromMd(dir: string): TestCase[] {
    const files = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((dirent) => dirent.isFile())
        .map((dirent) => path.join(dir, dirent.name));
    return files.map(generateTests);
}

const nameRe = /###(?<capture>([^\n]+))/;
const graphqlQueryRe = /```graphql(?<capture>(.|\s)*?)```/;
const graphqlParamsRe = /```graphql-params(?<capture>(.|\s)*?)```/;
const cypherQueryRe = /```cypher(?<capture>(.|\s)*?)```/;
const cypherParamsRe = /```cypher-params(?<capture>(.|\s)*?)```/;
const typeDefsInputRe = /```typedefs-input(?<capture>(.|\s)*?)```/;
const schemaOutputRe = /```schema-output(?<capture>(.|\s)*?)```/;

function generateTests(filePath): TestCase {
    const data = fs.readFileSync(filePath, { encoding: "utf8" });
    const file = path.basename(filePath);
    const [kind] = file.split("-") as [Kind];

    const out: TestCase = {
        kind,
        tests: extractTests(data.toString(), kind),
        file,
    };

    if (kind === "cypher") {
        out.schema = extractSchema(data.toString());
    }

    return out;
}

function extractSchema(contents: string): string {
    // eslint-disable-next-line
    const re = /```schema(?<capture>(.|\s)*?)```/;
    return captureOrEmptyString(contents, re);
}

function extractTests(contents: string, kind: Kind): Test[] {
    // Strip head of file
    const testParts = contents.split("---").slice(1);
    const generatedTests = testParts.map((t) => t.trim());

    if (kind === "schema") {
        return generatedTests
            .map(
                (t): Test => {
                    const name = captureOrEmptyString(t, nameRe).trim();
                    if (!name) {
                        return {} as Test;
                    }

                    const typeDefs = captureOrEmptyString(t, typeDefsInputRe);
                    const schemaOutPut = captureOrEmptyString(t, schemaOutputRe);

                    return { schemaOutPut, typeDefs, name };
                }
            )
            .filter((t) => t.name);
    }

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

                return {
                    name,
                    graphQlQuery,
                    graphQlParams,
                    cypherQuery,
                    cypherParams,
                };
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
