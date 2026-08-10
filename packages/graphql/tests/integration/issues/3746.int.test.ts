/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3746", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should apply field-level authentication to root field on Query - pass", async () => {
        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                customId: ID
            }

            type Query {
                me: ${User} @authentication(operations: ["READ"])
                you: ${User} @authentication(operations: ["READ"])
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
            type ${User} @node {
                customId: ID
            }

            type Query {
                me: ${User} @authentication(operations: ["READ"])
                you: ${User}
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
            type ${User} @node {
                customId: ID
            }

            type Query @authentication(operations: ["READ"]) {
                me: ${User}
                you: ${User}
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
            type ${User} @node {
                customId: ID
            }

            type Query @authentication(operations: ["READ"]) {
                me: ${User}
                you: ${User}
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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

    test("should apply both type-level and field-level authentication - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${User} @node {
                customId: ID
            }

            type Query @authentication(operations: ["READ"]) {
                me: ${User}
                adminData: ${User} @authentication(jwt: { roles_INCLUDES: "admin" })
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                adminData {
                    customId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: { me: () => ({}), adminData: () => ({}) },
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
            },
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const token = createBearerToken(secret, { sub: userId, roles: ["user"] });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });

    test("should apply field-level authentication to root field on Mutation - throw unauthenticated", async () => {
        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                customId: ID
            }

            type Query {
                me: ${User} @authentication(operations: ["READ"])
                you: ${User}
            }

            type Mutation {
                updateMe(id: ID): ${User} @authentication(operations: ["CREATE"])
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
            type ${User} @node {
                customId: ID
            }

            type Query {
                me: ${User} @authentication(operations: ["READ"])
                you: ${User}
            }

            type Mutation @authentication(operations: ["CREATE"]) {
                updateMe(id: ID): ${User}
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
            type ${User} @node {
                customId: ID
            }

            type Query {
                me: ${User}
                you: ${User}
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
            type ${User} @node {
                customId: ID
            }

            type Query {
                me: ${User}
                you: ${User}
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
            type ${User} @node {
                customId: ID
            }

            type Query {
                me: ${User}
                you: ${User}
            }

            type Mutation {
                updateMe(id: ID): ${User}
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
                [User.name]: { customId: (_, __, ctx) => ctx.jwt.sub },
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
