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

import { IncomingMessage } from "http";
import { Socket } from "net";
import { generate } from "randomstring";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth/is-authenticated", () => {
    const testHelper = new TestHelper();

    let Product: UniqueType;
    let User: UniqueType;

    const secret = "secret";

    beforeEach(async () => {
        Product = testHelper.createUniqueType("Product");
        User = testHelper.createUniqueType("User");
        await testHelper.executeCypher(
            `CREATE(p:${Product} {id: "1", name: "Marvin"})
            CREATE(u:${User} {id: "1", password: "dontpanic42", name: "Arthur"})
        `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("read", () => {
        test("should throw if not authenticated type definition", async () => {
            const typeDefs = `
                type ${Product} @authentication(operations: [READ]) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw if authenticated type definition", async () => {
            const typeDefs = `
                type ${Product} @authentication(operations: [READ]) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${Product} @authentication(operations: [READ], jwt: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if authenticated with incorrect role type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${Product} @authentication(operations: [READ], jwt: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated on field definition", async () => {
            const typeDefs = `
                type ${User}  {
                    id: ID
                    password: String  @authentication(operations: [READ]) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("create", () => {
        test("should not throw if authenticated on type definition", async () => {
            const typeDefs = `
                type ${User} @authentication(operations: [CREATE]) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role on type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @authentication(operations: [CREATE], jwt: {roles_INCLUDES: "admin"}) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on type definition", async () => {
            const typeDefs = `
                type ${User} @authentication(operations: [CREATE]) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${User} @authentication(operations: [CREATE], jwt: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated on nested create type", async () => {
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

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on nested create type", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                
                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} @authentication(operations: [CREATE], jwt: { roles_INCLUDES: "admin" }) {
                    id: ID
                }   
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on nested create type - not unwind-create", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                
                type ${User} {
                    id: ID
                    name: String
                    products: [${Product}!]! @relationship(type: "HAS_PRODUCT", direction: OUT) 
                }

                type ${Product} @authentication(operations: [CREATE], jwt: { roles_INCLUDES: "admin" }) {
                    id: ID
                }   
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: new TestSubscriptionsEngine(),
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw if authenticated on field definition", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE]) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });
        test("should not throw if authenticated with correct role on field definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE], jwt: {roles_INCLUDES: "admin"}) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on field definition", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE]) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
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

            const token = "not valid token";

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on field definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
            
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE], jwt: { roles_INCLUDES: "admin" }) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on field definition - not unwind-create", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
            
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [CREATE], jwt: { roles_INCLUDES: "admin" }) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret }, subscriptions: new TestSubscriptionsEngine() },
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated on nested create field", async () => {
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

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on nested create field", async () => {
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
                    id: ID  @authentication(operations: [CREATE], jwt: { roles_INCLUDES: "admin" }) 
                }   
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on nested create field - not unwind-create", async () => {
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
                    id: ID  @authentication(operations: [CREATE], jwt: { roles_INCLUDES: "admin" }) 
                }   
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: new TestSubscriptionsEngine(),
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("update", () => {
        test("should not throw if authenticated on type definition", async () => {
            const typeDefs = `
                type ${User}  @authentication(operations: [UPDATE])  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role on type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User}  @authentication(operations: [UPDATE], jwt: {roles_INCLUDES: "admin"})  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on type definition", async () => {
            const typeDefs = `
                type ${User}  @authentication(operations: [UPDATE])  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${User}  @authentication(operations: [UPDATE],  jwt: { roles_INCLUDES: "admin" })  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw if authenticated on field definition", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE]) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role on field definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
        
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE], jwt: {roles_INCLUDES: "admin"}) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on field definition", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE]) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on field definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                type ${User} {
                    id: ID
                    password: String  @authentication(operations: [UPDATE],  jwt: { roles_INCLUDES: "admin" }) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("connect", () => {
        test("should not throw if authenticated", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role", async () => {
            const Post = testHelper.createUniqueType("Post");

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
                    @authentication(operations: [CREATE_RELATIONSHIP], jwt: {roles_INCLUDES:"admin"}) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP], jwt: {roles_INCLUDES:"admin"}) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles", async () => {
            const Post = testHelper.createUniqueType("Post");

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
                    @authentication(operations: [CREATE_RELATIONSHIP],  jwt: { roles_INCLUDES: "admin" }) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP],  jwt: { roles_INCLUDES: "admin" }) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("connectOrCreate", () => {
        test("should not throw if authenticated", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role", async () => {
            const Post = testHelper.createUniqueType("Post");

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
                    @authentication(operations: [CREATE_RELATIONSHIP], jwt: {roles_INCLUDES:"admin"}) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP], jwt: {roles_INCLUDES:"admin"}) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles", async () => {
            const Post = testHelper.createUniqueType("Post");

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
                    @authentication(operations: [CREATE_RELATIONSHIP],  jwt: { roles_INCLUDES: "admin" }) 

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

                extend type ${Post} @authentication(operations: [CREATE_RELATIONSHIP],  jwt: { roles_INCLUDES: "admin" }) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("disconnect", () => {
        test("should not throw if authenticated", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role", async () => {
            const Post = testHelper.createUniqueType("Post");

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
                    @authentication(operations: [DELETE_RELATIONSHIP], jwt: {roles_INCLUDES:"admin"}) 

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP], jwt: {roles_INCLUDES:"admin"}) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles", async () => {
            const Post = testHelper.createUniqueType("Post");

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
                    @authentication(operations: [DELETE_RELATIONSHIP],  jwt: { roles_INCLUDES: "admin" }) 

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP]) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles at nested level", async () => {
            const Post = testHelper.createUniqueType("Post");

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

                extend type ${Post} @authentication(operations: [DELETE_RELATIONSHIP],  jwt: { roles_INCLUDES: "admin" }) 
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("delete", () => {
        test("should not throw if authenticated on type definition", async () => {
            const typeDefs = `
                type ${User} @authentication(operations: [DELETE])  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role on type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @authentication(operations: [DELETE], jwt: {roles_INCLUDES: "admin"})  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on type definition", async () => {
            const typeDefs = `
                type ${User} @authentication(operations: [DELETE])  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated on type definition (with nested delete)", async () => {
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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles on type definition", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @authentication(operations: [DELETE],  jwt: { roles_INCLUDES: "admin" })  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect roles on type definition (with nested delete)", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    name: String
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type Post @authentication(operations: [DELETE],  jwt: { roles_INCLUDES: "admin" }) {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if not authenticated on type definition (with nested delete) on field", async () => {
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

            await testHelper.initNeo4jGraphQL({
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("custom-resolvers", () => {
        test("should not throw if authenticated on custom Query with @cypher", async () => {
            const typeDefs = `
                type ${User} @mutation(operations: []) @query(read: false, aggregate: false) {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u", columnName: "u") @authentication
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct roles on custom Query with @cypher", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @mutation(operations: []) @query(read: false, aggregate: false) {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u", columnName: "u") @authentication(jwt: {roles_INCLUDES: "admin"})
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on custom Query with @cypher", async () => {
            const typeDefs = `
                type ${User} @mutation(operations: []) @query(read: false, aggregate: false) {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u", columnName: "u") @authentication
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on custom Query with @cypher", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} @mutation(operations: []) @query(read: false, aggregate: false) {
                    id: ID
                    name: String
                }

                type Query {
                    users: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u", columnName: "u") @authentication(jwt: {roles_INCLUDES: "admin"})
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw if authenticated on custom Mutation with @cypher", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u", columnName: "u") @authentication
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role on custom Mutation with @cypher", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u", columnName: "u") @authentication(jwt: {roles_INCLUDES: "admin"})
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["super-admin", "admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on custom Mutation with @cypher", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u", columnName: "u") @authentication
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on custom Mutation with @cypher", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }

                type ${User} {
                    id: ID
                    name: String
                }

                type Mutation {
                    createUser: ${User} @cypher(statement: "CREATE (u:${User}) RETURN u", columnName: "u") @authentication(jwt: {roles_INCLUDES: "admin"})
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw if authenticated on Field definition @cypher", async () => {
            const History = testHelper.createUniqueType("History");

            const typeDefs = `
                type ${History} {
                    url: String
                }

                type ${User} {
                    id: ID
                    history: [${History}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h", columnName: "h")
                        @authentication(operations: [READ]) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should not throw if authenticated with correct role on Field definition @cypher", async () => {
            const History = testHelper.createUniqueType("History");

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
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h", columnName: "h")
                        @authentication(operations: [READ], jwt: {roles_INCLUDES: "admin"}) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw if not authenticated on Field definition @cypher", async () => {
            const History = testHelper.createUniqueType("History");

            const typeDefs = `
                type ${History} {
                    url: String
                }

                type ${User} {
                    id: ID
                    history: [${History}]
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h", columnName: "h")
                        @authentication(operations: [READ]) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw if authenticated with incorrect role on Field definition @cypher", async () => {
            const History = testHelper.createUniqueType("History");

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
                        @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:${History}) RETURN h", columnName: "h")
                        @authentication(operations: [READ], jwt: {roles_INCLUDES: "admin"}) 
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const token = createBearerToken(secret, { roles: ["not-an-admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw if decoded JWT passed in context", async () => {
            const typeDefs = `
                type ${Product} @authentication(operations: [READ])  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const gqlResult = await testHelper.executeGraphQL(query, {
                contextValue: { jwt },
            });

            expect(gqlResult.errors).toBeFalsy();
        });

        test("should not throw if decoded JWT passed in context matches claim", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    name: String!
                }

                type ${Product} @authentication(operations: [READ], jwt: {name_STARTS_WITH: "John"})  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const gqlResult = await testHelper.executeGraphQL(query, {
                contextValue: { jwt },
            });

            expect(gqlResult.errors).toBeFalsy();
        });

        test("should throw if decoded JWT passed in context does not matches claim", async () => {
            const typeDefs = `
                type JWTPayload @jwt {
                    name: String!
                }

                type ${Product} @authentication(operations: [READ], jwt: {name_STARTS_WITH: "Doe"})  {
                    id: ID
                    name: String
                }
            `;

            await testHelper.initNeo4jGraphQL({
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

            const gqlResult = await testHelper.executeGraphQL(query, {
                contextValue: { jwt },
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("schema", () => {
        describe("read", () => {
            beforeEach(async () => {
                const typeDefs = `
                type ${Product} {
                    id: ID
                    name: String
                }
                extend schema @authentication(operations: [READ])
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
                const query = `
                    {
                        ${Product.plural} {
                            id
                        }
                    }
                `;

                const token = "not valid token";

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const query = `
                    {
                        ${Product.plural} {
                            id
                        }
                    }
                `;

                const token = createBearerToken(secret);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
        describe("create", () => {
            beforeEach(async () => {
                const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }
                extend schema @authentication(operations: [CREATE])
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
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

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const query = `
                mutation {
                    ${User.operations.create}(input: [{ id: "1" }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

                const token = createBearerToken(secret);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
        describe("update", () => {
            beforeEach(async () => {
                const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }
                extend schema @authentication(operations: [UPDATE])
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
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

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const query = `
                mutation {
                    ${User.operations.update}(update: { id: "1" }) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

                const token = createBearerToken(secret);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
        describe("connect", () => {
            let Post: UniqueType;

            beforeEach(async () => {
                Post = testHelper.createUniqueType("Post");

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
                extend schema @authentication(operations: [CREATE_RELATIONSHIP])
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
                const userId = generate({
                    charset: "alphabetic",
                });

                const postId = generate({
                    charset: "alphabetic",
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

                const token = "not valid token";

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const userId = generate({
                    charset: "alphabetic",
                });

                const postId = generate({
                    charset: "alphabetic",
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

                const token = createBearerToken(secret);

                await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
        describe("connectOrCreate", () => {
            let Post: UniqueType;

            beforeEach(async () => {
                Post = testHelper.createUniqueType("Post");

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
                extend schema @authentication(operations: [CREATE_RELATIONSHIP])
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
                const userId = generate({
                    charset: "alphabetic",
                });

                const postId = generate({
                    charset: "alphabetic",
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

                const token = "not valid token";

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const userId = generate({
                    charset: "alphabetic",
                });

                const postId = generate({
                    charset: "alphabetic",
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

                const token = createBearerToken(secret);

                await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
        describe("disconnect", () => {
            let Post: UniqueType;

            beforeEach(async () => {
                Post = testHelper.createUniqueType("Post");

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
                extend schema @authentication(operations: [DELETE_RELATIONSHIP])
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
                const userId = generate({
                    charset: "alphabetic",
                });

                const postId = generate({
                    charset: "alphabetic",
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

                const token = "not valid token";

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const userId = generate({
                    charset: "alphabetic",
                });

                const postId = generate({
                    charset: "alphabetic",
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

                const token = createBearerToken(secret);

                await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${Post} {id: "${postId}"})
                `);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
        describe("delete", () => {
            beforeEach(async () => {
                const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }
                extend schema @authentication(operations: [DELETE])
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
                const query = `
                mutation {
                    ${User.operations.delete} {
                        nodesDeleted
                    }
                }
            `;

                const token = "not valid token";

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const query = `
                mutation {
                    ${User.operations.delete} {
                        nodesDeleted
                    }
                }
            `;

                const token = createBearerToken(secret);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
        describe("custom-resolvers", () => {
            beforeEach(async () => {
                const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }
                type Query {
                    allUsers: [${User}] @cypher(statement: "MATCH (u:${User}) RETURN u", columnName: "u")
                }
                extend schema @authentication
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        authorization: {
                            key: secret,
                        },
                    },
                });
            });

            test("should throw if not authenticated type definition", async () => {
                const query = `
                query {
                    allUsers {
                        id
                    }
                }
            `;

                const token = "not valid token";

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
            });

            test("should not throw if authenticated type definition", async () => {
                const query = `
                query {
                    allUsers {
                        id
                    }
                }
            `;

                const token = createBearerToken(secret);

                const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

                expect(gqlResult.errors).toBeUndefined();
            });
        });
    });
});
