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

import { gql } from "apollo-server";
import { graphql } from "graphql";
import { Driver, Session } from "neo4j-driver";
import neo4j from "../neo4j";
import { generateUniqueType } from "../../../src/utils/test/graphql-types";
import { Neo4jGraphQL } from "../../../src";

describe("Empty fields on unions due to escaped labels", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    const typeBlog = generateUniqueType("Blog");
    const typePost = generateUniqueType("Post");
    const typeUser = generateUniqueType("User");

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = gql`
            union Content = Blog | Post

            type Blog @node(label: "${typeBlog.name}") {
                title: String
                posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
            }

            type Post @node(label: "${typePost.name}") {
                content: String
            }

            type User @node(label: "${typeUser.name}") {
                name: String
                content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        try {
            session = driver.session();
            await session.run(`CREATE (u:${typeUser.name} {name: "dan"})
              CREATE (b:${typeBlog.name} {title:"my cool blog"})
              CREATE (p:${typePost.name} {content: "my cool post"})

              MERGE(u)-[:HAS_CONTENT]->(b)
              MERGE(b)-[:HAS_POST]->(p)
            `);
        } finally {
            await session.close();
        }
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
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
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            users: [{ name: "dan", content: [{ title: "my cool blog" }] }],
        });
    });
});
