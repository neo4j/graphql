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

import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Connect using aggregate where", () => {
    const testHelper = new TestHelper();
    let userType: UniqueType;
    let postType: UniqueType;
    let likeInterface: UniqueType;
    let typeDefs: string;
    const postId1 = "Post1";
    const postId2 = "Post2";
    const postId3 = "Post3";
    const userName = "Username1";
    const userName2 = "UsernameWithAVeryLongName";
    const userName3 = "_";
    const date1 = new Date("2022-01-09T18:46:40.000Z");
    const date2 = new Date("2022-05-01T18:46:40.000Z");
    const date3 = new Date("2022-08-11T10:06:25.000Z");

    beforeEach(async () => {
        userType = testHelper.createUniqueType("User");
        postType = testHelper.createUniqueType("Post");
        likeInterface = testHelper.createUniqueType("LikeEdge");
        typeDefs = `
            type ${userType.name} {
                name: String!
                likedPosts: [${postType.name}!]! @relationship(type: "LIKES", direction: OUT, properties: "${likeInterface.name}")
            }
    
            type ${postType.name} {
                id: ID
                content: String!
                likes: [${userType.name}!]! @relationship(type: "LIKES", direction: IN, properties: "${likeInterface.name}")
            }

            type ${likeInterface.name} @relationshipProperties {
                likedAt: DateTime
            }
        `;

        await testHelper.executeCypher(`
            CREATE (u:${userType.name} {name: "${userName}"})
            CREATE (u2:${userType.name} {name: "${userName2}"})
            CREATE (u3:${userType.name} {name: "${userName3}"})
            CREATE (u)-[:LIKES { likedAt: dateTime("${date1.toISOString()}")}]->(p:${postType.name} {id: "${postId1}"})
            CREATE (u2)-[:LIKES { likedAt: dateTime("${date2.toISOString()}")}]->(p2:${
            postType.name
        } {id: "${postId2}"})
            CREATE (u3)-[:LIKES { likedAt: dateTime("${date3.toISOString()}")}]->(p2)
            CREATE (p3:${postType.name} {id: "${postId3}"})
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should connect by using an aggregation count", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: { 
                            connect: { 
                                where: { 
                                    node: {
                                        likesAggregate: {
                                            count: 2
                                        }
                                    } 
                                } 
                            } 
                        } 
                }) {
                    ${userType.plural} {
                        name
                        likedPosts {
                            id
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([
            { name: userName, likedPosts: expect.toIncludeSameMembers([{ id: postId1 }, { id: postId2 }]) },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
            WHERE u.name = "${userName}" 
            RETURN p
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });

    test("should connect by using a nested aggregation", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: { 
                            connect: { 
                                where: { 
                                    node: {
                                        likesAggregate: {
                                            OR: [
                                                {
                                                    count: 2
                                                },
                                                {
                                                    count: 0
                                                }
                                            ]
                                        }
                                    } 
                                } 
                            } 
                        } 
                }) {
                    ${userType.plural} {
                        name
                        likedPosts {
                            id
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([
            {
                name: userName,
                likedPosts: expect.toIncludeSameMembers([{ id: postId1 }, { id: postId2 }, { id: postId3 }]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
            WHERE u.name = "${userName}" 
            RETURN p
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(3);
    });

    test("should connect when using count, edge and node filters", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: {
                            connect: {
                                where: { 
                                    node: {
                                        likesAggregate: {
                                            AND: [
                                                {   
                                                    edge: {
                                                        likedAt_MIN_LTE: "${date2.toISOString()}" 
                                                    }
                                                },
                                                {
                                                    node: {
                                                        name_SHORTEST_LT: 2 
                                                    }
                                                    count: 2
                                                }
                                            ]
                                        }
                                    }
                                } 
                            } 
                        } 
                    }
                ) {
                    ${userType.plural} {
                        name
                        likedPosts {
                            id
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([
            {
                name: userName,
                likedPosts: expect.toIncludeSameMembers([{ id: postId1 }, { id: postId2 }]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
            WHERE u.name = "${userName}" 
            RETURN p
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });

    test("should connect when using count, edge and node filters with NOT", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: {
                            connect: {
                                where: { 
                                    node: {
                                        likesAggregate: {
                                            AND: [
                                                {   
                                                    edge: {
                                                        likedAt_MIN_LTE: "${date2.toISOString()}" 
                                                    }
                                                },
                                                {
                                                    node: {
                                                        NOT: { name_SHORTEST_GTE: 2 } 
                                                    }
                                                    count: 2
                                                }
                                            ]
                                        }
                                    }
                                } 
                            } 
                        } 
                    }
                ) {
                    ${userType.plural} {
                        name
                        likedPosts {
                            id
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([
            {
                name: userName,
                likedPosts: expect.toIncludeSameMembers([{ id: postId1 }, { id: postId2 }]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
            WHERE u.name = "${userName}" 
            RETURN p
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });
});

describe("Connect UNIONs using aggregate where", () => {
    const testHelper = new TestHelper();
    let userType: UniqueType;
    let specialUserType: UniqueType;
    let postType: UniqueType;
    let likeInterface: UniqueType;
    let userUnion: UniqueType;
    let typeDefs: string;
    const postId1 = "Post1";
    const postId2 = "Post2";
    const postId3 = "Post3";
    const userName = "Username1";
    const userName2 = "UsernameWithAVeryLongName";
    const userName3 = "_";
    const userName4 = "ABC";
    const date1 = new Date("2022-01-09T18:46:40.000Z");
    const date2 = new Date("2022-05-01T18:46:40.000Z");
    const date3 = new Date("2022-08-11T10:06:25.000Z");
    const content = "someContent";
    const content2 = "1234";
    const content3 = "Post 3 has some long content";

    beforeEach(async () => {
        userType = testHelper.createUniqueType("User");
        specialUserType = testHelper.createUniqueType("SpecialUser");
        postType = testHelper.createUniqueType("Post");
        likeInterface = testHelper.createUniqueType("LikeEdge");
        userUnion = testHelper.createUniqueType("UserUnion");
        typeDefs = `
            type ${userType.name} {
                name: String!
                likedPosts: [${postType.name}!]! @relationship(type: "LIKES", direction: OUT, properties: "${likeInterface.name}")
            }

            type ${specialUserType.name} {
                specialName: String!
                likedPosts: [${postType.name}!]! @relationship(type: "LIKES", direction: OUT, properties: "${likeInterface.name}")
            }

            union ${userUnion.name} = ${userType.name} | ${specialUserType.name}
    
            type ${postType.name} {
                id: ID
                content: String!
                likes: [${userUnion.name}!]! @relationship(type: "LIKES", direction: IN, properties: "${likeInterface.name}")
            }

            type ${likeInterface.name} @relationshipProperties {
                likedAt: DateTime
            }
        `;

        await testHelper.executeCypher(`
            CREATE (u:${specialUserType.name} {specialName: "${userName}"})
            CREATE (u2:${userType.name} {name: "${userName2}"})
            CREATE (u3:${userType.name} {name: "${userName3}"})
            CREATE (u4:${specialUserType.name} {specialName: "${userName4}"})
            CREATE (u)-[:LIKES { likedAt: dateTime("${date1.toISOString()}")}]->(p:${
            postType.name
        } {id: "${postId1}", content: "${content}" })
            CREATE (u2)-[:LIKES { likedAt: dateTime("${date2.toISOString()}")}]->(p2:${
            postType.name
        } {id: "${postId2}", content: "${content2}" })
            CREATE (u3)-[:LIKES { likedAt: dateTime("${date3.toISOString()}")}]->(p2)
            CREATE (p3:${postType.name} {id: "${postId3}", content: "${content3}" })
            CREATE (u)-[:LIKES { likedAt: dateTime("${date3.toISOString()}")}]->(p2)
            CREATE (u3)-[:LIKES { likedAt: dateTime("${date1.toISOString()}")}]->(p2)
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should connect by using an aggregation count", async () => {
        const query = `
            mutation {
                ${postType.operations.update}(
                    where: { id: "${postId3}" }
                    connect: {
                        likes: {
                            ${specialUserType.name}: {
                                where: {
                                    node: {
                                        likedPostsAggregate: {
                                            count: 2
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${postType.plural} {
                        id
                        likes {
                            ... on ${specialUserType.name} {
                                specialName
                            }
                            ... on ${userType.name} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[postType.operations.update][postType.plural] as any[];
        expect(users).toEqual([{ id: postId3, likes: expect.toIncludeSameMembers([{ specialName: userName }]) }]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${specialUserType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId3}"
            RETURN u
            UNION
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId3}" 
            RETURN u
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(1);
    });

    test("should connect by using a nested aggregation count", async () => {
        const query = `
            mutation {
                ${postType.operations.update}(
                    where: { id: "${postId1}" }
                    connect: {
                        likes: {
                            ${userType.name}: {
                                where: {
                                    node: {
                                        OR: [
                                            {
                                                likedPostsAggregate: {
                                                    count_LT: 2
                                                }
                                            },
                                            {
                                                likedPostsAggregate: {
                                                    edge: {
                                                        likedAt_MAX_GT: "${date2.toISOString()}"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${postType.plural} {
                        id
                        likes {
                            ... on ${specialUserType.name} {
                                specialName
                            }
                            ... on ${userType.name} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[postType.operations.update][postType.plural] as any[];
        expect(users).toEqual([
            {
                id: postId1,
                likes: expect.toIncludeSameMembers([
                    { specialName: userName },
                    { name: userName2 },
                    { name: userName3 },
                ]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${specialUserType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId1}"
            RETURN u
            UNION
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId1}" 
            RETURN u
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(3);
    });

    test("should connect when using count, edge and node filters", async () => {
        const query = `
            mutation {
                ${postType.operations.update}(
                    where: { id: "${postId1}" }
                    connect: {
                        likes: {
                            ${specialUserType.name}: {
                                where: {
                                    node: {
                                        OR: [
                                            {
                                                likedPostsAggregate: {
                                                    count_LT: 1
                                                }
                                            },
                                            {
                                                AND: [
                                                    {
                                                        likedPostsAggregate: {
                                                            edge: {
                                                                likedAt_MAX_GT: "${date2.toISOString()}"
                                                            }
                                                        }
                                                    },
                                                    {
                                                        likedPostsAggregate: {
                                                            node: {
                                                                content_SHORTEST_LTE: 5
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${postType.plural} {
                        id
                        likes {
                            ... on ${specialUserType.name} {
                                specialName
                            }
                            ... on ${userType.name} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[postType.operations.update][postType.plural] as any[];
        expect(users).toEqual([
            {
                id: postId1,
                likes: expect.toIncludeSameMembers([{ specialName: userName }, { specialName: userName4 }]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${specialUserType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId1}"
            RETURN u
            UNION
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId1}" 
            RETURN u
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });
});
