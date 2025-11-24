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

import { generate } from "randomstring";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("aggregations-top_level authorization", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    afterEach(async () => {
        await testHelper.close();
    });

    test("should append auth where to predicate and return post count for this user", async () => {
        const Post = testHelper.createUniqueType("Post");
        const User = testHelper.createUniqueType("User");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID
                posts: [${Post}!]! @relationship(type: "POSTED", direction: OUT)
            }

            type ${Post} @node {
                content: String
                creator: [${User}!]! @relationship(type: "POSTED", direction: IN)
            }

            extend type ${Post}
                @authorization(
                    filter: [{ operations: [AGGREGATE], where: { node: { creator: { single: { id: { eq: "$jwt.sub" } } } } } }]
                )
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Post.operations.connection} {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
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

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})-[:POSTED]->(:${Post} {content: "authorized post 1"})
                CREATE (:${User} {id: "${userId}"})-[:POSTED]->(:${Post} {content: "authorized post 2"})
                CREATE (:${User} {id: "other-user"})-[:POSTED]->(:${Post} {content: "unauthorized post"})
            `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Post.operations.connection]: {
                aggregate: {
                    count: {
                        nodes: 2, // Now expecting 2 posts for authorized user
                    },
                },
            },
        });
    });
});
