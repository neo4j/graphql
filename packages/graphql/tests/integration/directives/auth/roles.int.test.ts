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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { createJwtRequest } from "../../../../src/utils/test/utils";

describe("auth/roles", () => {
    let driver: Driver;
    const secret = "secret";

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeAll(async () => {
        const session = driver.session();

        try {
            await session.run(`
                    CREATE (:Product { name: 'p1', id:123 })
                    CREATE (:User { id: 1234, password:'dontpanic' })
                `);
            await session.run(`
                    MATCH(N:NotANode)
                    DETACH DELETE(N)
                `);
        } finally {
            await session.close();
        }
    });

    describe("read", () => {
        test("should throw if missing role on type definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type Product @auth(rules: [{
                    operations: [READ],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
            {
                products {
                    id
                }
            }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on field definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type User  {
                    id: ID
                    password: String @auth(rules: [{ operations: [READ], roles: ["admin"] }])
                }
            `;

            const query = `
                {
                    users {
                        password
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        // This tests reproduces the security issue related to authorization without match #195
        test.skip("should throw if missing role on type definition and no nodes are matched", async () => {
            const session = driver.session();

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

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("create", () => {
        test("should throw if missing role on type definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type User @auth(rules: [{
                    operations: [CREATE]
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
                mutation {
                    createUsers(input: [{ id: "1" }]) {
                        users {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on field definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID
                    password: String @auth(rules: [{
                        operations: [CREATE],
                        roles: ["admin"]
                    }])
                }
            `;

            const query = `
                mutation {
                    createUsers(input: [{ password: "1" }]) {
                        users {
                            password
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should throw if missing role on type definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type User @auth(rules: [{
                    operations: [UPDATE],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
                mutation {
                    updateUsers(update: { id: "1" }) {
                        users {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on field definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID
                    password: String @auth(rules: [{
                        operations: [UPDATE],
                        roles: ["admin"]
                    }])
                }
            `;

            const query = `
                mutation {
                    updateUsers(update: { password: "1" }) {
                        users {
                            password
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("connect", () => {
        test("should throw if missing role", async () => {
            const session = driver.session();

            const typeDefs = `
                type Post {
                    id: String
                    content: String
                }

                type User {
                    id: ID
                    name: String
                    password: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User
                    @auth(
                        rules: [
                            {
                                operations: [CONNECT]
                                roles: ["admin"]
                            }
                        ]
                    )

                extend type Post @auth(rules: [{ operations: [CONNECT], roles: ["super-admin"] }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(update: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        users {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${userId}"})
                `);
                // missing super-admin
                const req = createJwtRequest(secret, { roles: ["admin"] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on nested connect", async () => {
            const session = driver.session();

            const typeDefs = `
                type Comment {
                    id: String
                    content: String
                    post: Post @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type Post {
                    id: String
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: OUT)
                    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User
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
                    updateComments(
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
                        comments {
                            content
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:Comment {id: "${commentId}"})<-[:HAS_COMMENT]-(:Post {id: "${postId}"})
                    CREATE (:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { roles: [""] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("disconnect", () => {
        test("should throw if missing role", async () => {
            const session = driver.session();

            const typeDefs = `
                type Post {
                    id: String
                    content: String
                }

                type User {
                    id: ID
                    name: String
                    password: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User
                    @auth(
                        rules: [
                            {
                                operations: [DISCONNECT]
                                roles: ["admin"]
                            }
                        ]
                    )

                extend type Post @auth(rules: [{ operations: [DISCONNECT], roles: ["super-admin"] }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(update: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        users {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${userId}"})
                `);
                // missing super-admin
                const req = createJwtRequest(secret, { roles: ["admin"] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on nested disconnect", async () => {
            const session = driver.session();

            const typeDefs = `
                type Comment {
                    id: String
                    content: String
                    post: Post @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type Post {
                    id: String
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: OUT)
                    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User
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
                    updateComments(
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
                        comments {
                            content
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:Comment {id: "${commentId}"})<-[:HAS_COMMENT]-(:Post {id: "${postId}"})-[:HAS_POST]->(:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { roles: [""] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("delete", () => {
        test("should throw if missing role on type definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type User @auth(rules: [{
                    operations: [DELETE],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const query = `
                mutation {
                    deleteUsers {
                        nodesDeleted
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on type definition (with nested delete)", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post @auth(rules: [{
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
                    deleteUsers(where: {id: "${userId}"}, delete:{posts: {where:{node: { id: "${postId}"}}}}) {
                        nodesDeleted
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });
            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("custom-resolvers", () => {
        it("should throw if missing role on custom Query with @cypher", async () => {
            const session = driver.session();

            const typeDefs = `
                type User @exclude {
                    id: ID
                    name: String
                }

                type Query {
                    users: [User] @cypher(statement: "MATCH (u:User) RETURN u") @auth(rules: [{ roles: ["admin"] }])
                }
            `;

            const query = `
                query {
                    users {
                        id
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        it("should throw if missing role on custom Mutation with @cypher", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: User @cypher(statement: "CREATE (u:User) RETURN u") @auth(rules: [{ roles: ["admin"] }])
                }
            `;

            const query = `
                mutation {
                    createUser {
                        id
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw if missing role on Field definition @cypher", async () => {
            const session = driver.session();

            const typeDefs = `
                type History {
                    url: String
                }

                type User {
                    id: ID
                    history: [History]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
                        @auth(rules: [{ operations: [READ], roles: ["admin"] }])
                }
            `;

            const query = `
                {
                    users {
                        history {
                            url
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret, { roles: [] });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });
});
