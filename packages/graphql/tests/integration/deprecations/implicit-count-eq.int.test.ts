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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("aggregations-where-count", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                name: String!
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

    test("should return posts where the count of likes equal one", async () => {
        await testHelper.executeCypher(
            `
                    CREATE (p1:${Post} {title: "hello world"})
                    CREATE (:${Post} {title: "Post 1"})
                    CREATE (u1:${User} {name: "Alice"})
                    CREATE (u2:${User} {name: "Stefano"})
                    CREATE (p1)<-[:LIKES]-(u1)
                    CREATE (p1)<-[:LIKES]-(u2)
                `
        );

        const query = /* GraphQL */ `
                {
                    ${Post.plural}(where: { title_EQ: "hello world", likesAggregate: { count_EQ: 2 } }) {
                        title
                        likes {
                            name
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                title: "hello world",
                likes: expect.toIncludeSameMembers([{ name: "Alice" }, { name: "Stefano" }]),
            },
        ]);
    });
});

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
        await testHelper.executeCypher(
            `       CREATE (p1:${Post} {title: "hello world"})
                    CREATE (:${Post} {title: "Post 1"})
                    CREATE (u1:${User} {name: "Alice"})
                    CREATE (u2:${Person} {name: "Stefano"})
                    CREATE (p1)<-[:LIKES]-(u1)
                    CREATE (p1)<-[:LIKES]-(u2)
            `
        );

        const query = /* GraphQL */ `
                {
                    ${Post.plural}(where: { title_EQ: "hello world", likesAggregate: { count_EQ: 2 } }) {
                        title
                        likes {
                            name
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                title: "hello world",
                likes: expect.toIncludeSameMembers([{ name: "Alice" }, { name: "Stefano" }]),
            },
        ]);
    });
});
