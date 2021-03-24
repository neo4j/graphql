import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import gql from "graphql-tag";
import * as neo4j from "../neo4j";
import server from "../server";

describe("blog-custom", () => {
    let driver: Driver;

    beforeAll(async () => {
        process.env.JWT_SECRET = "supersecret";
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        delete process.env.JWT_SECRET;
        await driver.close();
    });

    describe("isCreator", () => {
        test("should return true on isCreator using custom cypher", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    blogs(where: {id: "${blogId}"}){
                        isCreator
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.blogs[0].isCreator).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return false on isCreator using custom cypher", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    blogs(where: {id: "${blogId}"}){
                        isCreator
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Blog {id: "${blogId}"})
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.blogs[0].isCreator).toBeFalsy();
            } finally {
                await session.close();
            }
        });
    });

    describe("isAuthor", () => {
        test("should return true on isCreator using custom cypher", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    blogs(where: {id: "${blogId}"}){
                        isAuthor
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (u:User {id: "${userId}"})-[:CAN_POST]->(:Blog {id: "${blogId}"})
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.blogs[0].isAuthor).toEqual(true);
            } finally {
                await session.close();
            }
        });

        test("should return false on isCreator using custom cypher", async () => {
            const session = driver.session();

            const userId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const mutation = gql`
                {
                    blogs(where: {id: "${blogId}"}){
                        isAuthor
                    }
                }
    
            `;

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})
                    CREATE (:Blog {id: "${blogId}"})
                `);

                const apolloServer = await server({ req });

                const response = await apolloServer.mutate({
                    mutation,
                });

                expect(response.errors).toBeUndefined();

                expect(response.data.blogs[0].isAuthor).toBeFalsy();
            } finally {
                await session.close();
            }
        });
    });
});
