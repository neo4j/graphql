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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4838", () => {
    const testHelper = new TestHelper();

    let TestType: UniqueType;
    let ParentTest: UniqueType;

    beforeEach(async () => {
        TestType = testHelper.createUniqueType("TestType");
        ParentTest = testHelper.createUniqueType("ParentTest");

        const typeDefs = /* GraphQL */ `
            type ${TestType} {
                test: Boolean! @cypher(statement: "RETURN true AS value", columnName: "value")
            }

            type ${ParentTest} {
                tests: [${TestType}!]! @relationship(type: "REL", direction: OUT,)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Empty input flag should be ignored on creation", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${TestType.operations.create}(input: { _emptyInput: true }) {
                    ${TestType.plural} {
                        test
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();

        const createdNodeCypherResult = await testHelper.executeCypher(`MATCH(m:${TestType}) RETURN m`);
        const createdNode = createdNodeCypherResult.records[0]?.toObject().m;
        expect(createdNode.properties).toEqual({});
    });

    test("Empty input flag should be ignored on nested creation", async () => {
        await testHelper.executeCypher(`CREATE(p:${ParentTest})-[:REL]->(:${TestType})`);

        const query = /* GraphQL */ `
            mutation {
                ${ParentTest.operations.create}(input: { tests: { create: { node: { _emptyInput: true } } } }) {
                    ${ParentTest.plural} {
                        tests {
                            test
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();

        const createdNodeCypherResult = await testHelper.executeCypher(`MATCH(m:${TestType}) RETURN m`);
        const createdNode = createdNodeCypherResult.records[0]?.toObject().m;
        expect(createdNode.properties).toEqual({});
    });

    test("Empty input flag should be ignored on update", async () => {
        await testHelper.executeCypher(`CREATE(p:${TestType})`);

        const query = /* GraphQL */ `
            mutation {
                ${TestType.operations.update}(update: { _emptyInput: true }, where: {}) {
                    ${TestType.plural} {
                        test
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();

        const createdNodeCypherResult = await testHelper.executeCypher(`MATCH(m:${TestType}) RETURN m`);
        const createdNode = createdNodeCypherResult.records[0]?.toObject().m;
        expect(createdNode.properties).toEqual({});
    });
});
