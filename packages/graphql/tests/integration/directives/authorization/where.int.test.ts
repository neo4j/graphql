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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import Neo4j from "../../neo4j";
import { createBearerToken } from "../../../utils/create-bearer-token";

describe("auth/where", () => {
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

    describe("read", () => {
        test("should add $jwt.id to where and return user", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:User {id: "anotherUser"})
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).users as any[];
                expect(users).toEqual([{ id: userId }]);
            } finally {
                await session.close();
            }
        });

        test("should add $jwt.id to where on a relationship", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type Post @authorization(filter: [{ operations: [READ], where: { node: { creator: { id: "$jwt.sub" } } } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    CREATE (p1:Post {id: "${postId1}"})
                    CREATE (p2:Post {id: "${postId2}"})
                    MERGE (u)-[:HAS_POST]->(p1)
                    MERGE (u)-[:HAS_POST]->(p2)
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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

        test("should add $jwt.id to where on a relationship(using connection)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type Post @authorization(filter: [{ operations: [READ], where: { node: { creator: { id: "$jwt.sub" } } } }])
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
            const randomPostId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    users(where: { id: "${userId}" }) {
                        postsConnection {
                            edges {
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    CREATE (p1:Post {id: "${postId1}"})
                    CREATE (p2:Post {id: "${postId2}"})
                    CREATE (:Post {id: "${randomPostId}"})
                    MERGE (u)-[:HAS_POST]->(p1)
                    MERGE (u)-[:HAS_POST]->(p2)
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const posts = (gqlResult.data as any).users[0].postsConnection as { edges: { node: { id: string } }[] };
                expect(posts.edges).toHaveLength(2);
                const post1 = posts.edges.find((x) => x.node.id === postId1);
                expect(post1).toBeTruthy();
                const post2 = posts.edges.find((x) => x.node.id === postId2);
                expect(post2).toBeTruthy();
            } finally {
                await session.close();
            }
        });

        describe("union", () => {
            test("should add $jwt.id to where and return users search", async () => {
                const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

                const typeDefs = `
                    union Content = Post

                    type User {
                        id: ID
                        content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
                    }

                    type Post {
                        id: ID
                        creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
                    }

                    extend type Post @authorization(filter: [{ operations: [READ], where: { node: { creator: { id: "$jwt.sub" } } } }])
                    extend type User @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
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

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });

                try {
                    await session.run(`
                        CREATE (u:User {id: "${userId}"})
                        CREATE (p1:Post {id: "${postId1}"})
                        CREATE (p2:Post {id: "${postId2}"})
                        MERGE (u)-[:HAS_CONTENT]->(p1)
                        MERGE (u)-[:HAS_CONTENT]->(p2)
                    `);

                    const token = createBearerToken(secret, { sub: userId });

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues({ token }),
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

        test("should add $jwt.id to where and return users search(using connections)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                union Content = Post

                type User {
                    id: ID
                    content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
                }

                extend type Post @authorization(filter: [{ operations: [READ], where: { node: { creator: { id: "$jwt.sub" } } } }])
                extend type User @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
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
                        contentConnection {
                            edges {
                                node {
                                    ... on Post {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    CREATE (p1:Post {id: "${postId1}"})
                    CREATE (p2:Post {id: "${postId2}"})
                    CREATE (:Post {id: randomUUID()})
                    MERGE (u)-[:HAS_CONTENT]->(p1)
                    MERGE (u)-[:HAS_CONTENT]->(p2)
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });
                expect(gqlResult.errors).toBeUndefined();
                const posts = (gqlResult.data as any).users[0].contentConnection as {
                    edges: { node: { id: string } }[];
                };
                expect(posts.edges).toHaveLength(2);
                const post1 = posts.edges.find((x) => x.node.id === postId1);
                expect(post1).toBeTruthy();
                const post2 = posts.edges.find((x) => x.node.id === postId2);
                expect(post2).toBeTruthy();
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should add $jwt.id to where", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @authorization(filter: [{ operations: [UPDATE], where: { node: { id: "$jwt.sub" } } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @authorization(filter: [{ operations: [DELETE], where: { node: { id: "$jwt.sub" } } }])
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect(gqlResult.errors).toBeUndefined();
                const nodesDeleted = (gqlResult.data as any).deleteUsers.nodesDeleted as number;
                expect(nodesDeleted).toBe(1);

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
        test("should add jwt.id to where - update update", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @authorization(filter: [{ operations: [UPDATE, CREATE_RELATIONSHIP], where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(update: { posts: { connect: { where: { node: { id: "${postId}" } } } } }) {
                        users {
                            id
                            posts {
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
                        key: secret,
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${postId}"})
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect(gqlResult.errors).toBeUndefined();
                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, posts: [{ id: postId }] }]);
            } finally {
                await session.close();
            }
        });

        test("should add jwt.id to where - update connect", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @authorization(filter: [{ operations: [UPDATE, CREATE_RELATIONSHIP], where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    updateUsers(connect:{posts:{where:{node:{id: "${postId}"}}}}) {
                        users {
                            id
                            posts {
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
                        key: secret,
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Post {id: "${postId}"})
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
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
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @authorization(filter: [{ operations: [UPDATE, DELETE_RELATIONSHIP], where: { node: { id: "$jwt.sub" } } }])
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
                mutation {
                    updateUsers(update: { posts: { disconnect: { where: { node: { id: "${postId1}" } } } } }) {
                        users {
                            id
                            posts {
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
                        key: secret,
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    CREATE (u)-[:HAS_POST]->(:Post {id: "${postId1}"})
                    CREATE (u)-[:HAS_POST]->(:Post {id: "${postId2}"})
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect(gqlResult.errors).toBeUndefined();
                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, posts: [{ id: postId2 }] }]);
            } finally {
                await session.close();
            }
        });

        test("should add $jwt.id to where (update disconnect)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type User @authorization(filter: [{ operations: [UPDATE, DELETE_RELATIONSHIP], where: { node: { id: "$jwt.sub" } } }])
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
                mutation {
                    updateUsers(disconnect: { posts: { where: {node: { id : "${postId1}"}}}}) {
                        users {
                            id
                            posts {
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
                        key: secret,
                    },
                },
            });
            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    CREATE(u)-[:HAS_POST]->(:Post {id: "${postId1}"})
                    CREATE(u)-[:HAS_POST]->(:Post {id: "${postId2}"})
                `);

                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect(gqlResult.errors).toBeUndefined();
                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, posts: [{ id: postId2 }] }]);
            } finally {
                await session.close();
            }
        });
    });
});
