import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "../neo4j";
import makeAugmentedSchema from "../../../src/schema/make-augmented-schema";

describe("auth/allow", () => {
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
        test("should throw forbidden when reading a node with invalid allow", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: ["read"], allow: { id: "sub" } }])
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

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    password: String @auth(rules: [{ operations: ["read"], allow: { id: "sub" } }])
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

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    contextValue: { driver, req },
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
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                }
            
                type User {
                    id: ID
                }
            
                extend type User {
                    password: String @auth(rules: [{ operations: ["read"], allow: { id: "sub" } }])
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

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    contextValue: { driver, req },
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
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                }

                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                extend type Post
                    @auth(rules: [{ operations: ["read"], allow: { creator: { id: "sub" } } }])
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

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

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

        test("should throw forbidden when reading a node with invalid allow (across multi relationship)", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Comment {
                    id: ID
                    content: String
                    creator: User @relationship(type: "HAS_COMMENT", direction: "IN")
                }

                type Post {
                    id: ID
                    content: String
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                    comments: [Comment] @relationship(type: "HAS_COMMENT", direction: "OUT")
                }

                type User {
                    id: ID
                    name: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                extend type Comment
                    @auth(rules: [{ operations: ["read"], allow: { creator: { id: "sub" } } }])
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

            const token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

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
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });
});
