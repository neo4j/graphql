/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import createJWKSMock, { JWKSMock } from "mock-jwks";
import supertest from "supertest";
import Koa from "koa";
import Router from "koa-router";
import jwt from "koa-jwt";
import jwksRsa from "jwks-rsa";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/564", () => {
    let jwksMock: JWKSMock;
    let server: any;
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(() => {
        ({ jwksMock, server } = createContext());
    });

    afterEach(async () => {
        await tearDown({ jwksMock, server });
    });

    test("tests the config path that uses JWKS Endpoint", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: ID
            }
            extend type User @auth(rules: [{ isAuthenticated: true }])
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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                jwt: { jwksEndpoint: "https://myAuthTest.auth0.com/.well-known/jwks.json" },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:User {id: "${userId}"})
            `);

            const accessToken = jwksMock.token({
                iat: 1600000000,
            });

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    request: {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    },
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.users).toHaveLength(1);
        } finally {
            await session.close();
        }
    });

    test("tests the config path that uses JWKS Endpoint with Roles Path enabling read for standard-user", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: ID
            }
            extend type User @auth(rules: [{ operations: [READ], roles: ["standard-user"] }])
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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                jwt: {
                    jwksEndpoint: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    rolesPath: "https://myAuthTest\\.auth0\\.com/jwt/claims.my-auth-roles",
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:User {id: "${userId}"})
            `);

            const accessToken = jwksMock.token({
                "https://myAuthTest.auth0.com/jwt/claims": {
                    "my-auth-roles": ["standard-user"],
                },
                iat: 1600000000,
            });

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    request: {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    },
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.users).toHaveLength(1);
        } finally {
            await session.close();
        }
    });

    test("show throw forbidden when JWT with JWKS Endpoint verification not on Roles Path", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: ID
            }
            extend type User @auth(rules: [{ operations: [READ], roles: ["editor"] }])
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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                jwt: {
                    jwksEndpoint: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    rolesPath: "https://myAuthTest\\.auth0\\.com/jwt/claims.my-auth-roles",
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:User {id: "${userId}"})
            `);

            const accessToken = jwksMock.token({
                "https://myAuthTest.auth0.com/jwt/claims": {
                    "my-auth-roles": ["standard-user"],
                },
                iat: 1600000000,
            });

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    request: {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    },
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });
});

const createContext = () => {
    // This creates the local PKI
    const jwksMock = createJWKSMock("https://myAuthTest.auth0.com");

    // We start our app.
    const server = createApp({
        jwksUri: "https://myAuthTest.auth0.com/.well-known/jwks.json",
    }).listen();

    const request = supertest(server);
    return {
        jwksMock,
        request,
        server,
    };
};

const tearDown = async ({ jwksMock, server }) => {
    await server.close();
    await jwksMock.stop();
};

const createApp = ({ jwksUri }) => {
    const app = new Koa();

    // We set up the jwksRsa client as usual (with production host)
    // We switch off caching to show how things work in ours tests.
    app.use(
        jwt({
            secret: jwksRsa.koaJwtSecret({
                cache: false,
                jwksUri,
            }),
            algorithms: ["RS256"],
        })
    );

    const router = new Router();

    // This route is protected by the authentication middleware
    router.get("/", (ctx) => {
        ctx.body = "Authenticated!";
    });

    app.use(router.middleware());
    return app;
};
