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

import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

/*
 * Auth rules are already tested in the auth tests,
 * this suite is needed only to test field-level rules where the unwind optimization behave differently.
 */

describe("unwind-create field-level auth rules", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    describe("bind", () => {
        test("should raise an error if a user is created with the id different from the JWT", async () => {
            const User = testHelper.createUniqueType("User");

            const typeDefs = `
                type ${User} {
                    id: ID
                }
                extend type ${User} {
                    id: ID @authorization(validate: [{ operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
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

            const id = generate({
                charset: "alphabetic",
            });

            const id2 = generate({
                charset: "alphabetic",
            });

            const query = `
            mutation($id: ID!, $id2: ID!) {
                ${User.operations.create}(input: [{ id: $id }, {id: $id2 }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
            `;

            const token = createBearerToken("secret", { sub: id });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
                variableValues: { id, id2 },
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should not raise an error if a user is created without id", async () => {
            const User = testHelper.createUniqueType("User");

            const typeDefs = `
            type ${User} {
                id: ID
                name: String
            }
            extend type ${User} {
                id: ID @authorization(validate: [{ operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
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

            const id = generate({
                charset: "alphabetic",
            });

            const name = generate({
                charset: "alphabetic",
            });

            const query = `
            mutation($id: ID!, $name: String!) {
                ${User.operations.create}(input: [{ id: $id }, { name: $name }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
            `;

            const token = createBearerToken("secret", { sub: id });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
                variableValues: { id, name },
            });

            expect(gqlResult.errors).toBeFalsy();
        });

        test("should not raise an error if a nested user is created without id", async () => {
            const User = testHelper.createUniqueType("User");
            const Post = testHelper.createUniqueType("Post");

            const typeDefs = `
            type ${User} {
                id: ID
                name: String
            }
            type ${Post} {
                title: String
                creator: ${User} @relationship(type: "HAS_POST", direction: IN)
            }
            extend type ${User} {
                id: ID @authorization(validate: [{ operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
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

            const id = generate({
                charset: "alphabetic",
            });

            const name = generate({
                charset: "alphabetic",
            });

            const query = `
            mutation($id: ID!, $name: String!) {
                ${Post.operations.create}(input: [{
                    title: "one", 
                    creator: { create: { node: { id: $id } } }
                }, { 
                    title: "two", 
                    creator: { create: { node: { name: $name } } }
                }]) {
                    ${Post.plural} {
                        title 
                        creator {
                            id
                        }
                    }
                }
            }
            `;

            const token = createBearerToken("secret", { sub: id });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
                variableValues: { id, name },
            });

            expect(gqlResult.errors).toBeFalsy();
        });
    });

    describe("role", () => {
        test("should raise an error if a user is created with a role different from the JWT", async () => {
            const User = testHelper.createUniqueType("User");

            const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${User} {
                id: ID
                name: String
            }
            extend type ${User} {
                id: ID @authorization(validate: [{ operations: [CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }])
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

            const id = generate({
                charset: "alphabetic",
            });

            const id2 = generate({
                charset: "alphabetic",
            });

            const query = `
            mutation($id: ID!, $id2: ID!) {
                ${User.operations.create}(input: [{ id: $id }, {id: $id2 }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
            `;

            const token = createBearerToken("secret", { roles: ["user"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
                variableValues: { id, id2 },
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should not raise an error if a user is created without id", async () => {
            const User = testHelper.createUniqueType("User");

            const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${User} {
                id: ID
                name: String
            }
            extend type ${User} {
                id: ID @authorization(validate: [{ operations: [CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }])
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

            const name = generate({
                charset: "alphabetic",
            });

            const query = `
            mutation($name: String!) {
                ${User.operations.create}(input: [{ name: $name }, { name: $name }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
            `;

            const token = createBearerToken("secret", { roles: ["invalid-role"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
                variableValues: { name },
            });

            expect(gqlResult.errors).toBeFalsy();
        });
    });
});
