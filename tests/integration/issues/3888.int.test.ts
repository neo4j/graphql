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

describe("https://github.com/neo4j/graphql/issues/3888", () => {
    const testHelper = new TestHelper();

    const secret = "secret";

    let Post: UniqueType;
    let User: UniqueType;

    beforeEach(async () => {
        Post = testHelper.createUniqueType("Post");
        User = testHelper.createUniqueType("User");

        const typeDefs = `
            type ${User} {
                id: ID!
            }

            type ${Post} @authorization(filter: [{ where: { node: { author: { id: "$jwt.sub" } } } }]) {
                title: String!
                content: String!
                author: ${User}! @relationship(type: "AUTHORED", direction: IN)
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
        const createUser = `
            mutation {
                ${User.operations.create}(input: [{ id: "michel" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        const createPost = `
            mutation {
                ${Post.operations.create}(
                    input: [
                        { title: "Test1", content: "Test1", author: { connect: { where: { node: { id: "michel" } } } } }
                    ]
                ) {
                    ${Post.plural} {
                        title
                        author {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel" });

        const createUserResult = await testHelper.executeGraphQLWithToken(createUser, token);

        expect(createUserResult.errors).toBeFalsy();

        const createPostResult = await testHelper.executeGraphQLWithToken(createPost, token);

        expect(createPostResult.errors).toBeFalsy();
        expect(createPostResult.data).toEqual({
            [Post.operations.create]: {
                [Post.plural]: [
                    {
                        title: "Test1",
                        author: {
                            id: "michel",
                        },
                    },
                ],
            },
        });
    });
});
