/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            type ${User} @node {
                id: ID!
                ${Post.plural}: [${Post}!]! @relationship(type: "USER_POSTS", direction: OUT)
            }

            interface ${Post} {
                id: ID!
            }

            type ${Comment} @node {
                id: ID!
            }

            type ${BlogArticle} implements ${Post} @node {
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
                            ${Comment.operations.connection} {
                                aggregate {
                                    count {
                                        nodes
                                    }
                                }
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
            [User.plural]: [
                { [Post.plural]: [{ [Comment.operations.connection]: { aggregate: { count: { nodes: 0 } } } }] },
            ],
        });
    });
});
