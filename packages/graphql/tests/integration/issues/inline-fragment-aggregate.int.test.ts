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
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { UniqueType } from "../../utils/graphql-types";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/tbd", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let User: UniqueType;
    let Post: UniqueType;
    let Comment: UniqueType;
    let BlogArticle: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        User = new UniqueType("User");
        Post = new UniqueType("Post");
        Comment = new UniqueType("Comment");
        BlogArticle = new UniqueType("BlogArticle");

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

        neoSchema = new Neo4jGraphQL({ typeDefs, driver });
    });

    afterEach(async () => {
        await cleanNodes(session, [User, Post, BlogArticle, Comment]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        await session.run(
            `
                CREATE (user:${User} { id: $userId })
                CREATE (article:${BlogArticle} { id: $articleId })
                MERGE (user)-[:USER_POSTS]->(article)
            `,
            { userId, articleId, userName }
        );

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [User.plural]: [{ [Post.plural]: [{ [Comment.operations.aggregate]: { count: 0 } }] }],
        });
    });
});
