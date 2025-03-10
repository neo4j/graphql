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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-where-count interface relationships of concrete types", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
        interface Human {
            name: String!
        }

        type ${User} implements Human @node {
            name: String!
        }

        type ${Person} implements Human @node {
            name: String!
        }

        type ${Post} @node {
            title: String!
            likes: [Human!]! @relationship(type: "LIKES", direction: IN)
        }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where the count of likes equal one", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const post4Title = "Post 4";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "Person 1";

        await testHelper.executeCypher(
            `
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (p1:${Person} {name: "${name3}"})
                CREATE (:${Post} {title: "${post1Title}"})<-[:LIKES]-(u1)
                CREATE (p:${Post} {title: "${post2Title}"})<-[:LIKES]-(u1)
                CREATE (p)<-[:LIKES]-(p1)
                CREATE (:${Post} {title: "${post3Title}"})
                CREATE (:${Post} {title: "${post4Title}"})<-[:LIKES]-(u2)
            `
        );

        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: {
                    likesConnection: { 
                        aggregate: { 
                            count: { nodes: { eq: 1 } } 
                        } 
                    } 
                }) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toHaveLength(2);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                title: post1Title,
                likes: [{ name: name1 }],
            },
            {
                title: post4Title,
                likes: [{ name: name2 }],
            },
        ]);
    });

    test("should return posts where the count of likes LT one", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const post4Title = "Post 4";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "Person 1";

        await testHelper.executeCypher(
            `
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (p1:${Person} {name: "${name3}"})
                CREATE (:${Post} {title: "${post1Title}"})
                CREATE (:${Post} {title: "${post2Title}"})<-[:LIKES]-(u1)
                CREATE (:${Post} {title: "${post3Title}"})
                CREATE (p:${Post} {title: "${post4Title}"})<-[:LIKES]-(u2)
                CREATE (p)<-[:LIKES]-(p1)
            `
        );

        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: {
                    likesConnection: { 
                        aggregate: { 
                            count: { nodes: { lt: 1 } } 
                        } 
                    } 
                }) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toHaveLength(2);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                title: post1Title,
                likes: [],
            },
            {
                title: post3Title,
                likes: [],
            },
        ]);
    });

    test("should return posts where the count of likes LTE one", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const post4Title = "Post 4";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "Person 1";

        await testHelper.executeCypher(
            `
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (p1:${Person} {name: "${name3}"})
                CREATE (:${Post} {title: "${post1Title}"})
                CREATE (:${Post} {title: "${post2Title}"})<-[:LIKES]-(u1)
                CREATE (p:${Post} {title: "${post3Title}"})<-[:LIKES]-(u1)
                CREATE (p)<-[:LIKES]-(p1)
                CREATE (:${Post} {title: "${post4Title}"})<-[:LIKES]-(u2)
            `
        );

        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: {
                    likesConnection: { 
                        aggregate: { 
                            count: { nodes: { lte: 1 } } 
                        } 
                    } 
                }) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toHaveLength(3);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                title: post1Title,
                likes: [],
            },
            {
                title: post2Title,
                likes: [{ name: name1 }],
            },
            {
                title: post4Title,
                likes: [{ name: name2 }],
            },
        ]);
    });

    test("should return posts where the count of likes GT one", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const post4Title = "Post 4";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "Person 1";
        const name4 = "Person 2";

        await testHelper.executeCypher(
            `
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (p1:${Person} {name: "${name3}"})
                CREATE (p2:${Person} {name: "${name4}"})
                CREATE (p1post:${Post} {title: "${post1Title}"})<-[:LIKES]-(u1)
                CREATE (p1post)<-[:LIKES]-(p1)
                CREATE (p2post:${Post} {title: "${post2Title}"})<-[:LIKES]-(u1)
                CREATE (p2post)<-[:LIKES]-(u2)
                CREATE (p2post)<-[:LIKES]-(p2)
                CREATE (:${Post} {title: "${post3Title}"})<-[:LIKES]-(u1)
                CREATE (:${Post} {title: "${post4Title}"})
            `
        );

        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: {
                    likesConnection: { 
                        aggregate: { 
                            count: { nodes: { gt: 1 } } 
                        } 
                    } 
                }) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toHaveLength(2);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                title: post1Title,
                likes: expect.toIncludeSameMembers([{ name: name1 }, { name: name3 }]),
            },
            {
                title: post2Title,
                likes: expect.toIncludeSameMembers([{ name: name1 }, { name: name2 }, { name: name4 }]),
            },
        ]);
    });

    test("should return posts where the count of likes GTE one", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const post4Title = "Post 4";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "Person 1";
        const name4 = "Person 2";

        await testHelper.executeCypher(
            `
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (p1:${Person} {name: "${name3}"})
                CREATE (p2:${Person} {name: "${name4}"})
                CREATE (:${Post} {title: "${post1Title}"})
                CREATE (:${Post} {title: "${post2Title}"})<-[:LIKES]-(u1)
                CREATE (p1post:${Post} {title: "${post3Title}"})<-[:LIKES]-(u1)
                CREATE (p1post)<-[:LIKES]-(p1)
                CREATE (p2post:${Post} {title: "${post4Title}"})<-[:LIKES]-(u2)
                CREATE (p2post)<-[:LIKES]-(p1)
                CREATE (p2post)<-[:LIKES]-(p2)
            `
        );

        const query = /* GraphQL */ `
            {
                ${Post.plural}(where: {
                    likesConnection: { 
                        aggregate: { 
                            count: { nodes: { gte: 1 } } 
                        } 
                    } 
                }) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toHaveLength(3);
        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                title: post2Title,
                likes: [{ name: name1 }],
            },
            {
                title: post3Title,
                likes: expect.toIncludeSameMembers([{ name: name1 }, { name: name3 }]),
            },
            {
                title: post4Title,
                likes: expect.toIncludeSameMembers([{ name: name2 }, { name: name3 }, { name: name4 }]),
            },
        ]);
    });
});
