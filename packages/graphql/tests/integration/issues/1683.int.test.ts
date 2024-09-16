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

describe("https://github.com/neo4j/graphql/issues/1683", () => {
    let systemType: UniqueType;
    let governedDataTest: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        systemType = testHelper.createUniqueType("System");
        governedDataTest = testHelper.createUniqueType("GovernedData");

        const typeDefs = `
            type ${systemType} {
                code: String!
                updatesData: [${governedDataTest}!]! @relationship(type: "UPDATED_BY", direction: IN)
            }
            type ${governedDataTest} {
                code: String!
                updatedBy: [${systemType}!]! @relationship(type: "UPDATED_BY", direction: OUT)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return top level entity, even if no connections exist", async () => {
        const query = `
            {
                ${systemType.plural} {
                    code
                    updatesDataConnection {
                        edges {
                            node {
                                code
                            }
                        }
                    }
                }
            }
        `;

        const cypher = `
            CREATE (s:${systemType} { code: "arthur" });
        `;

        await testHelper.executeCypher(cypher);

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [systemType.plural]: [{ code: "arthur", updatesDataConnection: { edges: [] } }],
        });
    });
});
