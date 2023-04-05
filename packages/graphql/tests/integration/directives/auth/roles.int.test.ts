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
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { UniqueType } from "../../../utils/graphql-types";
import { runCypher } from "../../../utils/run-cypher";
import { cleanNodes } from "../../../utils/clean-nodes";

describe("auth/roles", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const secret = "secret";

    let typeUser: UniqueType;
    let typeProduct: UniqueType;
    let typePost: UniqueType;
    let typeComment: UniqueType;
    let typeHistory: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        typeUser = new UniqueType("User");
        typeProduct = new UniqueType("Product");
        typePost = new UniqueType("Post");
        typeComment = new UniqueType("Comment");
        typeHistory = new UniqueType("History");

        const session = await neo4j.getSession();
        await runCypher(
            session,
            `
                CREATE (:${typeProduct} { name: 'p1', id:123 })
                CREATE (:${typeUser} { id: 1234, password:'dontpanic' })
           `
        );
    });

    afterEach(async () => {
        const session = await neo4j.getSession();
        await cleanNodes(session, [typeProduct, typeUser]);
    });

    describe("read", () => {
        test("should throw if missing role on type definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeProduct} @auth(rules: [{
                    operations: [READ],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
            {
                ${typeProduct.plural} {
                    id
                }
            }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

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

        test("should throw if missing role on field definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser}  {
                    id: ID
                    password: String @auth(rules: [{ operations: [READ], roles: ["admin"] }])
                }
            `;

            const query = `
                {
                    ${typeUser.plural} {
                        password
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

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

        test("Read Node & Cypher Field", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeHistory} {
                    url: String @auth(rules: [{ operations: [READ], roles: ["super-admin"] }])
                }
                type ${typeUser} {
                    id: ID
                    name: String
                    password: String
                }

                extend type ${typeUser}
                    @auth(rules: [{ operations: [READ, CREATE, UPDATE, CONNECT, DISCONNECT, DELETE], roles: ["admin"] }])

                extend type ${typeUser} {
                    history: [${typeHistory}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${typeHistory}) RETURN h", columnName: "h")
                        @auth(rules: [{ operations: [READ], roles: ["super-admin"] }])
                }
            `;

            const query = `
                {
                    ${typeUser.plural} {
                        history {
                            url
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                MATCH (u:${typeUser} { id: 1234 })
                CREATE(h:${typeHistory} { url: 'http://some.url' })<-[:HAS_HISTORY]-(u)
            `);

                const req = createJwtRequest(secret, { sub: "super_admin", roles: ["admin", "super-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [typeUser.plural]: [
                        {
                            history: [
                                {
                                    url: "http://some.url",
                                },
                            ],
                        },
                    ],
                });
            } finally {
                await session.close();
            }
        });

        // This tests reproduces the security issue related to authorization without match #195
        // eslint-disable-next-line jest/no-disabled-tests
        test.skip("should throw if missing role on type definition and no nodes are matched", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type NotANode @auth(rules: [{
                    operations: [READ],
                    roles: ["admin"]
                }]) {
                    name: String
                }
            `;

            const query = `
                {
                    notANodes {
                        name
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

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

    describe("create", () => {
        test("should throw if missing role on type definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} @auth(rules: [{
                    operations: [CREATE]
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
                mutation {
                    ${typeUser.operations.create}(input: [{ id: "1" }]) {
                        ${typeUser.plural} {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

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

        test("should throw if missing role on field definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} {
                    id: ID
                    password: String @auth(rules: [{
                        operations: [CREATE],
                        roles: ["admin"]
                    }])
                }
            `;

            const query = `
                mutation {
                    ${typeUser.operations.create}(input: [{ password: "1" }]) {
                        ${typeUser.plural} {
                            password
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

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

        test("should not throw if missing role on field definition if is not specified in the request", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} {
                    id: ID
                    password: String @auth(rules: [{
                        operations: [CREATE],
                        roles: ["admin"]
                    }])
                }
            `;

            const query = `
                mutation {
                    ${typeUser.operations.create}(input: [{ id: "1" }]) {
                        ${typeUser.plural} {
                            password
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeFalsy();
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should throw if missing role on type definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} @auth(rules: [{
                    operations: [UPDATE],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
                mutation {
                    ${typeUser.operations.update}(update: { id: "1" }) {
                        ${typeUser.plural} {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

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

        test("should throw if missing role on field definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} {
                    id: ID
                    password: String @auth(rules: [{
                        operations: [UPDATE],
                        roles: ["admin"]
                    }])
                }
            `;

            const query = `
                mutation {
                    ${typeUser.operations.update}(update: { password: "1" }) {
                        ${typeUser.plural} {
                            password
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret);

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
        test("should throw if missing role", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typePost} {
                    id: String
                    content: String
                }

                type ${typeUser} {
                    id: ID
                    name: String
                    password: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${typeUser}
                    @auth(
                        rules: [
                            {
                                operations: [CONNECT]
                                roles: ["admin"]
                            }
                        ]
                    )

                extend type ${typePost} @auth(rules: [{ operations: [CONNECT], roles: ["super-admin"] }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${typeUser.operations.update}(update: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${typeUser.plural} {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:${typeUser} {id: "${userId}"})
                    CREATE (:${typePost} {id: "${userId}"})
                `);
                // missing super-admin
                const req = createJwtRequest(secret, { roles: ["admin"] });

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

        test("should throw if missing role on nested connect", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeComment} {
                    id: String
                    content: String
                    post: ${typePost}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${typePost} {
                    id: String
                    content: String
                    creator: ${typeUser}! @relationship(type: "HAS_POST", direction: OUT)
                    comments: [${typeComment}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${typeUser} {
                    id: ID
                    name: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${typeUser}
                    @auth(
                        rules: [
                            {
                                operations: [CONNECT]
                                roles: ["admin"]
                            }
                        ]
                    )
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const commentId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${typeComment.operations.update}(
                        where: { id: "${commentId}" }
                        update: {
                            post: {
                                update: {
                                    node: {
                                        creator: { connect: { where: { node: { id: "${userId}" } } } }
                                    }
                                }
                            }
                        }
                    ) {
                        ${typeComment.plural} {
                            content
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:${typeComment} {id: "${commentId}"})<-[:HAS_COMMENT]-(:${typePost} {id: "${postId}"})
                    CREATE (:${typeUser} {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { roles: [""] });

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
        test("should throw if missing role", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typePost} {
                    id: String
                    content: String
                }

                type ${typeUser} {
                    id: ID
                    name: String
                    password: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${typeUser}
                    @auth(
                        rules: [
                            {
                                operations: [DISCONNECT]
                                roles: ["admin"]
                            }
                        ]
                    )

                extend type ${typePost} @auth(rules: [{ operations: [DISCONNECT], roles: ["super-admin"] }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${typeUser.operations.update}(update: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${typeUser.plural} {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:${typeUser} {id: "${userId}"})
                    CREATE (:${typePost} {id: "${userId}"})
                `);
                // missing super-admin
                const req = createJwtRequest(secret, { roles: ["admin"] });

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

        test("should throw if missing role on nested disconnect", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeComment} {
                    id: String
                    content: String
                    post: ${typePost}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${typePost} {
                    id: String
                    content: String
                    creator: ${typeUser}! @relationship(type: "HAS_POST", direction: OUT)
                    comments: [${typeComment}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${typeUser} {
                    id: ID
                    name: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${typeUser}
                    @auth(
                        rules: [
                            {
                                operations: [DISCONNECT]
                                roles: ["admin"]
                            }
                        ]
                    )
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const commentId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${typeComment.operations.update}(
                        where: { id: "${commentId}" }
                        update: {
                            post: {
                                update: {
                                    node: {
                                        creator: { disconnect: { where: { node: { id: "${userId}" } } } }
                                    }
                                }
                            }
                        }
                    ) {
                        ${typeComment.plural} {
                            content
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:${typeComment} {id: "${commentId}"})<-[:HAS_COMMENT]-(:${typePost} {id: "${postId}"})-[:HAS_POST]->(:${typeUser} {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { roles: [""] });

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
        test("should throw if missing role on type definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} @auth(rules: [{
                    operations: [DELETE],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
                mutation {
                    ${typeUser.operations.delete} {
                        nodesDeleted
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { roles: [] });

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

        test("should throw if missing role on type definition (with nested delete)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} {
                    id: ID
                    name: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${typePost} @auth(rules: [{
                    operations: [DELETE],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
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
                    ${typeUser.operations.delete}(where: {id: "${userId}"}, delete:{posts: {where:{node: { id: "${postId}"}}}}) {
                        nodesDeleted
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (:${typeUser} {id: "${userId}"})-[:HAS_POST]->(:${typePost} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: [] });

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

    describe("custom-resolvers", () => {
        test("should throw if missing role on custom Query with @cypher", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} @exclude {
                    id: ID
                    name: String
                }

                type Query {
                    ${typeUser.plural}: [${typeUser}] @cypher(statement: "MATCH (u:${typeUser}) RETURN u", columnName: "u") @auth(rules: [{ roles: ["admin"] }])
                }
            `;

            const query = `
                query {
                    ${typeUser.plural} {
                        id
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { roles: [] });

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

        test("should throw if missing role on custom Mutation with @cypher", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeUser} {
                    id: ID
                    name: String
                }

                type Mutation {
                    ${typeUser.operations.create}: ${typeUser} @cypher(statement: "CREATE (u:${typeUser}) RETURN u", columnName: "u") @auth(rules: [{ roles: ["admin"] }])
                }
            `;

            const query = `
                mutation {
                    ${typeUser.operations.create} {
                        id
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { roles: [] });

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

        test("should throw if missing role on Field definition @cypher", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type ${typeHistory} {
                    url: String
                }

                type ${typeUser} {
                    id: ID
                    history: [${typeHistory}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${typeHistory}) RETURN h", columnName: "h")
                        @auth(rules: [{ operations: [READ], roles: ["admin"] }])
                }
            `;

            const query = `
                {
                    ${typeUser.plural} {
                        history {
                            url
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { roles: [] });

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

    describe("combining roles with where", () => {
        test("combines where with roles", async () => {
            const session = await neo4j.getSession();

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID
                    name: String
                    password: String
                }

                extend type ${type.name}
                    @auth(
                        rules: [
                            {
                                roles: ["user"]
                                where: { id: "$jwt.id" }
                            }
                            {
                                roles: ["admin"]
                            }
                        ]
                    )
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const userId2 = generate({
                charset: "alphabetic",
            });

            const query = `
                query {
                    ${type.plural} {
                        id
                        name
                        password
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:${type.name} {id: "${userId}", name: "User1", password: "password" })
                    CREATE (:${type.name} {id: "${userId2}", name: "User2", password: "password" })
                `);
                // request with role "user" - should only return details of user
                const userReq = createJwtRequest(secret, { roles: ["user"], id: userId });

                const gqlResultUser = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req: userReq }),
                });

                expect(gqlResultUser.data).toEqual({
                    [type.plural]: [{ id: userId, name: "User1", password: "password" }],
                });

                // request with role "admin" - should return all users
                const adminReq = createJwtRequest(secret, { roles: ["admin"], id: userId2 });

                const gqlResultAdmin = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req: adminReq }),
                });

                expect(gqlResultAdmin.data).toEqual({
                    [type.plural]: expect.toIncludeSameMembers([
                        { id: userId, name: "User1", password: "password" },
                        { id: userId2, name: "User2", password: "password" },
                    ]),
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("rolesPath with dots", () => {
        test("can read role from path containing dots", async () => {
            const session = await neo4j.getSession();

            const type = new UniqueType("User");

            const typeDefs = `
                type ${type.name} {
                    id: ID
                    name: String
                    password: String
                }

                extend type ${type.name}
                    @auth(
                        rules: [
                            {
                                roles: ["admin"]
                            }
                        ]
                    )
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                query {
                    ${type.plural} {
                        id
                        name
                        password
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                        rolesPath: "https://auth0\\.mysite\\.com/claims.https://auth0\\.mysite\\.com/claims/roles",
                    }),
                },
            });

            try {
                await session.run(`
                    CREATE (:${type.name} {id: "${userId}", name: "User1", password: "password" })
                `);
                // request without role "admin" - should return all users
                const nonAdminReq = createJwtRequest(secret, {
                    "https://auth0.mysite.com/claims": { "https://auth0.mysite.com/claims/roles": ["user"] },
                    id: userId,
                });

                const gqlResultUser = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), {
                        req: nonAdminReq,
                    }),
                });

                expect((gqlResultUser.errors as any[])[0].message).toBe("Forbidden");

                // request with role "admin" - should return all users
                const adminReq = createJwtRequest(secret, {
                    "https://auth0.mysite.com/claims": { "https://auth0.mysite.com/claims/roles": ["admin"] },
                    id: userId,
                });

                const gqlResultAdmin = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req: adminReq }),
                });

                expect(gqlResultAdmin.data).toEqual({
                    [type.plural]: [{ id: userId, name: "User1", password: "password" }],
                });
            } finally {
                await session.close();
            }
        });
    });
});
