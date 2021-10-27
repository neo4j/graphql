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

// THIS IS JUST A TEMPORAL FILE

import path from "path";
import fs from "fs";
import { generateTestCasesFromMd, TestCase, Test } from "./utils/generate-test-cases-from-md.utils";

const TCK_DIR = path.join(__dirname, "tck-test-files");

function main() {
    const testCases: TestCase[] = generateTestCasesFromMd(TCK_DIR);

    testCases.forEach((testCase, i) => {
        console.log(i, testCase.file);

        const serializedSetup = createDescribe(testCase);
        const serializedTests = testCase.tests.map(createTest);

        const localPath = testCase.path.split("graphql/tests/tck/tck-test-files/cypher/")[1];
        const depth = localPath.split("/").length;

        const fileContent = `${copyright}
${createImports(depth, !!testCase.envVars)}
${serializedSetup}
${serializedTests.join("\n")}
});`;

        const basePath = testCase.path.split(path.extname(testCase.path))[0];
        fs.writeFileSync(`${basePath}.test.ts`, fileContent);
    });
}

function createDescribe(testCase: TestCase): string {
    const afterAll = `
afterAll(() => {
    unsetTestEnvVars(undefined);
});
    `;
    return `
    describe("${testCase.title}", () => {
        const secret = "secret";
        let typeDefs: DocumentNode;
        let neoSchema: Neo4jGraphQL;

        beforeAll(() => {
            typeDefs = gql\`
            ${testCase.schema}
            \`;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: { enableRegex: true, jwt: { secret } },
            });
            ${testCase.envVars ? `setTestEnvVars("${testCase.envVars}")` : ""};
        });

        ${testCase.envVars ? afterAll : ""};


    `;
}

function createTest(test: Test): string {
    const variableParams = JSON.stringify(test.graphQlParams);

    return `
    test("${test.name}", async () => {
        const query = gql\`
${test.graphQlQuery}
        \`;


        const req = createJwtRequest("secret", ${JSON.stringify(test.jwt)});
        const result = await translateQuery(neoSchema, query, {
            req,
            ${variableParams === "{}" ? `` : `variableValues: ${variableParams}`}
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot();

        expect(formatParams(result.params)).toMatchInlineSnapshot();
    });
    `;
}

function createImports(depth: number, envImport: boolean) {
    const prePath = "../".repeat(depth);
    return `
import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "${prePath}../../../src";
import { createJwtRequest } from "${prePath}../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams${
        envImport ? ", setTestEnvVars, unsetTestEnvVars" : ""
    } } from "${prePath}../utils/tck-test-utils";
    `;
}

const copyright = `
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
`;

main();
