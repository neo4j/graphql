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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { cleanNodes } from "../../../utils/clean-nodes";
import { UniqueType } from "../../../utils/graphql-types";

describe("auth/allow", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let plugin: TestSubscriptionsPlugin;
    const secret = "secret";

    let userType: UniqueType;
    let postType: UniqueType;
    let commentType: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        userType = new UniqueType("User");
        postType = new UniqueType("Post");
        commentType = new UniqueType("Comment");

        session = await neo4j.getSession();
        plugin = new TestSubscriptionsPlugin();
    });

    afterEach(async () => {
        await cleanNodes(session, [userType, postType]);
        await session.close();
    });

    describe("read", () => {
        test("should throw forbidden when reading a node with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when reading a property with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}", password: "letmein"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when reading a nested property with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${postType.name} {id: "${postId}"})<-[:HAS_POST]-(:${userType.name} {id: "${userId}", password: "letmein"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when reading a nested property with invalid allow (using connections)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${postType.name} {id: "${postId}"})<-[:HAS_POST]-(:${userType.name} {id: "${userId}", password: "letmein"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when reading a node with invalid allow (across a single relationship)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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
                    @auth(rules: [{ operations: [READ], allow: { creator: { id: "$jwt.sub" } } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when reading a node with invalid allow (across a single relationship)(using connections)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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
                    @auth(rules: [{ operations: [READ], allow: { creator: { id: "$jwt.sub" } } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when reading a node with invalid allow (across multi relationship)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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
                    @auth(rules: [{ operations: [READ], allow: { creator: { id: "$jwt.sub" } } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})-[:HAS_COMMENT]->(:${commentType.name} {id: "${commentId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should throw Forbidden when editing a node with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${userType.name}  {
                    id: ID
                }

                extend type ${userType.name}
                    @auth(rules: [{ operations: [UPDATE], allow: { id: "$jwt.sub"  } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (: ${userType.name} {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw Forbidden when editing a property with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} {
                    password: String @auth(rules: [{ operations: [UPDATE], allow: { id: "$jwt.sub" }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw Forbidden when editing a nested node with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${postType.name} {
                    id: ID
                    content: String
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} @auth(rules: [{ operations: [UPDATE], allow: { id: "$jwt.sub" }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw Forbidden when editing a nested node property with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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
                    password: String @auth(rules: [{ operations: [UPDATE], allow: { id: "$jwt.sub" }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("delete", () => {
        test("should throw Forbidden when deleting a node with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${userType.name} {
                    id: ID
                }

                extend type ${userType.name} @auth(rules: [{ operations: [DELETE], allow: { id: "$jwt.sub" }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw Forbidden when deleting a nested node with invalid allow", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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

                extend type ${postType.name} @auth(rules: [{ operations: [DELETE], allow: { creator: { id: "$jwt.sub" } }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("disconnect", () => {
        test("should throw Forbidden when disconnecting a node with invalid allow", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @auth(rules: [{ operations: [DISCONNECT], allow: { creator: { id: "$jwt.sub" } }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw Forbidden when disconnecting a nested node with invalid allow", async () => {
            const session = await neo4j.getSession();

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

                extend type ${postType.name} @auth(rules: [{ operations: [DISCONNECT], allow: { creator: { id: "$jwt.sub" } }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->
                                (:${postType.name} {id: "${postId}"})-[:HAS_COMMENT]->
                                    (:${commentType.name} {id: "${commentId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("connect", () => {
        test("should throw Forbidden when connecting a node with invalid allow", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${postType.name} {
                    id: ID
                    creator: ${userType.name}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${userType.name} {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${postType.name} @auth(rules: [{ operations: [CONNECT], allow: { creator: { id: "$jwt.sub" } }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})
                    CREATE (:${postType.name} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw Forbidden when connecting a nested node with invalid allow", async () => {
            const session = await neo4j.getSession();

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

                extend type ${postType.name} @auth(rules: [{ operations: [CONNECT], allow: { creator: { id: "$jwt.sub" } }}])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: plugin,
                },
            });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})
                    CREATE (:${postType.name} {id: "${postId}"})-[:HAS_COMMENT]->(:${commentType.name} {id: "${commentId}"})
                `);

                const req = createJwtRequest(secret, { sub: "invalid" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });
});
