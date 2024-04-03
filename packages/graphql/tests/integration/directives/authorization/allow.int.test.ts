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
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth/allow", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let userType: UniqueType;
    let postType: UniqueType;
    let commentType: UniqueType;

    beforeEach(() => {
        userType = testHelper.createUniqueType("User");
        postType = testHelper.createUniqueType("Post");
        commentType = testHelper.createUniqueType("Comment");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("read", () => {
        test("should throw forbidden when reading a node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} @authorization(validate: [ { operations: [READ], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id: "${userId}"}) {
                        id
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
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a property with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [ { operations: [READ], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id: "${userId}"}) {
                        password
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
                    CREATE (:${userType.name} {id: "${userId}", password: "letmein"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when reading a nested property with invalid allow", async () => {
            const typeDefs = `
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [ { operations: [READ], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
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
                    ${postType.plural}(where: {id: "${postId}"}) {
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
                        key: "secret",
                    },
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
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [ { operations: [READ], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
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
                    ${postType.plural}(where: {id: "${postId}"}) {
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
                        key: "secret",
                    },
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
                type ${postType.name} {
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                    name: String
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name}
                @authorization(validate: [ { operations: [READ], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id: "${userId}"}) {
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
                        key: "secret",
                    },
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
                type ${postType.name} {
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                    name: String
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name}
                @authorization(validate: [ { operations: [READ], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    ${userType.plural}(where: {id: "${userId}"}) {
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
                        key: "secret",
                    },
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
                type ${commentType.name}  {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${postType.name} {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                    comments: [${commentType.name}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${userType.name} {
                    id: ID
                    name: String
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${commentType.name}
                @authorization(validate: [ { operations: [READ], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                    ${userType.plural}(where: {id: "${userId}"}) {
                        id
                        posts(where: {id: "${postId}"}) {
                            comments(where: {id: "${commentId}"}) {
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
                        key: "secret",
                    },
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
                type ${userType.name}  {
                    id: ID
                }

                extend type ${userType.name}
                @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.update}(where: {id: "${userId}"}, update: {id: "new-id"}) {
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
                        key: "secret",
                    },
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
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
                }

            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.update}(where: {id: "${userId}"}, update: {password: "new-password"}) {
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
                        key: "secret",
                    },
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
                type ${postType.name} {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
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
                        where: { id: "${postId}" }
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
                        key: "secret",
                    },
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
                type ${postType.name} {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
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
                        where: { id: "${postId}" }
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
                        key: "secret",
                    },
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
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} @authorization(validate: [ { operations: [DELETE], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.delete}(
                        where: { id: "${userId}" }
                    ) {
                       nodesDeleted
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
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when deleting a nested node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${postType.name} {
                    id: ID
                    name: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${postType.name} @authorization(validate: [ { operations: [DELETE], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                        where: { id: "${userId}" },
                        delete: {
                            posts: {
                                where: {
                                    node: {
                                        id: "${postId}"
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
                        key: "secret",
                    },
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
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [ { operations: [DELETE_RELATIONSHIP], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                        where: { id: "${userId}" }
                        disconnect: { posts: { where: { node: { id: "${postId}" } } } }
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
                        key: "secret",
                    },
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
                type ${commentType.name} {
                    id: ID
                    content: String
                    post: ${postType.name}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                    comments: ${commentType.name}! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${userType.name} {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [ { operations: [DELETE_RELATIONSHIP], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                        where: { id: "${commentId}" }
                        update: {
                            post: {
                                disconnect: {
                                    disconnect: {
                                        creator: {
                                            where: { node: { id: "${userId}" } }
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
                        key: "secret",
                    },
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
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [ { operations: [CREATE_RELATIONSHIP], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                        where: { id: "${userId}" }
                        connect: { posts: { where: { node: { id: "${postId}" } } } }
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
                        key: "secret",
                    },
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
                type ${commentType.name} {
                    id: ID
                    content: String
                    post: ${postType.name}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                    comments: ${commentType.name}! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${userType.name} {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @authorization(validate: [ { operations: [CREATE_RELATIONSHIP], when: BEFORE, where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                        where: { id: "${commentId}" }
                        update: {
                            post: {
                                connect: {
                                    connect: {
                                        creator: {
                                            where: { node: { id: "${userId}" } }
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
                        key: "secret",
                    },
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
