import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";

describe("post-auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        process.env.JWT_SECRET = "supersecret";
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        delete process.env.JWT_SECRET;
        await driver.close();
    });

    test("should throw error when user trying to create a post bound to another user", async () => {
        const session = driver.session();

        const userId = generate({
            charset: "alphabetic",
        });

        const mutation = gql`
            mutation {
                createPosts(
                    input: [
                        { title: "some post", content: "content", author: { connect: { where: { id: "invalid" } } } }
                    ]
                ) {
                    posts {
                        id
                    }
                }
            }
        `;

        const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        try {
            const apolloServer = server(driver, { req });

            const response = await apolloServer.mutate({
                mutation,
            });

            expect((response?.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw error when user trying to delete a post when they are not the author or the creator of blog", async () => {
        const session = driver.session();

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const mutation = gql`
            mutation {
                deletePosts(where: { id: "${postId}"} ) {
                    nodesDeleted
                }
            }
        `;

        const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        try {
            await session.run(`
                CREATE (:Post {id: "${postId}"})
            `);

            const apolloServer = server(driver, { req });

            const response = await apolloServer.mutate({
                mutation,
            });

            expect((response?.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });
});
