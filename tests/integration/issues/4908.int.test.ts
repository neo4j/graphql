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

import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4908", () => {
    const testHelper = new TestHelper();

    beforeAll(async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                name: String
            }

            type Mutation {
                topicUpdate(workProject: String, workProjectDetails: String): String
                    @cypher(
                        statement: """
                        RETURN $workProject + "-" + $workProjectDetails AS result
                        """
                        columnName: "result"
                    )
                topicUpdate2(thisIsLong: String, param: String): String
                    @cypher(
                        statement: """
                        RETURN $param + "-" + $thisIsLong AS result
                        """
                        columnName: "result"
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

    test("Parameters with similar name are correctly parsed", async () => {
        const query = /* GraphQL */ `
            mutation {
                topicUpdate(workProject: "str1", workProjectDetails: "str2")
            }
        `;

        const response = await testHelper.executeGraphQL(query);
        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            topicUpdate: "str1-str2",
        });
    });

    test("Parameters with similar name with null values are correctly parsed", async () => {
        const query = /* GraphQL */ `
            mutation {
                topicUpdate
            }
        `;

        const response = await testHelper.executeGraphQL(query);
        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            topicUpdate: null,
        });
    });

    test("Parameters with param as a name", async () => {
        const query = /* GraphQL */ `
            mutation {
                topicUpdate2(param: "my-param", thisIsLong: "my-thing")
            }
        `;

        const response = await testHelper.executeGraphQL(query);
        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            topicUpdate2: "my-param-my-thing",
        });
    });
});
