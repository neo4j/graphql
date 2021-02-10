import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "../neo4j";
import makeAugmentedSchema from "../../../src/schema/make-augmented-schema";

describe("auth/bind", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    describe("create", () => {
        test("should throw forbidden when creating a node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: ["create"], bind: { id: "sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    createUsers(input: [{id: "not bound"}]) {
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
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

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

        test("should throw forbidden when creating a nested node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                extend type Post @auth(rules: [{ operations: ["create"], bind: { id: "sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    createUsers(input: [{ 
                        id: "${userId}",
                        posts: {
                            create: [{
                                id: "post-id-1",
                                creator: {
                                    create: { id: "not valid" }
                                }
                            }]
                        }
                    }]) {
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
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

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

        test("should throw forbidden when creating field with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: "OUT")
                }

                type User {
                    id: ID
                }

                extend type User {
                    id: ID @auth(rules: [{ operations: ["create"], bind: { id: "sub" } }])
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
                       update: {
                           creator: {
                               create: { id: "not bound" }
                           }
                       }
                    ) {
                        posts {
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
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

            try {
                await session.run(`
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

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should throw forbidden when updating a node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: ["update"], bind: { id: "sub" } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(where: { id: "${userId}" }, update: { id: "not bound" }) {
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

        test("should throw forbidden when updating a nested node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                extend type Post @auth(rules: [{ operations: ["update"], bind: { creator: { id: "sub" } } }])
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
                        where: { id: "${userId}" }, 
                        update: { 
                            posts: {
                                where: { id: "${postId}" },
                                update: {
                                    creator: { update: { id: "not bound" } }
                                }
                            }
                        }
                    ) {
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

        test("should throw forbidden when updating a node property with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User {
                    id: ID @auth(rules: [{ operations: ["update"], bind: { id: "sub" } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(
                        where: { id: "${userId}" }, 
                        update: { id: "not bound" }
                    ) {
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
    });

    describe("connect", () => {
        test("should throw forbidden when connecting a node property with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                }

                extend type Post @auth(rules: [{ operations: ["connect"], bind: { creator: { id: "sub" } } }])
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
                        where: { id: "${postId}" }, 
                        connect: {
                            creator: {
                                where: { id: "not bound" }
                            }
                        }
                    ) {
                        posts {
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
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs });

            try {
                await session.run(`
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

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("disconnect", () => {
        test("should throw forbidden when disconnecting a node property with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                }

                extend type Post @auth(rules: [{ operations: ["disconnect"], bind: { creator: { id: "sub" } } }])
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
                        where: { id: "${postId}" }, 
                        disconnect: {
                            creator: {
                                where: { id: "${userId}" }
                            }
                        }
                    ) {
                        posts {
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
                process.env.JWT_SECRET as string
            );

            const neoSchema = makeAugmentedSchema({ typeDefs, debug: true });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})<-[:HAS_POST]-(:User {id: "${userId}"})
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
