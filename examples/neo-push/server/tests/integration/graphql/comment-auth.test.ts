import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";
import { createJWT } from "../../../src/utils";

describe("comment-auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw error when user creating a comment related to another user", async () => {
        const session = driver.session();

        const userId = generate({
            charset: "alphabetic",
        });

        const mutation = gql`
            mutation {
                createComments(input: [{ content: "test", author: { connect: { where: { id: "invalid" } } } }]) {
                    comments {
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
});
