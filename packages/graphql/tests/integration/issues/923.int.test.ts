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

import { gql } from "graphql-tag";
import type { Integer } from "neo4j-driver";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/923", () => {
    const testHelper = new TestHelper();

    let testBlogpost: UniqueType;
    let testCategory: UniqueType;

    beforeAll(async () => {
        testBlogpost = testHelper.createUniqueType("BlogPost");
        testCategory = testHelper.createUniqueType("Category");
        // driver = await neo4j.getDriver();

        const typeDefs = gql`
            type ${testBlogpost.name} @fulltext(indexes: [{ name: "BlogTitle", fields: ["title"] }]) {
                title: String!
                slug: String! @unique
            }
            type ${testCategory.name} {
                name: String! @unique
                blogs: [${testBlogpost.name}!]! @relationship(type: "IN_CATEGORY", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should query nested connection", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${testCategory.operations.create}(
                    input: [
                        {
                            blogs: {
                                connectOrCreate: [
                                    {
                                        where: { node: { slug: "dsa" } }
                                        onCreate: { node: { title: "mytitle", slug: "myslug" } }
                                    }
                                ]
                            }
                            name: "myname"
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: {
                    sub: "test",
                },
            },
        });
        expect(result.errors).toBeUndefined();

        const blogPostCount = await testHelper.executeCypher(`
          MATCH (m:${testBlogpost.name} { slug: "myslug" })
          RETURN COUNT(m) as count
        `);
        expect((blogPostCount.records[0]?.toObject().count as Integer).toNumber()).toBe(1);
    });
});
