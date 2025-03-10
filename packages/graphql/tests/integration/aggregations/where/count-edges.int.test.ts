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

describe("aggregation where count edges", () => {
    const testHelper = new TestHelper();
    let Post: UniqueType;
    let User: UniqueType;

    beforeEach(async () => {
        Post = testHelper.createUniqueType("Post");
        User = testHelper.createUniqueType("User");
        const typeDefs = /* GraphQL */ `
            type ${Post} @node {
                title: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: OUT, properties: "likesProperties")
            }

            type likesProperties @relationshipProperties {
                since: DateTime!
            }

            type ${User} @node {
                name: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
            CREATE (u1:${User} { name: "Alice" })
            CREATE (u2:${User} { name: "Bob" })
            CREATE (u3:${User} { name: "Frank" })
            
            CREATE (p1:${Post} { title: "Post A" })
            CREATE (p2:${Post} { title: "Post B" })
            CREATE (p3:${Post} { title: "Post C" })

            CREATE (p1)-[:LIKES]->(u1)
            CREATE (p1)-[:LIKES]->(u2)
            
            CREATE (p2)-[:LIKES]->(u1)
            CREATE (p2)-[:LIKES]->(u1)
            CREATE (p2)-[:LIKES]->(u2)
            
            CREATE (p3)-[:LIKES]->(u1)
            CREATE (p3)-[:LIKES]->(u2)
            CREATE (p3)-[:LIKES]->(u3)
            `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where the count of outgoing likes edges is equal 2", async () => {
        const query = /* GraphQL */ `
            {
                ${Post.plural}(
                    where: { likesConnection: { aggregate: { count: { edges: { eq: 2 } } } } }
                ) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.data).toBeDefined();
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data![Post.plural]).toHaveLength(1);
        expect(gqlResult.data![Post.plural]).toIncludeSameMembers([
            {
                title: "Post A",
                likes: expect.toIncludeSameMembers([{ name: "Alice" }, { name: "Bob" }]),
            },
        ]);
    });

    test("should return posts where the count of outgoing likes edges is greater than 2", async () => {
        const query = /* GraphQL */ `
            {
                ${Post.plural}(
                    where: { likesConnection: { aggregate: { count: { edges: { gt: 2 } } } } }
                ) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.data).toBeDefined();
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data![Post.plural]).toHaveLength(2);
        expect(gqlResult.data![Post.plural]).toIncludeSameMembers([
            {
                title: "Post B",
                likes: expect.toIncludeSameMembers([{ name: "Alice" }, { name: "Bob" }]),
            },
            {
                title: "Post C",
                likes: expect.toIncludeSameMembers([{ name: "Alice" }, { name: "Bob" }, { name: "Frank" }]),
            },
        ]);
    });
    
    test("should filter correctly when multiple edges are connected to the same node", async () => {
        const query = /* GraphQL */ `
            {
                ${Post.plural}(
                    where: { likesConnection: { aggregate: { count: { edges: { eq: 3 }, nodes: { eq: 2 } } } } }
                ) {
                    title
                    likes {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.data).toBeDefined();
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data![Post.plural]).toHaveLength(1);
        expect(gqlResult.data![Post.plural]).toIncludeSameMembers([
            {
                title: "Post B",
                likes: expect.toIncludeSameMembers([{ name: "Alice" }, { name: "Bob" }]),
            },
        ]);
    });
});
