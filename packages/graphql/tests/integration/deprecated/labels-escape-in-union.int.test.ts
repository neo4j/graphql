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
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("Empty fields on unions due to escaped labels", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    const typeBlog = new UniqueType("Blog");
    const typePost = new UniqueType("Post");
    const typeUser = new UniqueType("User");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = gql`
            union Content = Blog | Post

            type Blog @node(label: "${typeBlog.name}") {
                title: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            type Post @node(label: "${typePost.name}") {
                content: String
            }

            type User @node(label: "${typeUser.name}") {
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = await neo4j.getSession();
        await session.run(`CREATE (u:${typeUser.name} {name: "dan"})
              CREATE (b:${typeBlog.name} {title:"my cool blog"})
              CREATE (p:${typePost.name} {content: "my cool post"})

              MERGE(u)-[:HAS_CONTENT]->(b)
              MERGE(b)-[:HAS_POST]->(p)
            `);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
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

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            users: [{ name: "dan", content: [{ title: "my cool blog" }] }],
        });
    });
});
