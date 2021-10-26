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

    testCases.forEach((t, i) => {
        console.log(i, t.file);
    });
    const testCase = testCases[98];
    const serializedSetup = createDescribe(testCase);
    const serializedTests = testCase.tests.map(createTest);

    const localPath = testCase.path.split("graphql/tests/tck/tck-test-files/cypher/")[1];
    const depth = localPath.split("/").length;

    const fileContent = `${copyright}
${createImports(depth)}
${serializedSetup}
${serializedTests.join("\n")}
});`;

    const basePath = testCase.path.split(path.extname(testCase.path))[0];
    fs.writeFileSync(`${basePath}.test.ts`, fileContent);
}

function createDescribe(testCase: TestCase): string {
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
            setTestEnvVars("${testCase.envVars}");
        });

        afterAll(() => {
            unsetTestEnvVars(undefined);
        });

    `;
}

function createTest(test: Test): string {
    return `
    test("${test.name}", async () => {
        const query = gql\`
${test.graphQlQuery}
        \`;

        const driverBuilder = new DriverBuilder();

        const req = createJwtRequest("secret", ${JSON.stringify(test.jwt)});

        await graphql({
            schema: neoSchema.schema,
            source: query.loc!.source,
            contextValue: {
                req,
                driver: driverBuilder.instance(),
            },
            variableValues: ${JSON.stringify(test.graphQlParams)}
        });

        expect(trimmer(driverBuilder.runMock.calls[0][0])).toMatchInlineSnapshot();

        expect(JSON.stringify(driverBuilder.runMock.calls[0][1])).toMatchInlineSnapshot();
    });
    `;
}

function createImports(depth: number) {
    const prePath = "../".repeat(depth);
    return `
import { gql } from "apollo-server";
import { DocumentNode, graphql } from "graphql";
import { Neo4jGraphQL } from "${prePath}../../../src";
import trimmer from "${prePath}../../../src/utils/trimmer";
import { setTestEnvVars, unsetTestEnvVars } from "${prePath}../utils/tck-test-utils";
import { createJwtRequest } from "${prePath}../../../src/utils/test/utils";
import { DriverBuilder } from "${prePath}../../../src/utils/test/builders/driver-builder";
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
