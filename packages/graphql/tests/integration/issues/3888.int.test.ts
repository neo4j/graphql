/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3888", () => {
    const testHelper = new TestHelper();

    const secret = "secret";

    let Post: UniqueType;
    let User: UniqueType;

    beforeEach(async () => {
        Post = testHelper.createUniqueType("Post");
        User = testHelper.createUniqueType("User");

        const typeDefs = `
            type ${User} @node {
                id: ID!
            }

            type ${Post} @authorization(filter: [{ where: { node: { author_SOME: { id_EQ: "$jwt.sub" } } } }]) @node {
                title: String!
                content: String!
                author: [${User}!]! @relationship(type: "AUTHORED", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not raise cardinality error when connecting on create", async () => {
        const createUser = `
            mutation {
                ${User.operations.create}(input: [{ id: "michel" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        const createPost = `
            mutation {
                ${Post.operations.create}(
                    input: [
                        { title: "Test1", content: "Test1", author: { connect: { where: { node: { id_EQ: "michel" } } } } }
                    ]
                ) {
                    ${Post.plural} {
                        title
                        author {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel" });

        const createUserResult = await testHelper.executeGraphQLWithToken(createUser, token);

        expect(createUserResult.errors).toBeFalsy();

        const createPostResult = await testHelper.executeGraphQLWithToken(createPost, token);

        expect(createPostResult.errors).toBeFalsy();
        expect(createPostResult.data).toEqual({
            [Post.operations.create]: {
                [Post.plural]: [
                    {
                        title: "Test1",
                        author: [
                            {
                                id: "michel",
                            },
                        ],
                    },
                ],
            },
        });
    });
});
