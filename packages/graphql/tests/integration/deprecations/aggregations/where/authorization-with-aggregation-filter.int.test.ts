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

import { createBearerToken } from "../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("authorization-with-aggregation-filter", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should authorize read operations on posts with more than one like", async () => {
        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID!
                name: String!
            }

            type ${Post} @node {
                id: ID!
                content: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }

            extend type ${Post}
                @authorization(
                    validate: [
                        {
                            operations: [READ],
                            where: {
                                node: {
                                    likesAggregate: {
                                        count: { gt: 1 }
                                    }
                                }
                            }
                        }
                    ]
                )
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
            CREATE (p1:${Post} {id: "post-1", content: "Popular post"})
            CREATE (p2:${Post} {id: "post-2", content: "Less popular post"})
            CREATE (p3:${Post} {id: "post-3", content: "Unpopular post"})
            CREATE (u1:${User} {id: "1", name: "User 1"})
            CREATE (u2:${User} {id: "2", name: "User 2"})
            CREATE (u3:${User} {id: "3", name: "User 3"})
            CREATE (u1)-[:LIKES]->(p1)
            CREATE (u2)-[:LIKES]->(p1)
            CREATE (u3)-[:LIKES]->(p1)
            CREATE (u1)-[:LIKES]->(p2)
            CREATE (u2)-[:LIKES]->(p2)
            CREATE (u1)-[:LIKES]->(p3)
            CREATE (u2)-[:LIKES]->(p3)
        `);

        const query = /* GraphQL */ `
            {
                ${Post.plural} {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[Post.plural]).toHaveLength(3);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                content: "Popular post",
                likes: expect.toIncludeSameMembers([{ name: "User 1" }, { name: "User 2" }, { name: "User 3" }]),
            },
            {
                content: "Less popular post",
                likes: expect.toIncludeSameMembers([{ name: "User 1" }, { name: "User 2" }]),
            },
            {
                content: "Unpopular post",
                likes: expect.toIncludeSameMembers([{ name: "User 1" }, { name: "User 2" }]),
            },
        ]);
    });

    test("should not authorize read operations on posts with less than one like", async () => {
        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID!
                name: String!
            }

            type ${Post} @node {
                id: ID!
                content: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }

            extend type ${Post}
                @authorization(
                    validate: [
                        {
                            operations: [READ],
                            where: {
                                node: {
                                    likesAggregate: {
                                        count: { gte: 1 }
                                    }
                                }
                            }
                        }
                    ]
                )
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
            CREATE (p1:${Post} {id: "post-1", content: "Popular post"})
            CREATE (p2:${Post} {id: "post-2", content: "Less popular post"})
            CREATE (p3:${Post} {id: "post-3", content: "Unpopular post"})
            CREATE (u1:${User} {id: "1", name: "User 1"})
            CREATE (u2:${User} {id: "2", name: "User 2"})
            CREATE (u3:${User} {id: "3", name: "User 3"})
            CREATE (u1)-[:LIKES]->(p1)
            CREATE (u2)-[:LIKES]->(p1)
            CREATE (u3)-[:LIKES]->(p1)
            CREATE (u1)-[:LIKES]->(p2)
            CREATE (u2)-[:LIKES]->(p2)
        `);

        const query = /* GraphQL */ `
            {
                ${Post.plural} {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should authorize update operations on post with exactly two likes", async () => {
        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID!
                name: String!
            }

            type ${Post} @node {
                id: ID!
                content: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }

            extend type ${Post}
                @authorization(
                    validate: [
                        {
                            operations: [UPDATE],
                            where: {
                                node: {
                                    likesAggregate: {
                                        count: { eq: 2 }
                                    }
                                }
                            }
                        }
                    ]
                )
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
            CREATE (p1:${Post} {id: "post-1", content: "Two likes post"})
            CREATE (p2:${Post} {id: "post-2", content: "Less popular post"})
            CREATE (u1:${User} {id: "1", name: "User 1"})
            CREATE (u2:${User} {id: "2", name: "User 2"})
            CREATE (u1)-[:LIKES]->(p1)
            CREATE (u2)-[:LIKES]->(p1)
            CREATE (u2)-[:LIKES]->(p2)
        `);

        const updateQuery = /* GraphQL */ `
            mutation {
                ${Post.operations.update}(
                    where: { id: { eq: "post-1" } }
                    update: { content: { set: "Updated content" } }
                ) {
                    ${Post.plural} {
                        id
                        content
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const successResult = await testHelper.executeGraphQLWithToken(updateQuery, token);

        expect(successResult.errors).toBeUndefined();
        expect(successResult.data).toEqual({
            [Post.operations.update]: {
                [Post.plural]: [
                    {
                        id: "post-1",
                        content: "Updated content",
                    },
                ],
            },
        });
    });

    test("should not authorize update operations on post with three likes", async () => {
        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID!
                name: String!
            }

            type ${Post} @node {
                id: ID!
                content: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }

            extend type ${Post}
                @authorization(
                    validate: [
                        {
                            operations: [UPDATE],
                            where: {
                                node: {
                                    likesAggregate: {
                                        count: { eq: 2 }
                                    }
                                }
                            }
                        }
                    ]
                )
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
            CREATE (p1:${Post} {id: "post-1", content: "Three likes post"})
            CREATE (u1:${User} {id: "1", name: "User 1"})
            CREATE (u2:${User} {id: "2", name: "User 2"})
            CREATE (u3:${User} {id: "3", name: "User 3"})
            CREATE (u1)-[:LIKES]->(p1)
            CREATE (u2)-[:LIKES]->(p1)
            CREATE (u3)-[:LIKES]->(p1)
        `);

        const updateQuery = /* GraphQL */ `
            mutation {
                ${Post.operations.update}(
                    where: { id: { eq: "post-1" } }
                    update: { content: { set: "Should fail" } }
                ) {
                    ${Post.plural} {
                        id
                        content
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const failResult = await testHelper.executeGraphQLWithToken(updateQuery, token);

        expect((failResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
