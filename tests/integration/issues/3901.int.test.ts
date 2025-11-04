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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3901", () => {
    const testHelper = new TestHelper();

    const secret = "secret";

    let Serie: UniqueType;
    let Season: UniqueType;
    let User: UniqueType;

    beforeEach(async () => {
        Serie = testHelper.createUniqueType("Serie");
        Season = testHelper.createUniqueType("Season");
        User = testHelper.createUniqueType("User");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${User} {
                id: ID! 
                series: [${Serie}!]! @relationship(type: "PUBLISHER", direction: OUT)
            }

            type ${Serie}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            when: [AFTER]
                            where: {
                                AND: [
                                    { node: { publisher: { id: "$jwt.sub" } } }
                                    { jwt: { roles_INCLUDES: "verified" } }
                                    { jwt: { roles_INCLUDES: "creator" } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                title: String!

                seasons: [${Season}!]! @relationship(type: "SEASON_OF", direction: IN)
                publisher: ${User}! @relationship(type: "PUBLISHER", direction: IN)
            }

            type ${Season}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            when: [AFTER]
                            where: {
                                AND: [
                                    { node: { serie: { publisher: { id: "$jwt.sub" } } } }
                                    { jwt: { roles_INCLUDES: "verified" } }
                                    { jwt: { roles_INCLUDES: "creator" } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                number: Int!
                serie: ${Serie}! @relationship(type: "SEASON_OF", direction: OUT)
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

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not raise cardinality error when connecting on create", async () => {
        const createUser = /* GraphQL */ `
            mutation {
                ${User.operations.create}(input: [{ id: "michel" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        const createPost = /* GraphQL */ `
            mutation {
                ${Serie.operations.create}(
                    input: [
                        {
                            title: "title"
                            publisher: { connect: { where: { node: { id: "michel" } } } }
                            seasons: { create: { node: { number: 1 } } }
                        }
                    ]
                ) {
                    ${Serie.plural} {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel", roles: ["verified", "creator"] });

        const createUserResult = await testHelper.executeGraphQLWithToken(createUser, token);

        expect(createUserResult.errors).toBeFalsy();

        const createPostResult = await testHelper.executeGraphQLWithToken(createPost, token);

        expect(createPostResult.errors).toBeFalsy();
        expect(createPostResult.data).toEqual({
            [Serie.operations.create]: {
                [Serie.plural]: [
                    {
                        title: "title",
                    },
                ],
            },
        });
    });
});
