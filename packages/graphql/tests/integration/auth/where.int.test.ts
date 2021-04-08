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
import { Neo4jGraphQL } from "../../../src/classes";
import neo4j from "../neo4j";

describe("auth/where", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.NEO4J_GRAPHQL_JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.NEO4J_GRAPHQL_JWT_SECRET;
    });

    describe("read", () => {
        test("should add $jwt.id to where and return user", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    users {
                        id
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).users as any[];
                expect(users).toEqual([{ id: userId }]);
            } finally {
                await session.close();
            }
        });

        test("should add $jwt.id to where on a relationship", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                extend type Post @auth(rules: [{ operations: [READ], where: { creator: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId1 = generate({
                charset: "alphabetic",
            });
            const postId2 = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    posts {
                        id
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    CREATE (p1:Post {id: "${postId1}"})
                    CREATE (p2:Post {id: "${postId2}"})
                    MERGE (u)-[:HAS_POST]->(p1)
                    MERGE (u)-[:HAS_POST]->(p2)
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();

                const posts = (gqlResult.data as any).posts as any[];
                expect(posts).toHaveLength(2);
                const post1 = posts.find((x) => x.id === postId1);
                expect(post1).toBeTruthy();
                const post2 = posts.find((x) => x.id === postId2);
                expect(post2).toBeTruthy();
            } finally {
                await session.close();
            }
        });

        describe("union", () => {
            test("should add $jwt.id to where and return users search", async () => {
                const session = driver.session({ defaultAccessMode: "WRITE" });

                const typeDefs = `
                    union Content = Post

                    type User {
                        id: ID
                        content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
                    }

                    type Post {
                        id: ID
                        creator: User @relationship(type: "HAS_CONTENT", direction: IN)
                    }

                    extend type Post @auth(rules: [{ operations: [READ], where: { creator: { id: "$jwt.sub" } } }])
                    extend type User @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
                `;

                const userId = generate({
                    charset: "alphabetic",
                });

                const postId1 = generate({
                    charset: "alphabetic",
                });
                const postId2 = generate({
                    charset: "alphabetic",
                });

                const query = `
                    {
                        users {
                            content {
                                ... on Post {
                                    id
                                }
                            }
                        }
                    }
                `;

                const token = jsonwebtoken.sign(
                    {
                        roles: [],
                        sub: userId,
                    },
                    process.env.NEO4J_GRAPHQL_JWT_SECRET as string
                );

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                try {
                    await session.run(`
                        CREATE (u:User {id: "${userId}"})
                        CREATE (p1:Post {id: "${postId1}"})
                        CREATE (p2:Post {id: "${postId2}"})
                        MERGE (u)-[:HAS_CONTENT]->(p1)
                        MERGE (u)-[:HAS_CONTENT]->(p2)
                    `);

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, req },
                    });
                    expect(gqlResult.errors).toBeUndefined();
                    const posts = (gqlResult.data as any).users[0].content as any[];
                    expect(posts).toHaveLength(2);
                    const post1 = posts.find((x) => x.id === postId1);
                    expect(post1).toBeTruthy();
                    const post2 = posts.find((x) => x.id === postId2);
                    expect(post2).toBeTruthy();
                } finally {
                    await session.close();
                }
            });
        });
    });

    describe("update", () => {
        test("should add $jwt.id to where", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [UPDATE], where: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const newUserId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(update: { id: "${newUserId}" }){
                        users {
                            id
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: newUserId }]);
            } finally {
                await session.close();
            }
        });
    });

    describe("delete", () => {
        test("should add $jwt.id to where", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [DELETE], where: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    deleteUsers(where: { id: "${userId}" }){
                        nodesDeleted
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();
                const nodesDeleted = (gqlResult.data as any).deleteUsers.nodesDeleted as number;
                expect(nodesDeleted).toEqual(1);

                const reQuery = await session.run(`
                    MATCH (u:User {id: "${userId}"})
                    RETURN u
                `);
                expect(reQuery.records).toHaveLength(0);
            } finally {
                await session.close();
            }
        });
    });

    describe("connect", () => {
        test("should add $jwt.id to where (update update)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @auth(rules: [{ operations: [CONNECT], where: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(update: { posts: { connect: { where: { id: "${postId}" } } } }) {
                        users {
                            id
                            posts {
                                id
                            }
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();
                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, posts: [{ id: postId }] }]);
            } finally {
                await session.close();
            }
        });

        test("should add $jwt.id to where (update connect)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @auth(rules: [{ operations: [CONNECT], where: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(connect:{posts:{where:{id: "${postId}"}}}) {
                        users {
                            id
                            posts {
                                id
                            }
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();
                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, posts: [{ id: postId }] }]);
            } finally {
                await session.close();
            }
        });
    });

    describe("disconnect", () => {
        test("should add $jwt.id to where (update update)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @auth(rules: [{ operations: [DISCONNECT], where: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(update: { posts: { disconnect: { where: { id: "${postId}" } } } }) {
                        users {
                            id
                            posts {
                                id
                            }
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();
                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, posts: [] }]);
            } finally {
                await session.close();
            }
        });

        test("should add $jwt.id to where (update disconnect)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @auth(rules: [{ operations: [DISCONNECT], where: { id: "$jwt.sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(disconnect:{posts:{where:{id: "${postId}"}}}) {
                        users {
                            id
                            posts {
                                id
                            }
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: userId,
                },
                process.env.NEO4J_GRAPHQL_JWT_SECRET as string
            );

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toBeUndefined();
                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, posts: [] }]);
            } finally {
                await session.close();
            }
        });
    });
});
