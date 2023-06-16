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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { runCypher } from "../../../utils/run-cypher";
import { UniqueType } from "../../../utils/graphql-types";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import { createJwtRequest } from "../../../utils/create-jwt-request";

describe("auth/is-authenticated", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    let Product: UniqueType;
    let User: UniqueType;

    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Product = new UniqueType("Product");
        User = new UniqueType("User");
        const session = await neo4j.getSession();
        await runCypher(
            session,
            `CREATE(p:${Product} {id: "1", name: "Marvin"})
            CREATE(u:${User} {id: "1", password: "dontpanic42", name: "Arthur"})
        `
        );
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("read", () => {
        test("should throw if not authenticated type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type ${Product} @authentication(operations: [READ]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${Product.plural} {
                        id
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type ${Product} @authentication(operations: [READ]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${Product.plural} {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${Product} @authentication(operations: [READ], jwtPayload: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${Product.plural} {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${Product} @authentication(operations: [READ], jwtPayload: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${Product.plural} {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type ${User}  {
                    id: ID
                    password: String  @authentication(operations: [READ]) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${User.plural} {
                        password
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("create", () => {
        test("should not throw if authenticated on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} @authentication(operations: [CREATE]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1" }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @authentication(operations: [CREATE], jwtPayload: {roles_INCLUDES: "admin"}) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1" }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} @authentication(operations: [CREATE]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1" }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${User} @authentication(operations: [CREATE], jwtPayload: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1" }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;
            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on nested create type", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} @authentication(operations: [CREATE]) {
                    id: ID
                }   
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1", products: { create: [{ node: { id: "5" } }] } }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on nested create type", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                
                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} @authentication(operations: [CREATE], jwtPayload: { roles_INCLUDES: "admin" }) {
                    id: ID
                }   
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1", products: { create: [{ node: { id: "5" } }] } }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on nested create type - not unwind-create", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                
                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} @authentication(operations: [CREATE], jwtPayload: { roles_INCLUDES: "admin" }) {
                    id: ID
                }   
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1", products: { create: [{ node: { id: "5" } }] } }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE]) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ password: "1" }]) {
                        ${User.plural} {
                            password
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });
        test("should not throw if authenticated with correct role on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE], jwtPayload: {roles_INCLUDES: "admin"}) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ password: "1" }]) {
                        ${User.plural} {
                            password
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE]) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ password: "1" }]) {
                        ${User.plural} {
                            password
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
            
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE], jwtPayload: { roles_INCLUDES: "admin" }) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ password: "1" }]) {
                        ${User.plural} {
                            password
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on field definition - not unwind-create", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
            
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE], jwtPayload: { roles_INCLUDES: "admin" }) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ password: "1" }]) {
                        ${User.plural} {
                            password
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on nested create field", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} {
                    id: ID  @authentication(operations: [CREATE]) 
                }   
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1", products: { create: [{ node: { id: "5" } }] } }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on nested create field", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} {
                    id: ID  @authentication(operations: [CREATE], jwtPayload: { roles_INCLUDES: "admin" }) 
                }   
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1", products: { create: [{ node: { id: "5" } }] } }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on nested create field - not unwind-create", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} {
                    id: ID  @authentication(operations: [CREATE], jwtPayload: { roles_INCLUDES: "admin" }) 
                }   
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
                plugins: {
                    subscriptions: new TestSubscriptionsPlugin(),
                },
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1", products: { create: [{ node: { id: "5" } }] } }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should not throw if authenticated on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User}  @authentication(operations: [UPDATE])  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { id: "1" }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User}  @authentication(operations: [UPDATE], jwtPayload: {roles_INCLUDES: "admin"})  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { id: "1" }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User}  @authentication(operations: [UPDATE])  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { id: "1" }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${User}  @authentication(operations: [UPDATE],  jwtPayload: { roles_INCLUDES: "admin" })  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { id: "1" }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE]) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { id: "1" }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
        
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE], jwtPayload: {roles_INCLUDES: "admin"}) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { id: "1" }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE]) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { password: "1" }) {
                        ${User.plural} {
                            password
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on field definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE],  jwtPayload: { roles_INCLUDES: "admin" }) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(update: { password: "1" }) {
                        ${User.plural} {
                            password
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("connect", () => {
        test("should not throw if authenticated", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP]) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP], jwtPayload: {roles_INCLUDES:"admin"}) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP], jwtPayload: {roles_INCLUDES:"admin"}) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP]) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP],  jwtPayload: { roles_INCLUDES: "admin" }) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP],  jwtPayload: { roles_INCLUDES: "admin" }) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("connectOrCreate", () => {
        test("should not throw if authenticated", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String @unique
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP]) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connectOrCreate: { posts: { where: { node: { id: "${postId}" } }, onCreate: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String  @unique
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP], jwtPayload: {roles_INCLUDES:"admin"}) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connectOrCreate: { posts: { where: { node: { id: "${postId}" } }, onCreate: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String  @unique
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP], jwtPayload: {roles_INCLUDES:"admin"}) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connectOrCreate: { posts: { where: { node: { id: "${postId}" } }, onCreate: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String  @unique
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP]) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connectOrCreate: { posts: { where: { node: { id: "${postId}" } }, onCreate: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String  @unique
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connectOrCreate: { posts: { where: { node: { id: "${postId}" } }, onCreate: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String  @unique
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [CREATE_RELATIONSHIP],  jwtPayload: { roles_INCLUDES: "admin" }) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connectOrCreate: { posts: { where: { node: { id: "${postId}" } }, onCreate: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String  @unique
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP],  jwtPayload: { roles_INCLUDES: "admin" }) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, connectOrCreate: { posts: { where: { node: { id: "${postId}" } }, onCreate: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("disconnect", () => {
        test("should not throw if authenticated", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [DELETE_RELATIONSHIP]) 

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [DELETE_RELATIONSHIP], jwtPayload: {roles_INCLUDES:"admin"}) 

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP], jwtPayload: {roles_INCLUDES:"admin"}) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [DELETE_RELATIONSHIP]) 

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            // missing super-admin
            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${User}
                    @authentication(operations: [DELETE_RELATIONSHIP],  jwtPayload: { roles_INCLUDES: "admin" }) 

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles at nested level", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const Post = new UniqueType("Post");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${Post} {
                    id: String
                    content: String
                }

                type ${User} {
                    id: ID
                    name: String
                    password: String
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP],  jwtPayload: { roles_INCLUDES: "admin" }) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, disconnect: { posts: { where: { node: { id: "${postId}" } } } }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("delete", () => {
        test("should not throw if authenticated on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} @authentication(operations: [DELETE])  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.delete} {
                        nodesDeleted
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @authentication(operations: [DELETE], jwtPayload: {roles_INCLUDES: "admin"})  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.delete} {
                        nodesDeleted
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} @authentication(operations: [DELETE])  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.delete} {
                        nodesDeleted
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on type definition (with nested delete)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post @authentication(operations: [DELETE]) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.delete}(where: {id: "${userId}"}, delete:{posts: {where:{node: { id: "${postId}"}}} }) {
                        nodesDeleted
                    }
                }
            `;

            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles on type definition", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @authentication(operations: [DELETE],  jwtPayload: { roles_INCLUDES: "admin" })  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    ${User.operations.delete} {
                        nodesDeleted
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect roles on type definition (with nested delete)", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    name: String
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post @authentication(operations: [DELETE],  jwtPayload: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.delete}(where: {id: "${userId}"}, delete:{posts: {where:{node: { id: "${postId}"}}} }) {
                        nodesDeleted
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on type definition (with nested delete) on field", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post @authentication(operations: [DELETE]) {
                    id: ID 
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.delete}(where: {id: "${userId}"}, delete:{posts: {where:{node: { id: "${postId}"}}} }) {
                        nodesDeleted
                    }
                }
            `;

            const token = "not valid token";

            try {
                await session.run(`
                    CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });

    describe("custom-resolvers", () => {
        test("should not throw if authenticated on custom Query with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} @exclude {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u") @authentication
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                query {
                    users {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct roles on custom Query with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @exclude {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u") @authentication(jwtPayload: {roles_INCLUDES: "admin"})
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                query {
                    users {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on custom Query with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} @exclude {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u") @authentication
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                query {
                    users {
                        id
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on custom Query with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @exclude {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u") @authentication(jwtPayload: {roles_INCLUDES: "admin"})
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                query {
                    users {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated on custom Mutation with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u") @authentication
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    createUser {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role on custom Mutation with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u") @authentication(jwtPayload: {roles_INCLUDES: "admin"})
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    createUser {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["super-admin", "admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on custom Mutation with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u") @authentication
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    createUser {
                        id
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on custom Mutation with @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u") @authentication(jwtPayload: {roles_INCLUDES: "admin"})
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                mutation {
                    createUser {
                        id
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated on Field definition @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const History = new UniqueType("History");

            const typeDefs = `
                type ${History} {
                    url: String
                }

                type ${User} {
                    id: ID
                    history: [${History}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h")
                        @authentication(operations: [READ]) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${User.plural} {
                        history {
                            url
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should not throw if authenticated with correct role on Field definition @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const History = new UniqueType("History");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${History} {
                    url: String
                }

                type ${User} {
                    id: ID
                    history: [${History}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h")
                        @authentication(operations: [READ], jwtPayload: {roles_INCLUDES: "admin"}) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${User.plural} {
                        history {
                            url
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();
            } finally {
                await session.close();
            }
        });

        test("should throw if not authenticated on Field definition @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const History = new UniqueType("History");

            const typeDefs = `
                type ${History} {
                    url: String
                }

                type ${User} {
                    id: ID
                    history: [${History}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h")
                        @authentication(operations: [READ]) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${User.plural} {
                        history {
                            url
                        }
                    }
                }
            `;

            const token = "not valid token";

            try {
                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should throw if authenticated with incorrect role on Field definition @cypher", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const History = new UniqueType("History");

            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${History} {
                    url: String
                }

                type ${User} {
                    id: ID
                    history: [${History}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h")
                        @authentication(operations: [READ], jwtPayload: {roles_INCLUDES: "admin"}) 
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${User.plural} {
                        history {
                            url
                        }
                    }
                }
            `;

            try {
                const req = createJwtRequest(secret, { roles: ["not-an-admin"] });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });

        test("should not throw if decoded JWT passed in context", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type ${Product} @authentication(operations: [READ])  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${Product.plural} {
                        id
                    }
                }
            `;

            const jwt = {
                sub: "1234567890",
                name: "John Doe",
                iat: 1516239022,
            };

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ jwt }),
                });

                expect(gqlResult.errors).toBeFalsy();
            } finally {
                await session.close();
            }
        });

        test("should not throw if decoded JWT passed in context matches claim", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type ${Product} @authentication(operations: [READ], jwtPayload: {name_STARTS_WITH: "John"})  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${Product.plural} {
                        id
                    }
                }
            `;

            const jwt = {
                sub: "1234567890",
                name: "John Doe",
                iat: 1516239022,
            };

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ jwt }),
                });

                expect(gqlResult.errors).toBeFalsy();
            } finally {
                await session.close();
            }
        });

        test("should throw if decoded JWT passed in context does not matches claim", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "READ" });

            const typeDefs = `
                type ${Product} @authentication(operations: [READ], jwtPayload: {name_STARTS_WITH: "Doe"})  {
                    id: ID
                    name: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const query = `
                {
                    ${Product.plural} {
                        id
                    }
                }
            `;

            const jwt = {
                sub: "1234567890",
                name: "John Doe",
                iat: 1516239022,
            };

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ jwt }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            } finally {
                await session.close();
            }
        });
    });
});
