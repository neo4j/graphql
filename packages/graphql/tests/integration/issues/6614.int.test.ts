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

describe("https://github.com/neo4j/graphql/issues/6614", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    const secret = "sssh";

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        typeDefs = /* GraphQL */ `
            type ${Movie}
                @node
                @authorization(
                    validate: [{ operations: [UPDATE, CREATE], where: { node: { MyRoles_INCLUDES: "admin" } } }]
                ) {
                Id: ID! @id 
                Name: String!
                MyRoles: [String!]!
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['admin'] as roles
                        """
                        columnName: "roles"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should apply limit to read operations", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [{ Name: "A Movie" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret);
        const queryResult = await testHelper.executeGraphQLWithToken(mutation, token);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Movie.operations.create]: {
                info: {
                    nodesCreated: 1,
                },
            },
        });
    });
});
