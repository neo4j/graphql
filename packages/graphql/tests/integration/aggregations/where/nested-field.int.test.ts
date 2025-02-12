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

describe("aggregations nested field", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;
    let Country: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Country = testHelper.createUniqueType("Address");

        const typeDefs = /* GraphQL */ `
            type ${Country} @node {
                name: String!
            }

            type ${User} @node {
                name: String!
                citizenship: [${Country}!]! @relationship(type: "CITIZEN_OF", direction: OUT)
            }

            type ${Post} @node {
              title: String!
              engagedUsers: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return Post and project only engagedUsers with exactly 2 citizenship", async () => {
        const post1Title = "Post 1";
        const post2Title = "Post 2";
        const post3Title = "Post 3";
        const name1 = "User 1";
        const name2 = "User 2";
        const name3 = "User 3";

        await testHelper.executeCypher(
            `
                CREATE (italy:${Country} {name: "Italy"})
                CREATE (france:${Country} {name: "France"})
                CREATE (spain:${Country} {name: "Spain"})
                
                CREATE (u1:${User} {name: "${name1}"})
                CREATE (u2:${User} {name: "${name2}"})
                CREATE (u3:${User} {name: "${name3}"})

                CREATE (u1)-[:CITIZEN_OF]->(italy)
                CREATE (u1)-[:CITIZEN_OF]->(france)
                CREATE (u2)-[:CITIZEN_OF]->(spain)
                CREATE (u3)-[:CITIZEN_OF]->(italy)
             
                CREATE (p1:${Post} {title: "${post1Title}"})
                CREATE (p2:${Post} {title: "${post2Title}"})
                CREATE (p3:${Post} {title: "${post3Title}"})

                CREATE (p1)<-[:LIKES]-(u1)
                CREATE (p2)<-[:LIKES]-(u2)
                CREATE (p2)<-[:LIKES]-(u3)
            `
        );
        // find all posts and their engaged users who have citizenship in exactly two countries
        const query = /* GraphQL */ `
            {
                ${Post.plural} {
                    title
                    engagedUsers(where: {
                        citizenshipConnection: { 
                            aggregate: { 
                                count: { nodes: { eq: 2 } } 
                            } 
                        }
                    } ) {
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
                engagedUsers: [{ name: name1 }],
            },
            {
                title: post2Title,
                engagedUsers: [],
            },
            {
                title: post3Title,
                engagedUsers: [],
            },
        ]);
    });
});
