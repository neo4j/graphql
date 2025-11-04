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

describe("https://github.com/neo4j/graphql/issues/3746", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    afterEach(async () => {
        await testHelper.close();
    });

    test("should apply field-level authentication to root field on Query - pass", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query {
                me: User @authentication(operations: ["READ"])
                you: User @authentication(operations: ["READ"])
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                me {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any).me.customId).toEqual(userId);
    });

    test("should apply field-level authentication to root field on Query - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query {
                me: User @authentication(operations: ["READ"])
                you: User
            }
        `;

        const query = /* GraphQL */ `
            {
                me {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });

    test("should apply type-level authentication to root field on Query - pass", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query @authentication(operations: ["READ"]) {
                me: User
                you: User
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                me {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any).me.customId).toEqual(userId);
    });

    test("should apply type-level authentication to root field on Query - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query @authentication(operations: ["READ"]) {
                me: User
                you: User
            }
        `;

        const query = /* GraphQL */ `
            {
                me {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });

    test("should apply field-level authentication to root field on Mutation - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query {
                me: User @authentication(operations: ["READ"])
                you: User
            }

            type Mutation {
                updateMe(id: ID): User @authentication(operations: ["CREATE"])
            }
        `;

        const query = /* GraphQL */ `
            mutation {
                updateMe(id: 3) {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                Mutation: { updateMe: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });

    test("should apply type-level authentication to root field on Mutation - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query {
                me: User @authentication(operations: ["READ"])
                you: User
            }

            type Mutation @authentication(operations: ["CREATE"]) {
                updateMe(id: ID): User
            }
        `;

        const query = /* GraphQL */ `
            mutation {
                updateMe(id: 3) {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                Mutation: { updateMe: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });

    test("should apply schema-level defined authentication to root field on Query - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query {
                me: User
                you: User
            }

            extend schema @authentication(operations: ["READ"])
        `;

        const query = /* GraphQL */ `
            {
                me {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });

    test("should apply schema-level defined authentication to root field on Query - pass", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query {
                me: User
                you: User
            }

            extend schema @authentication(operations: ["READ"])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                me {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const token = createBearerToken(secret, { sub: userId });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any).me.customId).toEqual(userId);
    });

    test("should apply schema-level defined authentication to root field on Mutation - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type User {
                customId: ID
            }

            type Query {
                me: User
                you: User
            }

            type Mutation {
                updateMe(id: ID): User
            }

            extend schema @authentication(operations: ["UPDATE"])
        `;

        const query = /* GraphQL */ `
            mutation {
                updateMe(id: 3) {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), you: () => ({}) },
                User: { customId: (_, __, ctx) => ctx.jwt.sub },
                Mutation: { updateMe: () => ({}) },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });
});
