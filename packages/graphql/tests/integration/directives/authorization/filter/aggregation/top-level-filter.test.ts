/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("aggregations-top_level authorization", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    afterEach(async () => {
        await testHelper.close();
    });

    test("should append auth where to predicate and return post count for this user", async () => {
        const Post = testHelper.createUniqueType("Post");
        const User = testHelper.createUniqueType("User");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID
                posts: [${Post}!]! @relationship(type: "POSTED", direction: OUT)
            }

            type ${Post} @node {
                content: String
                creator: [${User}!]! @relationship(type: "POSTED", direction: IN)
            }

            extend type ${Post}
                @authorization(
                    filter: [{ operations: [AGGREGATE], where: { node: { creator: { single: { id: { eq: "$jwt.sub" } } } } } }]
                )
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Post.operations.connection} {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
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

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})-[:POSTED]->(:${Post} {content: "authorized post 1"})
                CREATE (:${User} {id: "${userId}"})-[:POSTED]->(:${Post} {content: "authorized post 2"})
                CREATE (:${User} {id: "other-user"})-[:POSTED]->(:${Post} {content: "unauthorized post"})
            `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Post.operations.connection]: {
                aggregate: {
                    count: {
                        nodes: 2, // Now expecting 2 posts for authorized user
                    },
                },
            },
        });
    });
});
