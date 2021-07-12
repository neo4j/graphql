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
import { IncomingMessage } from "http";
import { Socket } from "net";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("auth/is-authenticated", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("read", () => {
        test("should throw if not authenticated type definition", async () => {
            const session = driver.session({ defaultAccessMode: "READ" });

            const typeDefs = `
                type Product @auth(rules: [{
                    operations: [READ],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                {
                    products {
                        id
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on field definition", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User  {
                    id: ID
                    password: String @auth(rules: [{ operations: [READ], isAuthenticated: true }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                {
                    users {
                        password
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("create", () => {
        test("should throw if not authenticated on type definition", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User @auth(rules: [{
                    operations: [CREATE],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    createUsers(input: [{ id: "1" }]) {
                        users {
                            id
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on field definition", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    password: String @auth(rules: [{
                        operations: [CREATE],
                        isAuthenticated: true
                    }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    createUsers(input: [{ password: "1" }]) {
                        users {
                            password
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should throw if not authenticated on type definition", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User @auth(rules: [{
                    operations: [UPDATE],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    updateUsers(update: { id: "1" }) {
                        users {
                            id
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on field definition", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    password: String @auth(rules: [{
                        operations: [UPDATE],
                        isAuthenticated: true
                    }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    updateUsers(update: { password: "1" }) {
                        users {
                            password
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("connect", () => {
        test("should throw if not authenticated", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

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
                                isAuthenticated: true
                            }
                        ]
                    )

                extend type Post @auth(rules: [{ operations: [CONNECT], isAuthenticated: true }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    updateUsers(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        users {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${userId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("disconnect", () => {
        test("should throw if not authenticated", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

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
                                isAuthenticated: true
                            }
                        ]
                    )

                extend type Post @auth(rules: [{ operations: [DISCONNECT], isAuthenticated: true }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    updateUsers(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        users {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${userId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("delete", () => {
        test("should throw if not authenticated on type definition", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User @auth(rules: [{
                    operations: [DELETE],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    deleteUsers {
                        nodesDeleted
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on type definition (with nested delete)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post @auth(rules: [{
                    operations: [DELETE],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    deleteUsers(where: {id: "${userId}"}, delete:{posts: {where:{node: { id: "${postId}"}}} }) {
                        nodesDeleted
                    }
                }
            `;

            const token = "not valid token";

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

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("custom-resolvers", () => {
        it("should throw if not authenticated on custom Query with @cypher", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User @exclude {
                    id: ID
                    name: String
                }

                type Query {
                    users: [User] @cypher(statement: "MATCH (u:User) RETURN u") @auth(rules: [{ isAuthenticated: true }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                query {
                    users {
                        id
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        it("should throw if not authenticated on custom Mutation with @cypher", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: User @cypher(statement: "CREATE (u:User) RETURN u") @auth(rules: [{ isAuthenticated: true }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                mutation {
                    createUser {
                        id
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on Field definition @cypher", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type History {
                    url: String
                }

                type User {
                    id: ID
                    history: [History]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
                        @auth(rules: [{ operations: [READ], isAuthenticated: true }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret: "secret" } } });

            const query = `
                {
                    users {
                        history {
                            url
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should not throw if decoded JWT passed in context", async () => {
            const session = driver.session({ defaultAccessMode: "READ" });

            const typeDefs = `
                type Product @auth(rules: [{
                    operations: [READ],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                {
                    products {
                        id
                    }
                }
            `;

            const jwt = {
                sub: "1234567890",
                name: "John Doe",
                iat: 1516239022,
            };

            try {
                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, jwt },
                });

                expect(gqlResult.errors).toBeFalsy();
            } finally {
                await session.close();
            }
        });
    });
});
