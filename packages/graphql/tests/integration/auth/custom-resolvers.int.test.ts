import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("auth/custom-resolvers", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    describe("auth-injection", () => {
        test("should inject auth in context of custom Query", async () => {
            const typeDefs = `
                type User {
                    id: ID
                }

                type Query {
                    me: User
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    me {
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: {
                        me: (_, __, ctx) => ({ id: ctx.auth.jwt.sub }),
                    },
                },
            });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });

        test("should inject auth in context of custom Mutation", async () => {
            const typeDefs = `
                type User {
                    id: ID
                }

                type Mutation {
                    me: User
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    me {
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers: { Mutation: { me: (_, __, ctx) => ({ id: ctx.auth.jwt.sub }) } },
            });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });

        test("should inject auth in context of custom Field resolver", async () => {
            const typeDefs = `
                type User {
                    customId: ID
                }

                type Query {
                    me: User
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    me {
                        customId
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

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: { me: () => ({}) },
                    User: { customId: (_, __, ctx) => ctx.auth.jwt.sub },
                },
            });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.customId).toEqual(userId);
        });
    });
});
