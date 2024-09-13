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

describe("https://github.com/neo4j/graphql/issues/5467", () => {
    const testHelper = new TestHelper();

    let Test: UniqueType;

    beforeAll(async () => {
        Test = testHelper.createUniqueType("Test");

        const typeDefs = /* GraphQL */ `
            type ${Test} {
                name: String!
                groups: [String!]
            }

            type Mutation {
                mergeTest(name: String!, groups: [String!]): ${Test}
                    @cypher(
                        statement: """
                        MERGE (t:Test {name: $name}) SET t.groups = $groups
                        return t
                        """
                        columnName: "t"
                    )
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("custom Cypher should correctly interpret array parameters with a single item", async () => {
        const query = /* GraphQL */ `
            mutation ($name: String!, $groups: [String!]) {
                mergeTest(name: $name, groups: $groups) {
                    name
                    groups
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            variableValues: {
                name: "test",
                groups: ["test"],
            },
        });

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            mergeTest: {
                name: "test",
                groups: ["test"],
            },
        });
    });
});
