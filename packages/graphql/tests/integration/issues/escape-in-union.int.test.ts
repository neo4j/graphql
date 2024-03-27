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

describe("Empty fields on unions due to escaped labels", () => {
    const testHelper = new TestHelper();

    let typeBlog: UniqueType;
    let typePost: UniqueType;
    let typeUser: UniqueType;

    beforeAll(async () => {
        typeBlog = testHelper.createUniqueType("Blog");
        typePost = testHelper.createUniqueType("Post");
        typeUser = testHelper.createUniqueType("User");

        const typeDefs = /* GraphQL */ `
            union Content = Blog | Post

            type Blog @node(labels: ["${typeBlog.name}"]) {
                title: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            type Post @node(labels: ["${typePost.name}"]) {
                content: String
            }

            type User @node(labels: ["${typeUser.name}"]) {
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`CREATE (u:${typeUser.name} {name: "dan"})
              CREATE (b:${typeBlog.name} {title:"my cool blog"})
              CREATE (p:${typePost.name} {content: "my cool post"})

              MERGE(u)-[:HAS_CONTENT]->(b)
              MERGE(b)-[:HAS_POST]->(p)
            `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return users and unions", async () => {
        const query = `
            query GetUsersWithAllContent {
                users {
                    name
                    content(where: { Blog: { title_NOT: null } }) {
                        ... on Blog {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            users: [{ name: "dan", content: [{ title: "my cool blog" }] }],
        });
    });
});
