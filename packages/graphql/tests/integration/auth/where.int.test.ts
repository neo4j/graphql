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
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    describe("read", () => {
        test("should add $jwt.id to where and return user", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                }

                extend type User @auth(rules: [{ operations: ["read"], where: { id: "$jwt.sub" } }])
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
                process.env.JWT_SECRET as string
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

                const users = (gqlResult.data as any).users as any[];
                expect(users).toEqual([{ id: userId }]);
            } finally {
                await session.close();
            }
        });

        test("should add $jwt.id to where and return users posts", async () => {
            const session = driver.session({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type User {
                    id: ID
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }

                type Post {
                    id: ID
                    creator: User @relationship(type: "HAS_POST", direction: "IN")
                }

                extend type Post @auth(rules: [{ operations: ["read"], where: { creator: { id: "$jwt.sub" } } }])
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
                process.env.JWT_SECRET as string
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
                        content: [Content] @relationship(type: "HAS_CONTENT", direction: "OUT")
                    }
    
                    type Post {
                        id: ID
                        creator: User @relationship(type: "HAS_CONTENT", direction: "IN")
                    }
    
                    extend type Post @auth(rules: [{ operations: ["read"], where: { creator: { id: "$jwt.sub" } } }])
                    extend type User @auth(rules: [{ operations: ["read"], where: { id: "$jwt.sub" } }])
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
                    process.env.JWT_SECRET as string
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
});
