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

describe("auth/roles", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let typeUser: UniqueType;
    let typeProduct: UniqueType;
    let typePost: UniqueType;
    let typeComment: UniqueType;
    let typeHistory: UniqueType;

    beforeEach(async () => {
        typeUser = testHelper.createUniqueType("User");
        typeProduct = testHelper.createUniqueType("Product");
        typePost = testHelper.createUniqueType("Post");
        typeComment = testHelper.createUniqueType("Comment");
        typeHistory = testHelper.createUniqueType("History");

        await testHelper.executeCypher(
            `
                CREATE (:${typeProduct} { name: 'p1', id:123 })
                CREATE (:${typeUser} { id: 1234, password:'dontpanic' })
           `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("read", () => {
        test("should throw if missing role on type definition", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw if missing role on field definition", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("Read Node & Cypher Field", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                MATCH (u:${typeUser} { id: 1234 })
                CREATE(h:${typeHistory} { url: 'http://some.url' })<-[:HAS_HISTORY]-(u)
            `);

            const token = createBearerToken(secret, { sub: "super_admin", roles: ["admin", "super-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

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
        });

        // This tests reproduces the security issue related to authorization without match #195
        // eslint-disable-next-line jest/no-disabled-tests
        test.skip("should throw if missing role on type definition and no nodes are matched", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("create", () => {
        test("should throw if missing role on type definition", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw if missing role on field definition", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should not throw if missing role on field definition if is not specified in the request", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeFalsy();
        });
    });

    describe("update", () => {
        test("should throw if missing role on type definition", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw if missing role on field definition", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret);

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("connect", () => {
        test("should throw if missing role", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${typeUser} {id: "${userId}"})
                    CREATE (:${typePost} {id: "${postId}"})
                `);
            // missing super-admin
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw if missing role on nested connect", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${typeComment} {id: "${commentId}"})<-[:HAS_COMMENT]-(:${typePost} {id: "${postId}"})
                    CREATE (:${typeUser} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { roles: [""] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("disconnect", () => {
        test("should throw if missing role", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${typeUser} {id: "${userId}"})
                    CREATE (:${typePost} {id: "${userId}"})
                `);
            // missing super-admin
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw if missing role on nested disconnect", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${typeComment} {id: "${commentId}"})<-[:HAS_COMMENT]-(:${typePost} {id: "${postId}"})<-[:HAS_POST]-(:${typeUser} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { roles: [""] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("delete", () => {
        test("should throw if missing role on type definition", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret, { roles: [] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw if missing role on type definition (with nested delete)", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${typeUser} {id: "${userId}"})-[:HAS_POST]->(:${typePost} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: [] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    // TODO: Move these checks into JavaScript! Fun!
    describe("custom-resolvers", () => {
        test("should throw if missing role on custom Query with @cypher", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret, { roles: [] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if missing role on custom Mutation with @cypher", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret, { roles: [] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if missing role on Field definition @cypher", async () => {
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            const token = createBearerToken(secret, { roles: [] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("combining roles with where", () => {
        test("combines where with roles", async () => {
            const type = testHelper.createUniqueType("User");

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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${type.name} {id: "${userId}", name: "User1", password: "password" })
                    CREATE (:${type.name} {id: "${userId2}", name: "User2", password: "password" })
                `);
            // request with role "user" - should only return details of user
            const userToken = createBearerToken(secret, { roles: ["user"], id: userId });

            const gqlResultUser = await testHelper.executeGraphQLWithToken(query, userToken);

            expect(gqlResultUser.data).toEqual({
                [type.plural]: [{ id: userId, name: "User1", password: "password" }],
            });

            // request with role "admin" - should return all users
            const adminToken = createBearerToken(secret, { roles: ["admin"], id: userId2 });

            const gqlResultAdmin = await testHelper.executeGraphQLWithToken(query, adminToken);

            expect(gqlResultAdmin.data).toEqual({
                [type.plural]: expect.toIncludeSameMembers([
                    { id: userId, name: "User1", password: "password" },
                    { id: userId2, name: "User2", password: "password" },
                ]),
            });
        });
    });

    describe("rolesPath with dots", () => {
        test("can read role from path containing dots", async () => {
            const type = testHelper.createUniqueType("User");

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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${type.name} {id: "${userId}", name: "User1", password: "password" })
                `);
            // request without role "admin" - should return all users
            const nonAdminToken = createBearerToken(secret, {
                "https://auth0.mysite.com/claims": { "https://auth0.mysite.com/claims/roles": ["user"] },
                id: userId,
            });

            const gqlResultUser = await testHelper.executeGraphQLWithToken(query, nonAdminToken);

            expect((gqlResultUser.errors as any[])[0].message).toBe("Forbidden");

            // request with role "admin" - should return all users
            const adminToken = createBearerToken(secret, {
                "https://auth0.mysite.com/claims": { "https://auth0.mysite.com/claims/roles": ["admin"] },
                id: userId,
            });

            const gqlResultAdmin = await testHelper.executeGraphQLWithToken(query, adminToken);

            expect(gqlResultAdmin.data).toEqual({
                [type.plural]: [{ id: userId, name: "User1", password: "password" }],
            });
        });
    });
});
