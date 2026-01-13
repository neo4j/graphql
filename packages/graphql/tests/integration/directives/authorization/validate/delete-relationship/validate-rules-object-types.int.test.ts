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

import { generate } from "randomstring";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Validate rules on delete relationship operations", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;
    let Post: UniqueType;
    let Comment: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Comment = testHelper.createUniqueType("Comment");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("AFTER rules", () => {
        test("should throw forbidden when disconnecting a node property with invalid bind", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: ID
                }

                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [DELETE_RELATIONSHIP], where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Post.operations.update}(
                        where: { id_EQ: "${postId}" },
                        update: {
                            creator: {
                                disconnect: {
                                    where: { node: { id_EQ: "${userId}" } }
                                }
                            }
                        }
                    ) {
                        ${Post.plural} {
                            id
                        }
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${Post} {id: "${postId}"})<-[:HAS_POST]-(:${User} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("BEFORE rules", () => {
        test("should throw Forbidden when disconnecting a node with invalid allow", async () => {
            const typeDefs = `
                type ${Post.name} @node {
                    id: ID
                    creator: [${User.name}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User.name} @node {
                    id: ID
                    posts: [${Post.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post.name} @authorization(validate: [ { operations: [DELETE_RELATIONSHIP], when: BEFORE, where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.update}(
                        where: { id_EQ: "${userId}" }
                        update: { posts: { disconnect: { where: { node: { id_EQ: "${postId}" } } } } }
                    ) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${User.name} {id: "${userId}"})-[:HAS_POST]->(:${Post.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when disconnecting a nested node with invalid allow", async () => {
            const typeDefs = `
                type ${Comment.name} @node {
                    id: ID
                    content: String
                    post: [${Post.name}!]! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${Post.name} @node {
                    id: ID
                    creator: [${User.name}!]! @relationship(type: "HAS_POST", direction: IN)
                    comments: [${Comment.name}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${User.name} @node {
                    id: ID
                    posts: [${Post.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post.name} @authorization(validate: [ { operations: [DELETE_RELATIONSHIP], when: BEFORE, where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const commentId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${Comment.operations.update}(
                        where: { id_EQ: "${commentId}" }
                        update: {
                            post: {
                                disconnect: {
                                    disconnect: {
                                        creator: {
                                            where: { node: { id_EQ: "${userId}" } }
                                        }
                                    }
                                }
                            }
                        }
                    ) {
                        ${Comment.plural} {
                            id
                        }
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${User.name} {id: "${userId}"})-[:HAS_POST]->
                                (:${Post.name} {id: "${postId}"})-[:HAS_COMMENT]->
                                    (:${Comment.name} {id: "${commentId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});
