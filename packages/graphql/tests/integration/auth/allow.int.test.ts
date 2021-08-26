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
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("auth/allow", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("read", () => {
        test("should throw forbidden when reading a node with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    users(where: {id: "${userId}"}) {
                        id
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw forbidden when reading a property with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User {
                    password: String @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    users(where: {id: "${userId}"}) {
                        password
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}", password: "letmein"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw forbidden when reading a nested property with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                }

                extend type User {
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
                    posts(where: {id: "${postId}"}) {
                        creator {
                            password
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})<-[:HAS_POST]-(:User {id: "${userId}", password: "letmein"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw forbidden when reading a nested property with invalid allow (using connections)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                }

                extend type User {
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
                    posts(where: {id: "${postId}"}) {
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

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})<-[:HAS_POST]-(:User {id: "${userId}", password: "letmein"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw forbidden when reading a node with invalid allow (across a single relationship)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post
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
                    users(where: {id: "${userId}"}) {
                        id
                        posts {
                            content
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw forbidden when reading a node with invalid allow (across a single relationship)(using connections)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post
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
                    users(where: {id: "${userId}"}) {
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

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw forbidden when reading a node with invalid allow (across multi relationship)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Comment {
                    id: ID
                    content: String
                    creator: User @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type Post {
                    id: ID
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Comment
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
                    users(where: {id: "${userId}"}) {
                        id
                        posts(where: {id: "${postId}"}) {
                            comments(where: {id: "${commentId}"}) {
                                content
                            }
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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
        test("should throw Forbidden when editing a node with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User
                    @auth(rules: [{ operations: [UPDATE], allow: { id: "$jwt.sub"  } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(where: {id: "${userId}"}, update: {id: "new-id"}) {
                        users {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw Forbidden when editing a property with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User {
                    password: String @auth(rules: [{ operations: [UPDATE], allow: { id: "$jwt.sub" }}])
                }

            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(where: {id: "${userId}"}, update: {password: "new-password"}) {
                        users {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw Forbidden when editing a nested node with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [UPDATE], allow: { id: "$jwt.sub" }}])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updatePosts(
                        where: { id: "${postId}" }
                        update: { creator: { update: { node: { id: "new-id" } } } }
                    ) {
                        posts {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw Forbidden when editing a nested node property with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                }

                extend type User {
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
                    updatePosts(
                        where: { id: "${postId}" }
                        update: { creator: { update: { node: { password: "new-password" } } } }
                    ) {
                        posts {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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
        test("should throw Forbidden when deleting a node with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [DELETE], allow: { id: "$jwt.sub" }}])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    deleteUsers(
                        where: { id: "${userId}" }
                    ) {
                       nodesDeleted
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw Forbidden when deleting a nested node with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    name: String
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                extend type Post @auth(rules: [{ operations: [DELETE], allow: { creator: { id: "$jwt.sub" } }}])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    deleteUsers(
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

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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
        test("should throw Forbidden when disconnecting a node with invalid allow", async () => {
            const session = driver.session();

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post @auth(rules: [{ operations: [DISCONNECT], allow: { creator: { id: "$jwt.sub" } }}])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(
                        where: { id: "${userId}" }
                        disconnect: { posts: { where: { node: { id: "${postId}" } } } }
                    ) {
                        users {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw Forbidden when disconnecting a nested node with invalid allow", async () => {
            const session = driver.session();

            const typeDefs = `
                type Comment {
                    id: ID
                    content: String
                    post: Post @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                    comments: Comment @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post @auth(rules: [{ operations: [DISCONNECT], allow: { creator: { id: "$jwt.sub" } }}])
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
                    updateComments(
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
                        comments {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->
                                (:Post {id: "${postId}"})-[:HAS_COMMENT]->
                                    (:Comment {id: "${commentId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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
        test("should throw Forbidden when connecting a node with invalid allow", async () => {
            const session = driver.session();

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post @auth(rules: [{ operations: [CONNECT], allow: { creator: { id: "$jwt.sub" } }}])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(
                        where: { id: "${userId}" }
                        connect: { posts: { where: { node: { id: "${postId}" } } } }
                    ) {
                        users {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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

        test("should throw Forbidden when connecting a nested node with invalid allow", async () => {
            const session = driver.session();

            const typeDefs = `
                type Comment {
                    id: ID
                    content: String
                    post: Post @relationship(type: "HAS_COMMENT", direction: IN)
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                    comments: Comment @relationship(type: "HAS_COMMENT", direction: OUT)
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post @auth(rules: [{ operations: [CONNECT], allow: { creator: { id: "$jwt.sub" } }}])
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
                    updateComments(
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
                        comments {
                            id
                        }
                    }
                }
            `;

            const secret = "secret";

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${postId}"})-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

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
