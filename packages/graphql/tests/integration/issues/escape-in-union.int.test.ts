/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
                    content(where: { Blog: { NOT: { title_EQ: null  } } }) {
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
