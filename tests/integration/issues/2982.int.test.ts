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
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2982", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Post: UniqueType;
    let Comment: UniqueType;
    let BlogArticle: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Comment = testHelper.createUniqueType("Comment");
        BlogArticle = testHelper.createUniqueType("BlogArticle");

        const typeDefs = `
            type ${User} {
                id: ID!
                ${Post.plural}: [${Post}!]! @relationship(type: "USER_POSTS", direction: OUT)
            }

            interface ${Post} {
                id: ID!
            }

            type ${Comment} {
                id: ID!
            }

            type ${BlogArticle} implements ${Post} {
                id: ID!
                ${Comment.plural}: [${Comment}!]! @relationship(type: "ARTICLE_COMMENTS", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("count aggregate should work in inline fragments", async () => {
        const query = `
            query {
                ${User.plural} {
                    ${Post.plural} {
                        ... on ${BlogArticle} {
                            ${Comment.operations.aggregate} {
                                count
                            }
                        }
                    }
                }
            }
        `;

        const userId = generate({ charset: "alphabetic" });
        const articleId = generate({ charset: "alphabetic" });
        const userName = generate({ charset: "alphabetic" });

        await testHelper.executeCypher(
            `
                CREATE (user:${User} { id: $userId })
                CREATE (article:${BlogArticle} { id: $articleId })
                MERGE (user)-[:USER_POSTS]->(article)
            `,
            { userId, articleId, userName }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [User.plural]: [{ [Post.plural]: [{ [Comment.operations.aggregate]: { count: 0 } }] }],
        });
    });
});
