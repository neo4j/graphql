/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from "fs";
import path from "path";

type Params = {
    [key: string]: unknown;
};

export type Test = {
    name: string;
    graphQlQuery?: string;
    graphQlParams?: Params;
    cypherQuery?: string;
    cypherParams?: Params;
    typeDefs?: string;
    schemaOutPut?: string;
    jwt?: any;
};

export type TestCase = {
    kind: string;
    schema?: string;
    tests: Test[];
    file: string;
};

function captureOrEmptyString(contents: string, re: RegExp): string {
    const m = re.exec(contents);
    if (m?.groups?.capture) {
        return m.groups.capture.trim();
    }
    return "";
}

const nameRe = /###(?<capture>([^\n]+))/;
const graphqlQueryRe = /```graphql(?<capture>(.|\s)*?)```/;
const graphqlParamsRe = /```graphql-params(?<capture>(.|\s)*?)```/;
const cypherQueryRe = /```cypher(?<capture>(.|\s)*?)```/;
const cypherParamsRe = /```cypher-params(?<capture>(.|\s)*?)```/;
const typeDefsInputRe = /```typedefs-input(?<capture>(.|\s)*?)```/;
const schemaOutputRe = /```schema-output(?<capture>(.|\s)*?)```/;
const jwtRe = /```jwt(?<capture>(.|\s)*?)```/;

function extractTests(contents: string, kind: string): Test[] {
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
                const jwt = JSON.parse(captureOrEmptyString(t, jwtRe) || "{}");
                const graphQlParams = JSON.parse(captureOrEmptyString(t, graphqlParamsRe) || "{}") as Params;
                const cypherQuery = captureOrEmptyString(t, cypherQueryRe);
                const cypherParams = JSON.parse(captureOrEmptyString(t, cypherParamsRe) || "{}") as Params;

                return {
                    name,
                    graphQlQuery,
                    graphQlParams,
                    cypherQuery,
                    cypherParams,
                    jwt,
                };
            }
        )
        .filter((t) => t.name);
}

function extractSchema(contents: string): string {
    const re = /```schema(?<capture>(.|\s)*?)```/;
    return captureOrEmptyString(contents, re);
}

function generateTests(filePath, kind: string): TestCase {
    const data = fs.readFileSync(filePath, { encoding: "utf8" });
    const file = path.basename(filePath);

    const out: TestCase = {
        kind,
        tests: extractTests(data.toString(), kind),
        file: `${file} (${kind})`,
    };

    if (kind === "cypher") {
        out.schema = extractSchema(data.toString());
    }

    return out;
}

export function generateTestCasesFromMd(dir: string, kind = ""): TestCase[] {
    const files = fs.readdirSync(dir, { withFileTypes: true }).reduce((res: TestCase[], item) => {
        if (item.isFile()) {
            return [...res, generateTests(path.join(dir, item.name), kind)];
        }

        if (item.isDirectory()) {
            return [...res, ...generateTestCasesFromMd(path.join(dir, item.name), kind === "" ? item.name : kind)];
        }

        return res;
    }, []);

    return files;
}
