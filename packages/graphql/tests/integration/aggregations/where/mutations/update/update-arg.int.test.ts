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

describe("Update using aggregate where", () => {
    const testHelper = new TestHelper();
    let userType: UniqueType;
    let postType: UniqueType;
    let likeInterface: UniqueType;
    let typeDefs: string;
    const postId1 = "Post1";
    const postId2 = "Post2";
    const userName = "Username1";
    const userName2 = "UsernameWithAVeryLongName";
    const originalContent = "An old boring content";
    const expectedContent = "A new wonderful content";
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
            CREATE (u)-[:LIKES { likedAt: dateTime("${date1.toISOString()}")}]->(p:${
            postType.name
        } {id: "${postId1}", content: "${originalContent}"})
            CREATE (u)-[:LIKES { likedAt: dateTime("${date2.toISOString()}")}]->(p2:${
            postType.name
        } {id: "${postId2}", content: "${originalContent}"})
            CREATE (u2)-[:LIKES { likedAt: dateTime("${date3.toISOString()}") }]->(p2)
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should update by using an aggregation count", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: {
                            where: { 
                                node: {
                                    likesAggregate: {
                                        count: 2
                                    }
                                } 
                            } 
                            update: {
                                node: {
                                    content: "${expectedContent}"
                                } 
                            } 
                        } 
                }) {
                    ${userType.plural} {
                        name
                        likedPosts {
                            id
                            content
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
                likedPosts: expect.toIncludeSameMembers([
                    { id: postId1, content: originalContent },
                    { id: postId2, content: expectedContent },
                ]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
            MATCH (u:${userType.name})-[r:LIKES]->(post:${postType.name}) 
            WHERE u.name = "${userName}" 
            RETURN post
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
        const results = storedValue.records.map((record) => record.toObject());
        expect(results).toEqual(
            expect.toIncludeSameMembers([
                {
                    post: expect.objectContaining({
                        properties: { id: postId1, content: originalContent },
                    }),
                },
                {
                    post: expect.objectContaining({
                        properties: { id: postId2, content: expectedContent },
                    }),
                },
            ])
        );
    });

    test("should update by using a nested aggregation", async () => {
        const query = `
             mutation {
                 ${userType.operations.update}(
                     where: { name: "${userName}" }
                     update: { 
                         likedPosts: {
                            where: { 
                                node: {
                                    likesAggregate: {
                                       OR: [
                                       {
                                           count: 2
                                           
                                       },
                                       {
                                           node: {
                                               name_SHORTEST_LT: 10 
                                           }
                                        }
                                       ]
                                    }
                                } 
                            } 
                             update: {
                                node: {
                                    content: "${expectedContent}"
                                }
                             } 
                         } 
                 }) {
                     ${userType.plural} {
                         name
                         likedPosts {
                             id
                             content
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
                likedPosts: expect.toIncludeSameMembers([
                    { id: postId1, content: expectedContent },
                    { id: postId2, content: expectedContent },
                ]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
             MATCH (u:${userType.name})-[r:LIKES]->(post:${postType.name}) 
             WHERE u.name = "${userName}" 
             RETURN post
             `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
        const results = storedValue.records.map((record) => record.toObject());
        expect(results).toEqual(
            expect.toIncludeSameMembers([
                {
                    post: expect.objectContaining({
                        properties: { id: postId1, content: expectedContent },
                    }),
                },
                {
                    post: expect.objectContaining({
                        properties: { id: postId2, content: expectedContent },
                    }),
                },
            ])
        );
    });

    test("should update when filtering using count, edge and node", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: {
                            where: { 
                                node: {
                                    likesAggregate: {
                                        edge: {
                                            likedAt_LT: "${date2.toISOString()}" 
                                        }
                                        node: {
                                            name_SHORTEST_LT: 10 
                                        }
                                        count: 1
                                    }
                                }
                            }
                            update: {
                                node: {
                                    content: "${expectedContent}"
                                }
                            } 
                        } 
                    }
                ) {
                    ${userType.plural} {
                        name
                        likedPosts {
                            id
                            content
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
                likedPosts: expect.toIncludeSameMembers([
                    { id: postId1, content: expectedContent },
                    { id: postId2, content: originalContent },
                ]),
            },
        ]);
        const storedValue = await testHelper.executeCypher(
            `
             MATCH (u:${userType.name})-[r:LIKES]->(post:${postType.name}) 
             WHERE u.name = "${userName}" 
             RETURN post
             `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
        const results = storedValue.records.map((record) => record.toObject());
        expect(results).toEqual(
            expect.toIncludeSameMembers([
                {
                    post: expect.objectContaining({
                        properties: { id: postId1, content: expectedContent },
                    }),
                },
                {
                    post: expect.objectContaining({
                        properties: { id: postId2, content: originalContent },
                    }),
                },
            ])
        );
    });
});
