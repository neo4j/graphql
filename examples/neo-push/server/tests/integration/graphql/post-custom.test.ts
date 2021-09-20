import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";
import { createJWT } from "../../../src/utils";

describe("post-custom", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("canEdit", () => {
        test("should return true on canEdit using custom cypher when user is creator of blog", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    posts(where: {id: "${postId}"}){
                        canEdit
                    }
                }

            `;

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    -[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts[0].canEdit).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return true on canEdit using custom cypher when user is author of blog", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    posts(where: {id: "${postId}"}){
                        canEdit
                    }
                }

            `;

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    -[:CAN_POST]->(:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts[0].canEdit).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return true on canEdit using custom cypher when user is author of post", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    posts(where: {id: "${postId}"}){
                        canEdit
                    }
                }

            `;

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:WROTE]->
                           (:Post {id: "${postId}"})<-[:HAS_POST]-(:Blog {id: "${blogId}"})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts[0].canEdit).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return false on canEdit using custom cypher", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const otherUser = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    posts(where: {id: "${postId}"}){
                        canEdit
                    }
                }

            `;

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${otherUser}"})
                    -[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(:Post {id: "${postId}", isPublic: true})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts[0].canEdit).toEqual(false);
            } finally {
                await session.close();
            }
        });
    });

    describe("canDelete", () => {
        test("should return true on canDelete using custom cypher when user is creator of blog", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    posts(where: {id: "${postId}"}){
                        canDelete
                    }
                }

            `;

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    -[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(:Post {id: "${postId}", isPublic: true})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts[0].canDelete).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return true on canDelete using custom cypher when user is author of post", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    posts(where: {id: "${postId}"}){
                        canDelete
                    }
                }

            `;

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})
                    -[:WROTE]->(:Post {id: "${postId}", isPublic: true})
                    <-[:HAS_POST]-(:Blog {id: "${blogId}"})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts[0].canDelete).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return false on canDelete using custom cypher", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const otherUser = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    posts(where: {id: "${postId}"}){
                        canDelete
                    }
                }

            `;

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${otherUser}"})
                    -[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(p:Post {id: "${postId}", isPublic: true})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts[0].canDelete).toEqual(false);
            } finally {
                await session.close();
            }
        });
    });

    describe("read-rules-where", () => {
        test("should not be able to see private posts when not a subscriber to a blog", async () => {
            const session = driver.session();

            const authorId = generate({
                charset: "alphabetic",
            });

            const otherUser = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const query = gql`
                {
                    posts(where: {id: "${postId}"}) {
                        id
                    }
                }
            `;

            const token = await createJWT({ sub: otherUser });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${authorId}"})
                    -[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(:Post {id: "${postId}", isPublic: false})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.query({
                    query,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts).toHaveLength(0);
            } finally {
                await session.close();
            }
        });

        test("should be able to see private posts when a subscriber to a blog", async () => {
            const session = driver.session();

            const authorId = generate({
                charset: "alphabetic",
            });

            const otherUser = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const query = gql`
                {
                    posts(where: {id: "${postId}"}) {
                        id
                    }
                }
            `;

            const token = await createJWT({ sub: otherUser });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${authorId}"})
                    -[:HAS_BLOG]->(b:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(:Post {id: "${postId}", isPublic: false}),
                    (otherUser:User {id: "${otherUser}"})-[:SUBSCRIBED_TO]->(b)
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.query({
                    query,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should be able to see private posts when one of multiple subscribers to a blog", async () => {
            const session = driver.session();

            const authorId = generate({
                charset: "alphabetic",
            });

            const otherUser = generate({
                charset: "alphabetic",
            });

            const thirdUser = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const query = gql`
                {
                    posts(where: {id: "${postId}"}) {
                        id
                    }
                }
            `;

            const token = await createJWT({ sub: otherUser });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${authorId}"})
                    -[:HAS_BLOG]->(b:Blog {id: "${blogId}"})
                    -[:HAS_POST]->(:Post {id: "${postId}", isPublic: false}),
                    (:User {id: "${otherUser}"})-[:SUBSCRIBED_TO]->(b),
                    (:User {id: "${thirdUser}"})-[:SUBSCRIBED_TO]->(b)
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.query({
                    query,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.posts).toHaveLength(1);
            } finally {
                await session.close();
            }
        });
    });
});
