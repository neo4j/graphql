import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("auth-bind", () => {
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
        test("should throw Forbidden when user trying to create a blog not related to themselves", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID!
                }

                type Blog @auth(rules: [
                    {
                        operations: ["create"],
                        bind: {
                            creator: {
                                id: "sub"
                            }
                        }
                    },
                ]) {
                    id: ID!
                    creator: User @relationship(type: "HAS_BLOG", direction: "IN")
                }
            `;

            const blogId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const invalidUserId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
                mutation {
                    createBlogs(
                        input: [
                            {
                                id: "${blogId}"
                                creator: { connect: { where: { id: "${invalidUserId}" } } }
                            }
                        ]
                    ) {
                        blogs {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                    CREATE (:User {id: "${userId}"})
                    CREATE (:User {id: "${invalidUserId}"})
                `
                );

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query as string,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should allow user trying to create a blog related to themselves", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID!
                }

                type Blog @auth(rules: [
                    {
                        operations: ["create"],
                        bind: {
                            creator: {
                                id: "sub"
                            }
                        }
                    },
                ]) {
                    id: ID!
                    creator: User @relationship(type: "HAS_BLOG", direction: "IN")
                }
            `;

            const blogId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const invalidUserId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
                mutation {
                    createBlogs(
                        input: [
                            {
                                id: "${blogId}"
                                creator: { connect: { where: { id: "${userId}" } } }
                            }
                        ]
                    ) {
                        blogs {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                    CREATE (:User {id: "${userId}"})
                    CREATE (:User {id: "${invalidUserId}"})
                `
                );

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query as string,
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toEqual(undefined);
            } finally {
                await session.close();
            }
        });

        test("should allow user to create a post related to its blog and account", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID! 
                    email: String!
                    password: String ## protect to admins
                    blogs: [Blog] @relationship(type: "HAS_BLOG", direction: "OUT")
                }
        
                type Blog {
                    id: ID
                    name: String
                    creator: User @relationship(type: "HAS_BLOG", direction: "IN")
                    authors: [User] @relationship(type: "CAN_POST", direction: "IN")
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                    isCreator: Boolean # TODO
                    isAuthor: Boolean # TODO
                }

                type Post {
                    id: ID
                    title: String
                    content: String
                    blog: Blog @relationship(type: "HAS_POST", direction: "IN")
                    author: User @relationship(type: "WROTE", direction: "IN")
                    isCreator: Boolean # TODO
                    isAuthor: Boolean # TODO
                }

                extend type User
                @auth(
                    rules: [
                        { operations: ["read"], allow: "*" }
                        { operations: ["create"], allow: "*" }
                        { operations: ["connect"], allow: "*" }
                        {
                            operations: ["update"]
                            allow: { id: "sub" }
                            bind: { id: "sub" }
                        }
                        { operations: ["delete"], allow: { id: "sub" } }
                        {
                            operations: ["disconnect"]
                            allow: {
                                OR: [
                                    { id: "sub" }
                                    {
                                        blogs: {
                                            OR: [
                                                { creator: { id: "sub" } }
                                                { authors: { id: "sub" } }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                )        
            
                extend type Post
                    @auth(
                        rules: [
                            { operations: ["create"], bind: { author: { id: "sub" } } }
                            { operations: ["read"], allow: "*" }
                            {
                                operations: ["update"]
                                allow: {
                                    OR: [
                                        { author: { id: "sub" } }
                                        {
                                            blog: {
                                                OR: [
                                                    { creator: { id: "sub" } }
                                                    { authors: { id: "sub" } }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                            {
                                operations: ["delete"]
                                allow: {
                                    OR: [
                                        { author: { id: "sub" } }
                                        { blog: { creator: { id: "sub" } } }
                                    ]
                                }
                            }
                        ]
                    )
            
                extend type Blog
                    @auth(
                        rules: [
                            { operations: ["create"], bind: { creator: { id: "sub" } } }
                            { operations: ["read"], allow: "*" }
                            {
                                operations: ["update"]
                                allow: { creator: { id: "sub" } }
                                bind: { creator: { id: "sub" } }
                            }
                            {
                                operations: ["connect"]
                                allow: {
                                    OR: [
                                        { creator: { id: "sub" } }
                                        { authors: { id: "sub" } }
                                    ]
                                }
                            }
                            {
                                operations: ["disconnect"]
                                allow: {
                                    OR: [
                                        { creator: { id: "sub" } }
                                        { authors: { id: "sub" } }
                                        { posts: { author: { id: "sub" } } }
                                    ]
                                }
                            }
                            { operations: ["delete"], allow: { creator: { id: "sub" } } }
                        ]
                    )
            `;

            const blogId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
                mutation createPost($title: String!, $content: String!, $user: ID, $blog: ID) {
                    createPosts(
                      input: [
                        {
                          title: $title
                          content: $content
                          blog: { connect: { where: { id: $blog } } }
                          author: { connect: { where: { id: $user } } }
                        }
                      ]
                    ) {
                      posts {
                          id
                      }
                    }
                }
            `;

            try {
                await session.run(
                    `
                    CREATE (:User {id: "${userId}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                `
                );

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query as string,
                    variableValues: {
                        title: "some title",
                        content: "some content",
                        user: userId,
                        blog: blogId,
                    },
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toEqual(undefined);
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should throw Forbidden when user trying to connect another creator to a blog", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID!
                }

                type Blog @auth(rules: [
                    {
                        operations: ["update"],
                        bind: {
                            creator: {
                                id: "sub"
                            }
                        }
                    },
                ]) {
                    id: ID!
                    creator: User @relationship(type: "HAS_BLOG", direction: "IN")
                }
            `;

            const blogId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const invalidUserId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
               mutation {
                   updateBlogs(where: {id: "${blogId}"}, update: {creator: {connect: {where: {id: "${invalidUserId}"}}}}) {
                       blogs {
                           id
                       }
                   }
               }
            `;

            try {
                await session.run(
                    `
                    CREATE (:User {id: "${userId}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                    CREATE (:User {id: "${invalidUserId}"})
                `
                );

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query as string,
                    contextValue: { driver, req },
                });

                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should allow user trying to connect a blog to themselves", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID!
                }

                type Blog @auth(rules: [
                    {
                        operations: ["update"],
                        bind: {
                            creator: {
                                id: "sub"
                            }
                        }
                    },
                ]) {
                    id: ID!
                    creator: User @relationship(type: "HAS_BLOG", direction: "IN")
                }
            `;

            const blogId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
                mutation {
                    updateBlogs(where: {id: "${blogId}"}, update: {creator: {connect: {where: {id: "${userId}"}}}}) {
                        blogs {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Blog {id: "${blogId}"})
                `
                );

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query as string,
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toEqual(undefined);
            } finally {
                await session.close();
            }
        });
    });
});
