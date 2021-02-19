import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "../neo4j";
import makeAugmentedSchema from "../../../src/schema/make-augmented-schema";

describe("auth/object-path", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    test("should use object path with allow", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type User {
                id: ID
            }

            extend type User @auth(rules: [{ operations: ["read"], allow: { id: "$jwt.nested.object.path.sub" } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                users(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const token = jsonwebtoken.sign(
            {
                roles: [],
                nested: {
                    object: {
                        path: {
                            sub: userId,
                        },
                    },
                },
            },
            process.env.JWT_SECRET as string
        );

        const neoSchema = makeAugmentedSchema({ typeDefs });

        try {
            await session.run(`
                CREATE (:User {id: "${userId}"})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toEqual(undefined);

            const [user] = (gqlResult.data as any).users;
            expect(user).toEqual({ id: userId });
        } finally {
            await session.close();
        }
    });

    test("abba", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type User {
                id: ID
            }

            type Post {
                id: ID
                creator: User @relationship(type: "HAS_POST", direction: "IN")
            }

            extend type Post @auth(rules: [{ operations: ["read"], allow: { creator: { id: "$context.userId" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                posts(where: {id: "${postId}"}) {
                    id
                }
            }
        `;

        const token = jsonwebtoken.sign(
            {
                roles: [],
            },
            process.env.JWT_SECRET as string
        );

        const neoSchema = makeAugmentedSchema({ typeDefs });

        try {
            await session.run(`
                CREATE (:User {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req, userId },
            });

            expect(gqlResult.errors).toEqual(undefined);

            const [post] = (gqlResult.data as any).posts;
            expect(post).toEqual({ id: postId });
        } finally {
            await session.close();
        }
    });

    test("should use object path with roles", async () => {
        process.env.JWT_ROLES_OBJECT_PATH = "https://github\\.com/claims.https://github\\.com/claims/roles";

        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type User {
                id: ID
            }

            extend type User @auth(rules: [{ operations: ["read"], roles: ["admin"] }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                users(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const token = jsonwebtoken.sign(
            { "https://github.com/claims": { "https://github.com/claims/roles": ["admin"] } },
            process.env.JWT_SECRET as string
        );

        const neoSchema = makeAugmentedSchema({ typeDefs });

        try {
            await session.run(`
                CREATE (:User {id: "${userId}"})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toEqual(undefined);
            const [user] = (gqlResult.data as any).users;

            expect(user).toEqual({ id: userId });
        } finally {
            await session.close();
            delete process.env.JWT_ROLES_OBJECT_PATH;
        }
    });
});
