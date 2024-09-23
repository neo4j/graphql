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
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth/allow", () => {
    const testHelper = new TestHelper();
    let plugin: TestSubscriptionsEngine;
    const secret = "secret";

    let userType: UniqueType;
    let postType: UniqueType;
    let commentType: UniqueType;

    beforeEach(() => {
        userType = testHelper.createUniqueType("User");
        postType = testHelper.createUniqueType("Post");
        commentType = testHelper.createUniqueType("Comment");

        plugin = new TestSubscriptionsEngine();
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("read", () => {
        test("should throw forbidden when reading a node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} @node @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id_EQ: "${userId}"}) {
                        id
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a property with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id_EQ: "${userId}"}) {
                        password
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}", password: "letmein"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a nested property with invalid allow", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${postType.plural}(where: {id_EQ: "${postId}"}) {
                        creator {
                            password
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${postType.name} {id: "${postId}"})<-[:HAS_POST]-(:${userType.name} {id: "${userId}", password: "letmein"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a nested property with invalid allow (using connections)", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${postType.plural}(where: {id_EQ: "${postId}"}) {
                        creatorConnection {
                            edges {
                                node {
                                    password
                                }
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${postType.name} {id: "${postId}"})<-[:HAS_POST]-(:${userType.name} {id: "${userId}", password: "letmein"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a node with invalid allow (across a single relationship)", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                    name: String
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name}
                    @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id_EQ: "${userId}"}) {
                        id
                        posts {
                            content
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a node with invalid allow (across a single relationship)(using connections)", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                    name: String
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name}
                    @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id_EQ: "${userId}"}) {
                        id
                        postsConnection {
                            edges {
                                node {
                                    content
                                }
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a node with invalid allow (across multi relationship)", async () => {
            const typeDefs = `
                type ${commentType.name}  @node {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${postType.name} @node {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                    comments: [${commentType.name}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${userType.name} @node {
                    id: ID
                    name: String
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${commentType.name}
                    @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
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
                {
                    ${userType.plural}(where: {id_EQ: "${userId}"}) {
                        id
                        posts(where: {id_EQ: "${postId}"}) {
                            comments(where: {id_EQ: "${commentId}"}) {
                                content
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})-[:HAS_COMMENT]->(:${commentType.name} {id: "${commentId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("update", () => {
        test("should throw Forbidden when editing a node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name}  @node {
                    id: ID
                }

                extend type ${userType.name}
                    @authorization(validate: [{ when: [BEFORE], operations: [UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.update}(where: {id_EQ: "${userId}"}, update: {id: "new-id"}) {
                        ${userType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (: ${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when editing a property with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [{ when: [BEFORE], operations: [UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }])
                }

            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.update}(where: {id_EQ: "${userId}"}, update: {password: "new-password"}) {
                        ${userType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when editing a nested node with invalid allow", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} @authorization(validate: [{ when: [BEFORE], operations: [UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${postType.operations.update}(
                        where: { id_EQ: "${postId}" }
                        update: { creator: { update: { node: { id: "new-id" } } } }
                    ) {
                        ${postType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when editing a nested node property with invalid allow", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [{ when: [BEFORE], operations: [UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${postType.operations.update}(
                        where: { id_EQ: "${postId}" }
                        update: { creator: { update: { node: { password: "new-password" } } } }
                    ) {
                        ${postType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("delete", () => {
        test("should throw Forbidden when deleting a node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} @authorization(validate: [{ when: [BEFORE], operations: [DELETE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.delete}(
                        where: { id_EQ: "${userId}" }
                    ) {
                       nodesDeleted
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when deleting a nested node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${postType.name} @node {
                    id: ID
                    name: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${postType.name} @authorization(validate: [{ when: [BEFORE], operations: [DELETE], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.delete}(
                        where: { id_EQ: "${userId}" },
                        delete: {
                            posts: {
                                where: {
                                    node: {
                                        id_EQ: "${postId}"
                                    }
                                }
                            }
                        }
                    ) {
                       nodesDeleted
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("disconnect", () => {
        test("should throw Forbidden when disconnecting a node with invalid allow", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [{ when: [BEFORE], operations: [DELETE_RELATIONSHIP], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.update}(
                        where: { id_EQ: "${userId}" }
                        disconnect: { posts: { where: { node: { id_EQ: "${postId}" } } } }
                    ) {
                        ${userType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when disconnecting a nested node with invalid allow", async () => {
            const typeDefs = `
                type ${commentType.name} @node {
                    id: ID
                    content: String
                    post: ${postType.name}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${postType.name} @node {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                    comments: ${commentType.name}! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${userType.name} @node {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [{ when: [BEFORE], operations: [DELETE_RELATIONSHIP], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
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
                    ${commentType.operations.update}(
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
                        ${commentType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->
                                (:${postType.name} {id: "${postId}"})-[:HAS_COMMENT]->
                                    (:${commentType.name} {id: "${commentId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("connect", () => {
        test("should throw Forbidden when connecting a node with invalid allow", async () => {
            const typeDefs = `
                type ${postType.name} @node {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} @node {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [{ when: [BEFORE], operations: [CREATE_RELATIONSHIP], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.update}(
                        where: { id_EQ: "${userId}" }
                        connect: { posts: { where: { node: { id_EQ: "${postId}" } } } }
                    ) {
                        ${userType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})
                    CREATE (:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when connecting a nested node with invalid allow", async () => {
            const typeDefs = `
                type ${commentType.name} @node {
                    id: ID
                    content: String
                    post: ${postType.name}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${postType.name} @node {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                    comments: ${commentType.name}! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${userType.name} @node {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [{ when: [BEFORE], operations: [CREATE_RELATIONSHIP], where: { node: { creator: { id_EQ: "$jwt.sub" } } } }])
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
                    ${commentType.operations.update}(
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
                        ${commentType.plural} {
                            id
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
                    subscriptions: plugin,
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})
                    CREATE (:${postType.name} {id: "${postId}"})-[:HAS_COMMENT]->(:${commentType.name} {id: "${commentId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});
