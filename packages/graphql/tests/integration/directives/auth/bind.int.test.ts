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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { createJwtRequest } from "../../../utils/create-jwt-request";

describe("auth/bind", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should throw forbidden when creating a node with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when creating a nested node with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
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
                                    id: "not-valid",
                                    creator: {
                                        create: { node: {id: "${userId}_2"} }
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when creating field with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: OUT)
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should no throw forbidden when creating a node without passing the bind specified at the Field level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    name: String
                }

                extend type User {
                    id: ID @auth(rules: [{ operations: [CREATE], bind: { id: "$jwt.sub" } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const userName = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    createUsers(input: 
                        [
                            {
                                name: "${userName}",
                            }
                        ]
                        ) {
                        users {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });
                expect(gqlResult.errors).toBeFalsy();
            } finally {
                await session.close();
            }
        });

        test("should no throw forbidden when creating a nested node without passing the bind specified at the Field level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    title: String
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post {
                    id: ID @auth(rules: [{ operations: [CREATE], bind: { id: "$jwt.postId" } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const title = generate({
                charset: "alphabetic",
            });
            const query = `
                mutation {
                    createUsers(input: [{
                        id: "${userId}",
                        posts: {
                            create: 
                            [
                                {
                                    node: {
                                        title: "${title}"
                                    }
                                }
                            ]
                        }
                    }]) {
                        users {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                const req = createJwtRequest(secret, { postId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });
                expect(gqlResult.errors).toBeFalsy();
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when creating field with invalid bind (bind across relationships)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: OUT)
                }

                type User {
                    id: ID
                }

                extend type Post @auth(rules: [{ operations: [CREATE], bind: { creator: { id: "$jwt.sub"} } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
               mutation {
                   createPosts(input: [
                    {
                       id: "${postId}",
                       creator: {
                            create: { node: { id: "not-the-valid-user-id" } }
                        }
                    }
                ]) {
                        posts {
                            id
                            creator {
                                id
                            }
                        }
                    }
               }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should throw forbidden when updating a node with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when updating a nested node with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });

        test("should throw forbidden when updating a node property with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

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
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("connect", () => {
        test("should throw forbidden when connecting a node property with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });

    describe("disconnect", () => {
        test("should throw forbidden when disconnecting a node property with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:Post {id: "${postId}"})<-[:HAS_POST]-(:User {id: "${userId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            } finally {
                await session.close();
            }
        });
    });
});
