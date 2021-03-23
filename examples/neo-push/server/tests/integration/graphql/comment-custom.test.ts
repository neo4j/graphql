import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import gql from "graphql-tag";
import * as neo4j from "../neo4j";
import server from "../server";

describe("comment-custom", () => {
    let driver: Driver;

    beforeAll(async () => {
        process.env.JWT_SECRET = "supersecret";
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        delete process.env.JWT_SECRET;
        await driver.close();
    });

    describe("canEdit", () => {
        test("should return true when user is author of comment", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const commentId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    comments(where: {id: "${commentId}"}){
                        canDelete
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:WROTE]->
                           (p:Post {id: "${postId}"})<-[:HAS_POST]-(:Blog {id: "${blogId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})<-[:COMMENTED]-(u)
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.comments[0].canDelete).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return true when user is author of post", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const commentId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    comments(where: {id: "${commentId}"}){
                        canDelete
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:WROTE]->
                           (p:Post {id: "${postId}"})<-[:HAS_POST]-(:Blog {id: "${blogId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.comments[0].canDelete).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return true when user is creator of blog", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const commentId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    comments(where: {id: "${commentId}"}){
                        canDelete
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})-[:HAS_POST]->(p:Post {id: "${postId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.comments[0].canDelete).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return false when user cannot delete comment", async () => {
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

            const commentId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    comments(where: {id: "${commentId}"}){
                        canDelete
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${otherUser}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})-[:HAS_POST]->(p:Post {id: "${postId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.comments[0].canDelete).toEqual(false);
            } finally {
                await session.close();
            }
        });
    });
});
