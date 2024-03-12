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

import { graphql } from "graphql";
import jwksRsa from "jwks-rsa";
import Koa from "koa";
import jwt from "koa-jwt";
import Router from "koa-router";
import type { JWKSMock } from "mock-jwks";
import createJWKSMock from "mock-jwks";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import supertest from "supertest";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4jHelper from "../../neo4j";

describe("auth/jwks-endpoint", () => {
    let jwksMock: JWKSMock;
    let server: any;
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let User: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");
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
        const session = await neo4j.getSession();

        const typeDefs = `
            type ${User} {
                id: ID
            }
            extend type ${User} @authentication
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:${User} {id: "${userId}"})
            `);

            const token = jwksMock.token({
                iat: 1600000000,
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token,
                }),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[User.plural]).toHaveLength(1);
        } finally {
            await session.close();
        }
    });

    test("tests the config path that uses JWKS Endpoint with Roles Path enabling read for standard-user", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]! @jwtClaim(path: "https://myAuthTest\\\\.auth0\\\\.com/jwt/claims.my-auth-roles")
            }

            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "standard-user" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:${User} {id: "${userId}"})
            `);

            const token = jwksMock.token({
                "https://myAuthTest.auth0.com/jwt/claims": {
                    "my-auth-roles": ["standard-user"],
                },
                iat: 1600000000,
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token,
                }),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[User.plural]).toHaveLength(1);
        } finally {
            await session.close();
        }
    });

    test("show throw forbidden when JWT with JWKS Endpoint verification not on Roles Path", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]! @jwtClaim(path: "https://myAuthTest\\\\.auth0\\\\.com/jwt/claims.my-auth-roles")
            }

            type ${User} {
                id: ID
            }
            extend type ${User} @authorization(validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "editor" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:${User} {id: "${userId}"})
            `);

            const token = jwksMock.token({
                "https://myAuthTest.auth0.com/jwt/claims": {
                    "my-auth-roles": ["standard-user"],
                },
                iat: 1600000000,
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token,
                }),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw Unauthenticated if the issuer in the JWT token does not match the issuer provided in the Neo4jGraphQLAuthJWKSPlugin", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type ${User} {
                id: ID
            }
            extend type ${User} @authentication
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                    verifyOptions: {
                        issuer: "https://testcompany.com",
                    },
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:${User} {id: "${userId}"})
            `);

            const token = jwksMock.token({
                iat: 1600000000,
                iss: "https://anothercompany.com",
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token,
                }),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        } finally {
            await session.close();
        }
    });

    test("should verify the issuer in the JWT token against the provided issuer in the Neo4jGraphQLAuthJWKSPlugin", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type ${User} {
                id: ID
            }
            extend type ${User} @authentication
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                    verifyOptions: {
                        issuer: "https://company.com",
                    },
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:${User} {id: "${userId}"})
            `);

            const token = jwksMock.token({
                iat: 1600000000,
                iss: "https://company.com",
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token,
                }),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[User.plural]).toHaveLength(1);
        } finally {
            await session.close();
        }
    });

    test("should throw Unauthenticated if the audience in the JWT token does not match the audience provided in the Neo4jGraphQLAuthJWKSPlugin", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type ${User} {
                id: ID
            }
            extend type ${User} @authentication
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                    verifyOptions: {
                        audience: "urn:${User}",
                    },
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:${User} {id: "${userId}"})
            `);

            const token = jwksMock.token({
                iat: 1600000000,
                aud: "urn:anotheruser",
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token,
                }),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        } finally {
            await session.close();
        }
    });

    test("should verify the audience in the JWT token against the provided audience in the Neo4jGraphQLAuthJWKSPlugin", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type ${User} {
                id: ID
            }
            extend type ${User} @authentication
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                    verifyOptions: {
                        audience: "urn:${User}",
                    },
                },
            },
        });

        try {
            // Start the JWKS Mock Server Application
            jwksMock.start();

            await session.run(`
                CREATE (:${User} {id: "${userId}"})
            `);

            const token = jwksMock.token({
                iat: 1600000000,
                aud: "urn:${User}",
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token,
                }),
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[User.plural]).toHaveLength(1);
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
