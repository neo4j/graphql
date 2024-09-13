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

describe("https://github.com/neo4j/graphql/issues/350", () => {
    const testHelper = new TestHelper();
    let Post: UniqueType;
    let Comment: UniqueType;
    let typeDefs: string;

    beforeAll(() => {});

    afterAll(async () => {
        await testHelper.close();
    });

    test("Retain attributes when aliasing the same field multiple times in a single query", async () => {
        Post = testHelper.createUniqueType("Post");
        typeDefs = `
            type ${Post} {
                id: ID!
                title: String!
                content: String!
                comments: [${Comment}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }
            type ${Comment} {
                id: ID!
                flagged: Boolean!
                content: String!
                post: ${Post}! @relationship(type: "HAS_COMMENT", direction: IN)
                canEdit: Boolean! @cypher(statement: "RETURN false as res", columnName: "res")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const postId = generate({
            charset: "alphabetic",
        });

        const postTitle = generate({
            charset: "alphabetic",
        });

        const postContent = generate({
            charset: "alphabetic",
        });

        const comment1Id = generate({
            charset: "alphabetic",
        });

        const comment1Content = "comment 1 content";

        const comment2Id = generate({
            charset: "alphabetic",
        });

        const comment2Content = "comment 2 content";

        const query = `
            query {
                ${Post.plural}(where: { id: "${postId}" }) {
                    flaggedComments: comments(where: { flagged: true }) {
                        content
                        flagged
                    }
                    unflaggedComments: comments(where: {flagged: false}) {
                        content
                        flagged
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (post:${Post} {id: $postId, title: $postTitle, content: $postContent})
                    CREATE (comment1:${Comment} {id: $comment1Id, content: $comment1Content, flagged: true})
                    CREATE (comment2:${Comment} {id: $comment2Id, content: $comment2Content, flagged: false})
                    MERGE (post)-[:HAS_COMMENT]->(comment1)
                    MERGE (post)-[:HAS_COMMENT]->(comment2)

                `,
            {
                postId,
                postTitle,
                postContent,
                comment1Id,
                comment1Content,
                comment2Id,
                comment2Content,
            }
        );

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect((result?.data as any)[Post.plural][0].flaggedComments).toContainEqual({
            content: comment1Content,
            flagged: true,
        });
        expect((result?.data as any)[Post.plural][0].unflaggedComments).toContainEqual({
            content: comment2Content,
            flagged: false,
        });
    });
});
