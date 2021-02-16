import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { describe, beforeAll, afterAll, test, expect, it } from "@jest/globals";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import makeAugmentedSchema from "../../../src/schema/make-augmented-schema";

describe("auth/is-authenticated", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    describe("read", () => {
        test("should throw if not authenticated type definition", async () => {
            const session = driver.session({ defaultAccessMode: "READ" });

            const typeDefs = `
                type Product @auth(rules: [{
                    operations: ["read"],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    password: String @auth(rules: [{ operations: ["read"], isAuthenticated: true }])
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    operations: ["create"],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                        operations: ["create"],
                        isAuthenticated: true
                    }])
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    operations: ["update"],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                        operations: ["update"],
                        isAuthenticated: true
                    }])
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                extend type User
                    @auth(
                        rules: [
                            {
                                operations: ["connect"]
                                isAuthenticated: true
                            }
                        ]
                    )
                    
                extend type Post @auth(rules: [{ operations: ["connect"], isAuthenticated: true }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
                mutation {
                    updateUsers(update: { id: "${userId}" }, connect: { posts: { where: { id: "${postId}" } } }) {
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
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                extend type User
                    @auth(
                        rules: [
                            {
                                operations: ["disconnect"]
                                isAuthenticated: true
                            }
                        ]
                    )
                    
                extend type Post @auth(rules: [{ operations: ["disconnect"], isAuthenticated: true }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
                mutation {
                    updateUsers(update: { id: "${userId}" }, disconnect: { posts: { where: { id: "${postId}" } } }) {
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
                    operations: ["delete"],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                type Post @auth(rules: [{
                    operations: ["delete"],
                    isAuthenticated: true
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    deleteUsers(where: {id: "${userId}"}, delete:{posts: {where:{id: "${postId}"}}}) {
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
                type User @exclude(operations: "*") {
                    id: ID
                    name: String
                }

                type Query {
                    users: [User] @cypher(statement: "MATCH (u:User) RETURN u") @auth(rules: [{ isAuthenticated: true }])
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                        @auth(rules: [{ operations: ["read"], isAuthenticated: true }])
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
    });
});
