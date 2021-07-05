import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";
import { createJWT } from "../../../src/utils";

describe("blog-auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw if blog.creator is not bound to jwt sub (on create)", async () => {
        const session = driver.session();

        const userId = generate({
            charset: "alphabetic",
        });

        const mutation = gql`
            mutation {
                createBlogs(input: [{ name: "test", creator: { connect: { where: { node: { id: "invalid" } } } } }]) {
                    blogs {
                        id
                    }
                }
            }
        `;

        const token = await createJWT({ sub: userId });

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

        const token = await createJWT({ sub: userId });

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
