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
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Union", () => {
    let Blog: UniqueType;
    let Post: UniqueType;
    let User: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
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

    afterAll(async () => {
        await testHelper.close();
    });

    describe("Queries", () => {
        const Alice = `Alice ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const Bob = `Bob ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const AlicePost = `Alice's Post ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const BobPost = `Bob's Post ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const OurBlog = `Our Blog ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;

        beforeAll(async () => {
            // set-up for queries
            await testHelper.executeCypher(`
            CREATE (u:${User} {name: "${Alice}"})
            CREATE (u2:${User} {name: "${Bob}"})
            CREATE (b:${Blog} {title: "${OurBlog}"})
            CREATE (p:${Post} {content: "${AlicePost}"})
            CREATE (p2:${Post} {content: "${BobPost}"})
            CREATE (u)-[:HAS_CONTENT]->(b)
            CREATE (u)-[:HAS_CONTENT]->(p)
            CREATE (u2)-[:HAS_CONTENT]->(p2)
            CREATE (b)-[:HAS_POST]->(p)
            CREATE (b)-[:HAS_POST]->(p2)
            `);
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
                [User.plural]: [
                    {
                        name: Alice,
                        content: [
                            {
                                title: OurBlog,
                            },
                            {
                                content: AlicePost,
                            },
                        ],
                    },
                    {
                        name: Bob,
                        content: [
                            {
                                content: BobPost,
                            },
                        ],
                    },
                ],
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
                [User.plural]: [
                    {
                        name: Alice,
                        content: [
                            {
                                title: OurBlog,
                            },
                            {},
                        ],
                    },
                    {
                        name: Bob,
                        content: [{}],
                    },
                ],
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
                [User.plural]: [
                    {
                        name: Alice,
                        content: [
                            {
                                title: OurBlog,
                            },
                        ],
                    },
                    {
                        name: Bob,
                        content: [],
                    },
                ],
            });
        });
    });

    describe("Mutations", () => {
        beforeEach(async () => {
            // clean-up for mutations
            await testHelper.executeCypher(`
                MATCH (p:${User} )
                MATCH (a:${Blog} )
                MATCH (b:${Post})
                DETACH DELETE p,a,b
            `);
        });
        test("example 4: Create User nodes with HAS_CONTENT relationship to Blog nodes", async () => {
            const Alice = `Alice ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const Bob = `Bob ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const AlicePost = `Alice's Post ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const BobPost = `Bob's Post ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const OurBlog = `Our Blog ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            const query = /* GraphQL */ `
            mutation {
                ${User.operations.create}(
                    input: [
                        {
                            name: "${Alice}"
                            content: {
                                ${Blog}: {
                                    create: [
                                        {
                                            node: {
                                                title: "${OurBlog}"
                                                posts: { 
                                                    create: [
                                                        { node: { content: "${AlicePost}" } },
                                                        { node: { content: "${BobPost}" } }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        { name: "${Bob}" }
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
                        name: Alice,
                    },
                    to: {
                        title: OurBlog,
                    },
                    relationship: {},
                },
            ]);

            await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toIncludeSameMembers([]);

            await testHelper.expectRelationship(Blog, Post, "HAS_POST").toIncludeSameMembers([
                {
                    from: {
                        title: OurBlog,
                    },
                    to: {
                        content: AlicePost,
                    },
                    relationship: {},
                },
                {
                    from: {
                        title: OurBlog,
                    },
                    to: {
                        content: BobPost,
                    },
                    relationship: {},
                },
            ]);
        });

        test("example 5: Update User nodes with HAS_CONTENT relationships to Post nodes", async () => {
            const Alice = `Alice ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const Bob = `Bob ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const AlicePost = `Alice's Post ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const BobPost = `Bob's Post ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            await testHelper.executeCypher(`
            CREATE (:${User} {name: "${Alice}"})
            CREATE (:${Post} {content: "${AlicePost}"})
            CREATE (:${User} {name: "${Bob}"})
            CREATE (:${Post} {content: "${BobPost}"})
        `);
            const queryAlice = /* GraphQL */ `
            mutation {
                ${User.operations.update}(
                   where: { name: { eq: "${Alice}" } }
                   update: {
                       content: {
                            ${Post}: [
                                {
                                    connect: [
                                        {
                                            where: { node: { content: { eq: "${AlicePost}" } } }
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
                   where: { name: { eq: "${Bob}" } }
                   update: {
                       content: {
                            ${Post}: [
                                {
                                    connect: [
                                        {
                                            where: { node: { content: { eq: "${BobPost}" } } }
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
                        name: Alice,
                    },
                    to: {
                        content: AlicePost,
                    },
                    relationship: {},
                },
                {
                    from: {
                        name: Bob,
                    },
                    to: {
                        content: BobPost,
                    },
                    relationship: {},
                },
            ]);
        });
    });
});
