/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Validate rules on create relationship operations", () => {
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
        test("should not throw forbidden when connecting a node property when bind is valid", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: ID
                }

                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE_RELATIONSHIP], where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
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
                                connect: {
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
                    CREATE (:${Post} {id: "${postId}"})
                    CREATE (:${User} {id: "not bound"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });
        test("should throw forbidden when connecting a node property with invalid bind", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: ID
                }

                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE_RELATIONSHIP], where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
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
                                connect: {
                                    where: { node: { id_EQ: "not bound" } }
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
                    CREATE (:${Post} {id: "${postId}"})
                    CREATE (:${User} {id: "not bound"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("BEFORE rules", () => {
        test("should not throw Forbidden when connecting a node when allow is valid", async () => {
            const typeDefs = `
                type ${Post.name} @node {
                    id: ID
                    creator: [${User.name}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User.name} @node {
                    id: ID
                    posts: [${Post.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post.name} @authorization(validate: [ { operations: [CREATE_RELATIONSHIP], when: BEFORE, where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const userId2 = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.update}(
                        where: { id_EQ: "${userId2}" }
                        update: { posts: { connect: { where: { node: { id_EQ: "${postId}" } } } } }
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
                    CREATE (:${User.name} {id: "${userId2}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw Forbidden when connecting a node with invalid allow", async () => {
            const typeDefs = `
                type ${Post.name} @node {
                    id: ID
                    creator: [${User.name}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User.name} @node {
                    id: ID
                    posts: [${Post.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post.name} @authorization(validate: [ { operations: [CREATE_RELATIONSHIP], when: BEFORE, where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
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
                        update: { posts: { connect: { where: { node: { id_EQ: "${postId}" } } } } }
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
                    CREATE (:${User.name} {id: "${userId}"})
                    CREATE (:${Post.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when connecting a nested node with invalid allow", async () => {
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

                extend type ${Post.name} @authorization(validate: [ { operations: [CREATE_RELATIONSHIP], when: BEFORE, where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
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
                                connect: {
                                    connect: {
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
                    CREATE (:${User.name} {id: "${userId}"})
                    CREATE (:${Post.name} {id: "${postId}"})-[:HAS_COMMENT]->(:${Comment.name} {id: "${commentId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});
