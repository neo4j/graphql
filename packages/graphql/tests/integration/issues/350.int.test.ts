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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/350", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Post: UniqueType;
    let Comment: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Retain attributes when aliasing the same field multiple times in a single query", async () => {
        const session = await neo4j.getSession();
        Post = new UniqueType("Post");
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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        try {
            await session.run(
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

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });
            expect(result.errors).toBeFalsy();
            expect((result?.data as any)[Post.plural][0].flaggedComments).toContainEqual({
                content: comment1Content,
                flagged: true,
            });
            expect((result?.data as any)[Post.plural][0].unflaggedComments).toContainEqual({
                content: comment2Content,
                flagged: false,
            });
        } finally {
            await session.close();
        }
    });
});
