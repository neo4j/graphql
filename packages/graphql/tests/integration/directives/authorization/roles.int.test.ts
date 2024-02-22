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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import { cleanNodes } from "../../../utils/clean-nodes";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { UniqueType } from "../../../utils/graphql-types";
import { runCypher } from "../../../utils/run-cypher";
import Neo4jHelper from "../../neo4j";

describe("auth/roles", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    const secret = "secret";

    let typeUser: UniqueType;
    let typeProduct: UniqueType;
    let typePost: UniqueType;
    let typeComment: UniqueType;
    let typeHistory: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
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
        await cleanNodes(driver, [typeProduct, typeUser]);
    });

    describe("read", () => {
        test("should throw if missing role on type definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeProduct} @authorization(validate: [{
                    when: [BEFORE],
                    operations: [READ],
                    where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on field definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser}  {
                    id: ID
                    password: String @authorization(validate: [{
                        when: [BEFORE],
                        operations: [READ],
                        where: { jwt: { roles_INCLUDES: "admin" } }
                    }])
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("Read Node & Cypher Field", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeHistory} {
                    url: String @authorization(validate: [{
                        when: [BEFORE],
                        operations: [READ],
                        where: { jwt: { roles_INCLUDES: "super-admin" } }
                    }])
                }
                type ${typeUser} {
                    id: ID
                    name: String
                    password: String
                }

                extend type ${typeUser}
                    @authorization(validate: [{
                        when: [BEFORE],
                        operations: [READ, CREATE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, DELETE],
                        where: { jwt: { roles_INCLUDES: "admin" } }
                    }])

                extend type ${typeUser} {
                    history: [${typeHistory}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${typeHistory}) RETURN h", columnName: "h")
                        @authorization(validate: [{
                            when: [BEFORE],
                            operations: [READ],
                            where: { jwt: { roles_INCLUDES: "super-admin" } }
                        }])
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

                const token = createBearerToken(secret, { sub: "super_admin", roles: ["admin", "super-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type NotANode @authorization(validate: [{
                    when: [BEFORE],
                    operations: [READ],
                    where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} @authorization(validate: [{
                    when: [AFTER],
                    operations: [CREATE],
                    where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on field definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} {
                    id: ID
                    password: String @authorization(validate: [{
                        when: [AFTER],
                        operations: [CREATE],
                        where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should not throw if missing role on field definition if is not specified in the request", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} {
                    id: ID
                    password: String @authorization(validate: [{
                        when: [AFTER],
                        operations: [CREATE],
                        where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} @authorization(validate: [{
                    when: [BEFORE],
                    operations: [UPDATE],
                    where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on field definition", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} {
                    id: ID
                    password: String @authorization(validate: [{
                        when: [BEFORE],
                        operations: [UPDATE],
                        where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
                type JWTPayload @jwt {
                    roles: [String!]!
                }

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
                    @authorization(validate: [{
                        when: [BEFORE],
                        operations: [CREATE_RELATIONSHIP],
                        where: { jwt: { roles_INCLUDES: "admin" } }
                    }])

                extend type ${typePost} @authorization(validate: [{
                    when: [BEFORE],
                    operations: [CREATE_RELATIONSHIP],
                    where: { jwt: { roles_INCLUDES: "super-admin" } }
                }])
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
                    CREATE (:${typePost} {id: "${postId}"})
                `);
                // missing super-admin
                const token = createBearerToken(secret, { roles: ["admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on nested connect", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeComment} {
                    id: String
                    content: String
                    post: ${typePost}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${typePost} {
                    id: String
                    content: String
                    creator: ${typeUser}! @relationship(type: "HAS_POST", direction: IN)
                    comments: [${typeComment}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${typeUser} {
                    id: ID
                    name: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${typeUser}
                @authorization(validate: [{
                    when: [BEFORE],
                    operations: [CREATE_RELATIONSHIP],
                    where: { jwt: { roles_INCLUDES: "admin" } }
                }])
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

                const token = createBearerToken(secret, { roles: [""] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
                type JWTPayload @jwt {
                    roles: [String!]!
                }

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
                    @authorization(validate: [{
                        when: [BEFORE],
                        operations: [DELETE_RELATIONSHIP],
                        where: { jwt: { roles_INCLUDES: "admin" } }
                    }])

                extend type ${typePost} @authorization(validate: [{
                    when: [BEFORE],
                    operations: [DELETE_RELATIONSHIP],
                    where: { jwt: { roles_INCLUDES: "super-admin" } }
                }])
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
                const token = createBearerToken(secret, { roles: ["admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on nested disconnect", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeComment} {
                    id: String
                    content: String
                    post: ${typePost}! @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type ${typePost} {
                    id: String
                    content: String
                    creator: ${typeUser}! @relationship(type: "HAS_POST", direction: IN)
                    comments: [${typeComment}!]! @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type ${typeUser} {
                    id: ID
                    name: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${typeUser}
                    @authorization(validate: [{
                        when: [BEFORE],
                        operations: [DELETE_RELATIONSHIP],
                        where: { jwt: { roles_INCLUDES: "admin" } }
                    }])
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
                    CREATE (:${typeComment} {id: "${commentId}"})<-[:HAS_COMMENT]-(:${typePost} {id: "${postId}"})<-[:HAS_POST]-(:${typeUser} {id: "${userId}"})
                `);

                const token = createBearerToken(secret, { roles: [""] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} @authorization(validate: [{
                    when: [BEFORE],
                    operations: [DELETE],
                    where: { jwt: { roles_INCLUDES: "admin" } }
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
                const token = createBearerToken(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on type definition (with nested delete)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} {
                    id: ID
                    name: String
                    posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${typePost} @authorization(validate: [{
                    when: [BEFORE],
                    operations: [DELETE],
                    where: { jwt: { roles_INCLUDES: "admin" } }
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

                const token = createBearerToken(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    // TODO: Move these checks into JavaScript! Fun!
    describe("custom-resolvers", () => {
        test("should throw if missing role on custom Query with @cypher", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} @mutation(operations: []) @query(read: false, aggregate: false) {
                    id: ID
                    name: String
                }

                type Query {
                    ${typeUser.plural}: [${typeUser}] @cypher(statement: "MATCH (u:${typeUser}) RETURN u AS u", columnName: "u")  @authentication(jwt: {roles_INCLUDES: "admin"})
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
                const token = createBearerToken(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on custom Mutation with @cypher", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeUser} {
                    id: ID
                    name: String
                }

                type Mutation {
                    ${typeUser.operations.create}: ${typeUser} @cypher(statement: "CREATE (u:${typeUser}) RETURN u AS u", columnName: "u") @authentication(jwt: {roles_INCLUDES: "admin"})
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
                const token = createBearerToken(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on Field definition @cypher", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${typeHistory} {
                    url: String
                }

                type ${typeUser} {
                    id: ID
                    history: [${typeHistory}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${typeHistory}) RETURN h AS h", columnName: "h")
                        @authorization(validate: [{
                            when: [BEFORE],
                            where: { jwt: { roles_INCLUDES: "admin" } }
                        }])
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
                const token = createBearerToken(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
                type JWTPayload @jwt {
                    id: String!
                    roles: [String!]!
                }

                type ${type.name} {
                    id: ID
                    name: String
                    password: String
                }

                extend type ${type.name}
                    @authorization(
                        filter: [
                            {
                                where: { node: { id: "$jwt.id" }, jwt: { roles_INCLUDES: "user" } }
                            }, 
                            {
                                where: { jwt: { roles_INCLUDES: "admin" } }
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
                const userToken = createBearerToken(secret, { roles: ["user"], id: userId });

                const gqlResultUser = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token: userToken }),
                });

                expect(gqlResultUser.data).toEqual({
                    [type.plural]: [{ id: userId, name: "User1", password: "password" }],
                });

                // request with role "admin" - should return all users
                const adminToken = createBearerToken(secret, { roles: ["admin"], id: userId2 });

                const gqlResultAdmin = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token: adminToken }),
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
                type JWTPayload @jwt {
                    roles: [String!]! @jwtClaim(path: "https://auth0\\\\.mysite\\\\.com/claims.https://auth0\\\\.mysite\\\\.com/claims/roles")
                }

                type ${type.name} {
                    id: ID
                    name: String
                    password: String
                }

                extend type ${type.name}
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE],
                                where: { jwt: { roles_INCLUDES: "admin" } }
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
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:${type.name} {id: "${userId}", name: "User1", password: "password" })
                `);
                // request without role "admin" - should return all users
                const nonAdminToken = createBearerToken(secret, {
                    "https://auth0.mysite.com/claims": { "https://auth0.mysite.com/claims/roles": ["user"] },
                    id: userId,
                });

                const gqlResultUser = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({
                        token: nonAdminToken,
                    }),
                });

                expect((gqlResultUser.errors as any[])[0].message).toBe("Forbidden");

                // request with role "admin" - should return all users
                const adminToken = createBearerToken(secret, {
                    "https://auth0.mysite.com/claims": { "https://auth0.mysite.com/claims/roles": ["admin"] },
                    id: userId,
                });

                const gqlResultAdmin = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token: adminToken }),
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
