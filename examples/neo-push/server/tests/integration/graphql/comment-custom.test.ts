import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";
import { createJWT } from "../../../src/utils";

describe("comment-custom", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j.connect();
    });

    afterAll(async () => {
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

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:WROTE]->
                           (p:Post {id: "${postId}"})<-[:HAS_POST]-(:Blog {id: "${blogId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})<-[:COMMENTED]-(u)
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.executeOperation({
                    query: mutation,
                });

                expect(response.errors).toBeUndefined();

                expect((response.data as any).comments[0].canDelete).toEqual(true);
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

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:WROTE]->
                           (p:Post {id: "${postId}"})<-[:HAS_POST]-(:Blog {id: "${blogId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.executeOperation({
                    query: mutation,
                });

                expect(response.errors).toBeUndefined();

                expect((response.data as any).comments[0].canDelete).toEqual(true);
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

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})-[:HAS_POST]->(p:Post {id: "${postId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.executeOperation({
                    query: mutation,
                });

                expect(response.errors).toBeUndefined();

                expect((response.data as any).comments[0].canDelete).toEqual(true);
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

            const token = await createJWT({ sub: userId });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${otherUser}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})-[:HAS_POST]->(p:Post {id: "${postId}"})
                    CREATE (p)-[:HAS_COMMENT]->(:Comment {id: "${commentId}"})
                `);

                const apolloServer = server(driver, { req });

                const response = await apolloServer.executeOperation({
                    query: mutation,
                });

                expect(response.errors).toBeUndefined();

                expect((response.data as any).comments[0].canDelete).toEqual(false);
            } finally {
                await session.close();
            }
        });
    });
});
