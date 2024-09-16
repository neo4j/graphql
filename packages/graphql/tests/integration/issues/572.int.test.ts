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

import { gql } from "graphql-tag";
import { TestHelper } from "../../utils/tests-helper";

describe("Revert https://github.com/neo4j/graphql/pull/572", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create user without related friend in many-to-many relationship", async () => {
        const user = testHelper.createUniqueType("User");

        const typeDefs = gql`
            type ${user.name} {
                name: String!
                friends: [${user.name}!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                ${user.operations.create}(input: { name: "Ford", friends: { create: { node: { name: "Jane" } } } }) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [user.operations.create]: {
                info: {
                    nodesCreated: 2,
                },
            },
        });
    });
});
