import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";

describe("blog-auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        process.env.JWT_SECRET = "supersecret";
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        delete process.env.JWT_SECRET;
        await driver.close();
    });

    test("should throw if blog.creator is not bound to jwt sub (on create)", async () => {
        const session = driver.session();

        const userId = generate({
            charset: "alphabetic",
        });

        const mutation = gql`
            mutation {
                createBlogs(input: [{ name: "test", creator: { connect: { where: { id: "invalid" } } } }]) {
                    blogs {
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

    test("should throw if non creator is deleting a blog", async () => {
        const session = driver.session();

        const userId = generate({
            charset: "alphabetic",
        });

        const blogId = generate({
            charset: "alphabetic",
        });

        const mutation = gql`
            mutation {
                deleteBlogs(where: { id: "${blogId}"} ) {
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
                CREATE (:Blog {id: "${blogId}"})
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
