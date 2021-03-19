import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("auth/roles", () => {
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
        test("should throw if missing role on type definition", async () => {
            const session = driver.session();

            const typeDefs = `
                type Product @auth(rules: [{
                    operations: ["read"],
                    roles: ["admin"]
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

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                    password: String @auth(rules: [{ operations: ["read"], roles: ["admin"] }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                {
                    users {
                        password
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                    operations: ["create"],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    createUsers(input: [{ id: "1" }]) {
                        users {
                            id
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                        operations: ["create"],
                        roles: ["admin"]
                    }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    createUsers(input: [{ password: "1" }]) {
                        users {
                            password
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                    operations: ["update"],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    updateUsers(update: { id: "1" }) {
                        users {
                            id
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                        operations: ["update"],
                        roles: ["admin"]
                    }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    updateUsers(update: { password: "1" }) {
                        users {
                            password
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                                operations: ["connect"]
                                roles: ["admin"]
                            }
                        ]
                    )

                extend type Post @auth(rules: [{ operations: ["connect"], roles: ["super-admin"] }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
            const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET as string);

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
                                operations: ["connect"]
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

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    updateComments(
                        where: { id: "${commentId}" }
                        update: {
                            post: {
                                update: {
                                    creator: { connect: { where: { id: "${userId}" } } }
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

            const token = jsonwebtoken.sign({ roles: [""] }, process.env.JWT_SECRET as string);

            try {
                await session.run(`
                    CREATE (:Comment {id: "${commentId}"})<-[:HAS_COMMENT]-(:Post {id: "${postId}"})
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
                                operations: ["disconnect"]
                                roles: ["admin"]
                            }
                        ]
                    )

                extend type Post @auth(rules: [{ operations: ["disconnect"], roles: ["super-admin"] }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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
            const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET as string);

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
                                operations: ["disconnect"]
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

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    updateComments(
                        where: { id: "${commentId}" }
                        update: {
                            post: {
                                update: {
                                    creator: { disconnect: { where: { id: "${userId}" } } }
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

            const token = jsonwebtoken.sign({ roles: [""] }, process.env.JWT_SECRET as string);

            try {
                await session.run(`
                    CREATE (:Comment {id: "${commentId}"})<-[:HAS_COMMENT]-(:Post {id: "${postId}"})-[:HAS_POST]->(:User {id: "${userId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                    operations: ["delete"],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    deleteUsers {
                        nodesDeleted
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                    operations: ["delete"],
                    roles: ["admin"]
                }]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

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

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

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
                type User @exclude(operations: "*") {
                    id: ID
                    name: String
                }

                type Query {
                    users: [User] @cypher(statement: "MATCH (u:User) RETURN u") @auth(rules: [{ roles: ["admin"] }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                query {
                    users {
                        id
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                mutation {
                    createUser {
                        id
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
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
                        @auth(rules: [{ operations: ["read"], roles: ["admin"] }])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
                {
                    users {
                        history {
                            url
                        }
                    }
                }
            `;

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });
});
