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
import { createJwtRequest } from "../../../utils/create-jwt-request";

describe("auth/bind", () => {
    let driver: Driver;
    const secret = "secret";

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should throw forbidden when creating a node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [CREATE], bind: { id: "$jwt.sub" } }])
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

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret, { sub: userId });

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

        test("should throw forbidden when creating a nested node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post @auth(rules: [{ operations: [CREATE], bind: { id: "$jwt.sub" } }])
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
                                node: {
                                    id: "post-id-1",
                                    creator: {
                                        create: { node: {id: "not valid"} }
                                    }
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

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                const req = createJwtRequest(secret, { sub: userId });

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

        test("should throw forbidden when creating field with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: OUT)
                }

                type User {
                    id: ID
                }

                extend type User {
                    id: ID @auth(rules: [{ operations: [CREATE], bind: { id: "$jwt.sub" } }])
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
                               create: { node: { id: "not bound" } }
                           }
                       }
                    ) {
                        posts {
                            id
                        }
                    }
               }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

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
        test("should throw forbidden when updating a node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: [UPDATE], bind: { id: "$jwt.sub" } }])
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

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

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

        test("should throw forbidden when updating a nested node with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post @auth(rules: [{ operations: [UPDATE], bind: { creator: { id: "$jwt.sub" } } }])
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
                                where: { node: { id: "${postId}" } },
                                update: {
                                    node: {
                                        creator: { update: { node: { id: "not bound" } } }
                                    }
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

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

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

        test("should throw forbidden when updating a node property with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User {
                    id: ID @auth(rules: [{ operations: [UPDATE], bind: { id: "$jwt.sub" } }])
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

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

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
        test("should throw forbidden when connecting a node property with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                extend type Post @auth(rules: [{ operations: [CONNECT], bind: { creator: { id: "$jwt.sub" } } }])
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
                                where: { node: { id: "not bound" } }
                            }
                        }
                    ) {
                        posts {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

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
        test("should throw forbidden when disconnecting a node property with invalid bind", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: IN)
                }

                extend type Post @auth(rules: [{ operations: [DISCONNECT], bind: { creator: { id: "$jwt.sub" } } }])
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
                                where: { node: { id: "${userId}" } }
                            }
                        }
                    ) {
                        posts {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})<-[:HAS_POST]-(:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

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
