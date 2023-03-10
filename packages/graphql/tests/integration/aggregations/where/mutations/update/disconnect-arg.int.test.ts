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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../../../../neo4j";
import { Neo4jGraphQL } from "../../../../../../src/classes";
import { UniqueType } from "../../../../../utils/graphql-types";
import { cleanNodes } from "../../../../../utils/clean-nodes";

describe("Disconnect using aggregate where", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    let userType: UniqueType;
    let postType: UniqueType;
    let likeInterface: UniqueType;
    let typeDefs: string;
    const postId1 = "Post1";
    const postId2 = "Post2";
    const userName = "Username1";
    const userName2 = "UsernameWithAVeryLongName";
    const date1 = new Date("2022-01-09T18:46:40.000Z");
    const date2 = new Date("2022-05-01T18:46:40.000Z");
    const date3 = new Date("2022-08-11T10:06:25.000Z");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
        userType = new UniqueType("User");
        postType = new UniqueType("Post");
        likeInterface = new UniqueType("LikeEdge");
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

            interface ${likeInterface.name} {
                likedAt: DateTime
            }
        `;

        await session.run(`
            CREATE (u:${userType.name} {name: "${userName}"})
            CREATE (u2:${userType.name} {name: "${userName2}"})
            CREATE (u)-[:LIKES { likedAt: dateTime("${date1.toISOString()}")}]->(p:${postType.name} {id: "${postId1}"})
            CREATE (u)-[:LIKES { likedAt: dateTime("${date2.toISOString()}")}]->(p2:${postType.name} {id: "${postId2}"})
            CREATE (u2)-[:LIKES { likedAt: dateTime("${date3.toISOString()}")}]->(p2)
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [userType, postType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should disconnect by using an aggregation count", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: { 
                            disconnect: { 
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([{ name: userName, likedPosts: expect.toIncludeSameMembers([{ id: postId1 }]) }]);
        const storedValue = await session.run(
            `
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
            WHERE u.name = "${userName}" 
            RETURN p
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(1);
    });

    test("should disconnect by using a nested aggregation", async () => {
        const query = `
             mutation {
                 ${userType.operations.update}(
                     where: { name: "${userName}" }
                     update: { 
                         likedPosts: { 
                             disconnect: { 
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([{ name: userName, likedPosts: [] }]);
        const storedValue = await session.run(
            `
             MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
             WHERE u.name = "${userName}" 
             RETURN p
             `,
            {}
        );
        expect(storedValue.records).toHaveLength(0);
    });

    test("should disconnect when filtering using aggregate count, edge and node", async () => {
        const query = `
            mutation {
                ${userType.operations.update}(
                    where: { name: "${userName}" }
                    update: { 
                        likedPosts: {
                            disconnect: {
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
                                                        name_SHORTEST_GT: 2 
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
        expect(users).toEqual([{ name: userName, likedPosts: [{ id: postId1 }] }]);
        const storedValue = await session.run(
            `
             MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name}) 
             WHERE u.name = "${userName2}" 
             RETURN p
             `,
            {}
        );
        expect(storedValue.records).toHaveLength(1);
    });
});

describe("Disconnect UNIONs using aggregate where", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
        userType = new UniqueType("User");
        specialUserType = new UniqueType("SpecialUser");
        postType = new UniqueType("Post");
        likeInterface = new UniqueType("LikeEdge");
        userUnion = new UniqueType("UserUnion");
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

            interface ${likeInterface.name} {
                likedAt: DateTime
            }
        `;

        await session.run(`
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [userType, postType, specialUserType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should disconnect by using an aggregation count", async () => {
        const query = `
            mutation {
                ${postType.operations.update}(
                    where: { id: "${postId2}" }
                    disconnect: {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[postType.operations.update][postType.plural] as any[];
        expect(users).toEqual([
            { id: postId2, likes: expect.toIncludeSameMembers([{ name: userName2 }, { name: userName3 }]) },
        ]);
        const storedValue = await session.run(
            `
            MATCH (u:${specialUserType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}"
            RETURN u
            UNION
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}" 
            RETURN u
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });

    test("should disconnect by using a nested aggregation count", async () => {
        const query = `
            mutation {
                ${postType.operations.update}(
                    where: { id: "${postId2}" }
                    disconnect: {
                        likes: {
                            ${userType.name}: {
                                where: {
                                    node: {
                                        AND: [
                                            {
                                                likedPostsAggregate: {
                                                    count: 2
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[postType.operations.update][postType.plural] as any[];
        expect(users).toEqual([
            {
                id: postId2,
                likes: expect.toIncludeSameMembers([{ specialName: userName }, { name: userName2 }]),
            },
        ]);
        const storedValue = await session.run(
            `
            MATCH (u:${specialUserType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}"
            RETURN u
            UNION
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}" 
            RETURN u
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });

    test("should disconnect by using a nested aggregation count, with NOT operator", async () => {
        const query = `
            mutation {
                ${postType.operations.update}(
                    where: { id: "${postId2}" }
                    disconnect: {
                        likes: {
                            ${userType.name}: {
                                where: {
                                    node: {
                                        AND: [
                                            {
                                                likedPostsAggregate: {
                                                    count: 2
                                                }
                                            },
                                            {
                                                likedPostsAggregate: {
                                                    edge: {
                                                        NOT: { likedAt_MAX_LTE: "${date2.toISOString()}" }
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[postType.operations.update][postType.plural] as any[];
        expect(users).toEqual([
            {
                id: postId2,
                likes: expect.toIncludeSameMembers([{ specialName: userName }, { name: userName2 }]),
            },
        ]);
        const storedValue = await session.run(
            `
            MATCH (u:${specialUserType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}"
            RETURN u
            UNION
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}" 
            RETURN u
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(2);
    });

    test("should disconnect when filtering using aggregate count, edge and node", async () => {
        const query = `
            mutation {
                ${postType.operations.update}(
                    where: { id: "${postId2}" }
                    disconnect: {
                        likes: {
                            ${userType.name}: {
                                where: {
                                    node: {
                                        OR: [
                                            {
                                                AND: [
                                                    {
                                                        likedPostsAggregate: {
                                                            count: 2
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
                                            },
                                            {
                                                likedPostsAggregate: {
                                                    node: {
                                                        content_AVERAGE_LTE: 4
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const users = (gqlResult.data as any)[postType.operations.update][postType.plural] as any[];
        expect(users).toEqual([
            {
                id: postId2,
                likes: expect.toIncludeSameMembers([{ specialName: userName }]),
            },
        ]);
        const storedValue = await session.run(
            `
            MATCH (u:${specialUserType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}"
            RETURN u
            UNION
            MATCH (u:${userType.name})-[r:LIKES]->(p:${postType.name})
            WHERE p.id = "${postId2}" 
            RETURN u
            `,
            {}
        );
        expect(storedValue.records).toHaveLength(1);
    });
});
