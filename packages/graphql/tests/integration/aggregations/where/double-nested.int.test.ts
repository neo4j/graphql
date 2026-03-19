/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations filters nested", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                name: String!
                likedPosts: [${Post}!]! @relationship(type: "LIKES", direction: OUT)
            }

            type ${Post} @node {
              title: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });
    // TODO: Remove focus test after https://github.com/neo4j/graphql/issues/6005 fix
    test("should return posts where the count of likes connections is equal to the user who has exactly 2 liked posts", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const post4Title = "Post 4";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "User 3";

        await testHelper.executeCypher(
            `
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (u3:${User} {name: "${name3}"})
                CREATE (p1:${Post} {title: "${post1Title}"})<-[:LIKES]-(u1)
                CREATE (p1)<-[:LIKES]-(u1)
                CREATE (p2:${Post} {title: "${post2Title}"})<-[:LIKES]-(u1)
                CREATE (p2)<-[:LIKES]-(u2)
                CREATE (:${Post} {title: "${post3Title}"})
                CREATE (:${Post} {title: "${post4Title}"})<-[:LIKES]-(u3)
            `
        );
        // Count all the posts where the likes belong to users who have liked exactly two posts
        // The expected should only be the posts connect with the user1 as is the only user that has liked two posts
        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: {
                    likesConnection: {
                        some: {
                            node: {
                                likedPostsConnection: { 
                                    aggregate: { 
                                        count: { nodes: { eq: 2 } }
                                    }
                                }
                            }                            
                        }
                    }
                }) {
                    title                    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toHaveLength(2);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                title: post1Title,
            },
            {
                title: post2Title,
            },
        ]);
    });

    test("should return posts where the count of likes connections is equal to the user who has exactly 3 edges liked posts", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const post4Title = "Post 4";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "User 3";

        await testHelper.executeCypher(
            `
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (u3:${User} {name: "${name3}"})
                CREATE (p1:${Post} {title: "${post1Title}"})<-[:LIKES]-(u1)
                CREATE (p1)<-[:LIKES]-(u1)
                CREATE (p2:${Post} {title: "${post2Title}"})<-[:LIKES]-(u1)
                CREATE (p2)<-[:LIKES]-(u2)
                CREATE (:${Post} {title: "${post3Title}"})
                CREATE (:${Post} {title: "${post4Title}"})<-[:LIKES]-(u3)
            `
        );
        // Count all the posts where the likes belong to users who have liked exactly two posts
        // The expected should only be the posts connect with the user1 as is the only user that has 3 edges liked
        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: {
                    likesConnection: {
                        some: {
                            node: {
                                likedPostsConnection: { 
                                    aggregate: { 
                                        count: { edges: { eq: 3 } }
                                    }
                                }
                            }                            
                        }
                    } 
                }) {
                    title
                    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toHaveLength(2);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                title: post1Title,
            },
            {
                title: post2Title,
            },
        ]);
    });
});
