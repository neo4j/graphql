/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Union", () => {
    let Blog: UniqueType;
    let Post: UniqueType;
    let User: UniqueType;

    const testHelper = new TestHelper();

    describe("Queries", () => {
        beforeEach(async () => {
            Blog = testHelper.createUniqueType("Blog");
            Post = testHelper.createUniqueType("Post");
            User = testHelper.createUniqueType("User");

            const typeDefs = /* GraphQL */ `
            union Content = ${Blog} | ${Post}

            type ${Blog} @node {
                title: String
                posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            type ${Post} @node {
                content: String
            }

            type ${User} @node {
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            // set-up for queries
            await testHelper.executeCypher(`
            CREATE (u:${User} {name: "Alice"})
            CREATE (u2:${User} {name: "Bob"})
            CREATE (b:${Blog} {title: "Our Blog"})
            CREATE (p:${Post} {content: "Alice's Post"})
            CREATE (p2:${Post} {content: "Bob's Post"})
            CREATE (u)-[:HAS_CONTENT]->(b)
            CREATE (u)-[:HAS_CONTENT]->(p)
            CREATE (u2)-[:HAS_CONTENT]->(p2)
            CREATE (b)-[:HAS_POST]->(p)
            CREATE (b)-[:HAS_POST]->(p2)
            `);
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("example 1: Get User nodes with related Content nodes with inline fragments for all concrete member types", async () => {
            const query = /* GraphQL */ `
            query {
                ${User.plural} {
                    name
                    content {
                        ... on ${Blog} {
                            title
                        }
                        ... on ${Post} {
                            content
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [User.plural]: expect.toIncludeSameMembers([
                    {
                        name: "Alice",
                        content: expect.toIncludeSameMembers([
                            {
                                title: "Our Blog",
                            },
                            {
                                content: "Alice's Post",
                            },
                        ]),
                    },
                    {
                        name: "Bob",
                        content: [
                            {
                                content: "Bob's Post",
                            },
                        ],
                    },
                ]),
            });
        });

        test("example 2: Get User nodes with related Content nodes omitting the Post type inline fragment", async () => {
            const query = /* GraphQL */ `
            query {
                ${User.plural} {
                    name
                    content {
                        ... on ${Blog} {
                            title
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [User.plural]: expect.toIncludeSameMembers([
                    {
                        name: "Alice",
                        content: expect.toIncludeSameMembers([
                            {
                                title: "Our Blog",
                            },
                            {},
                        ]),
                    },
                    {
                        name: "Bob",
                        content: [{}],
                    },
                ]),
            });
        });

        test("example 3: Get User nodes with related Content nodes filtered by Blog type", async () => {
            const query = /* GraphQL */ `
            query {
                ${User.plural} {
                    name
                    content(where: { ${Blog}: { NOT: { title: { eq: null } } }}) {
                        ... on ${Blog} {
                            title
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [User.plural]: expect.toIncludeSameMembers([
                    {
                        name: "Alice",
                        content: [
                            {
                                title: "Our Blog",
                            },
                        ],
                    },
                    {
                        name: "Bob",
                        content: [],
                    },
                ]),
            });
        });
    });

    describe("Mutations", () => {
        beforeEach(async () => {
            Blog = testHelper.createUniqueType("Blog");
            Post = testHelper.createUniqueType("Post");
            User = testHelper.createUniqueType("User");

            const typeDefs = /* GraphQL */ `
            union Content = ${Blog} | ${Post}

            type ${Blog} @node {
                title: String
                posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            type ${Post} @node {
                content: String
            }

            type ${User} @node {
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("example 4: Create User nodes with HAS_CONTENT relationship to Blog nodes", async () => {
            const query = /* GraphQL */ `
            mutation {
                ${User.operations.create}(
                    input: [
                        {
                            name: "Alice"
                            content: {
                                ${Blog}: {
                                    create: [
                                        {
                                            node: {
                                                title: "Our Blog"
                                                posts: { 
                                                    create: [
                                                        { node: { content: "Alice's Post" } },
                                                        { node: { content: "Bob's Post" } }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        { name: "Bob" }
                    ]
                ) {
                    ${User.plural} {
                        name
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();

            await testHelper.expectRelationship(User, Blog, "HAS_CONTENT").toEqual([
                {
                    from: {
                        name: "Alice",
                    },
                    to: {
                        title: "Our Blog",
                    },
                    relationship: {},
                },
            ]);

            await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toIncludeSameMembers([]);

            await testHelper.expectRelationship(Blog, Post, "HAS_POST").toIncludeSameMembers([
                {
                    from: {
                        title: "Our Blog",
                    },
                    to: {
                        content: "Alice's Post",
                    },
                    relationship: {},
                },
                {
                    from: {
                        title: "Our Blog",
                    },
                    to: {
                        content: "Bob's Post",
                    },
                    relationship: {},
                },
            ]);
        });

        test("example 5: Update User nodes with HAS_CONTENT relationships to Post nodes", async () => {
            await testHelper.executeCypher(`
            CREATE (:${User} {name: "Alice"})
            CREATE (:${Post} {content: "Alice's Post"})
            CREATE (:${User} {name: "Bob"})
            CREATE (:${Post} {content: "Bob's Post"})
        `);
            const queryAlice = /* GraphQL */ `
            mutation {
                ${User.operations.update}(
                   where: { name: { eq: "Alice" } }
                   update: {
                       content: {
                            ${Post}: [
                                {
                                    connect: [
                                        {
                                            where: { node: { content: { eq: "Alice's Post" } } }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ) {
                    ${User.plural} {
                        name
                    }
                }
            }
        `;
            const result = await testHelper.executeGraphQL(queryAlice);
            expect(result.errors).toBeUndefined();

            const queryBob = /* GraphQL */ `
            mutation {
                ${User.operations.update}(
                   where: { name: { eq: "Bob" } }
                   update: {
                       content: {
                            ${Post}: [
                                {
                                    connect: [
                                        {
                                            where: { node: { content: { eq: "Bob's Post" } } }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ) {
                    ${User.plural} {
                        name
                    }
                }
            }
        `;
            const result2 = await testHelper.executeGraphQL(queryBob);
            expect(result2.errors).toBeUndefined();

            await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toIncludeSameMembers([
                {
                    from: {
                        name: "Alice",
                    },
                    to: {
                        content: "Alice's Post",
                    },
                    relationship: {},
                },
                {
                    from: {
                        name: "Bob",
                    },
                    to: {
                        content: "Bob's Post",
                    },
                    relationship: {},
                },
            ]);
        });
    });
});
