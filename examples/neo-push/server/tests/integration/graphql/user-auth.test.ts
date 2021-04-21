import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { gql } from "apollo-server-express";
import * as neo4j from "../neo4j";
import server from "../server";

describe("user-auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j.connect();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw error when user is deleting another user(allow)", async () => {
        const session = driver.session();

        const userId = generate({
            charset: "alphabetic",
        });

        const anotherUserId = generate({
            charset: "alphabetic",
        });

        const mutation = gql`
            mutation {
                deleteUsers(where: {id: "${anotherUserId}"}) {
                    nodesDeleted
                }
            }
        `;

        const token = jsonwebtoken.sign({ sub: userId }, "secret");

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        try {
            await session.run(`
                CREATE (:User {id: "${userId}"})
                CREATE (:User {id: "${anotherUserId}"})
            `);

            const apolloServer = server(driver, { req });

            const response = await apolloServer.mutate({
                mutation,
            });

            expect((response.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });
});
