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

    describe("type-level authentication on entities returned by @cypher fields", () => {
        const initSchema = async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node @authentication {
                    name: String
                    secret: String
                }

                type Query {
                    topUser: ${User}
                        @cypher(statement: "MATCH (u:${User}) RETURN u ORDER BY u.name LIMIT 1", columnName: "u")
                    allUsers: [${User}!]!
                        @cypher(statement: "MATCH (u:${User}) RETURN u ORDER BY u.name", columnName: "u")
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

            await testHelper.executeCypher(`
                CREATE (:${User} { name: "Alice", secret: "alice-secret" })
                CREATE (:${User} { name: "Bob", secret: "bob-secret" })
            `);
        };

        test("should throw unauthenticated on a single @cypher field when unauthenticated", async () => {
            await initSchema();

            const query = /* GraphQL */ `
                {
                    topUser {
                        name
                        secret
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
            expect(gqlResult.data?.topUser).toBeFalsy();
        });

        test("should throw unauthenticated on a list @cypher field when unauthenticated", async () => {
            await initSchema();

            const query = /* GraphQL */ `
                {
                    allUsers {
                        name
                        secret
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
            expect(gqlResult.data?.allUsers).toBeFalsy();
        });

        test("should return data from a @cypher field when authenticated", async () => {
            await initSchema();

            const query = /* GraphQL */ `
                {
                    topUser {
                        name
                        secret
                    }
                    allUsers {
                        name
                    }
                }
            `;

            const token = createBearerToken(secret, { sub: generate({ charset: "alphabetic" }) });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                topUser: { name: "Alice", secret: "alice-secret" },
                allUsers: [{ name: "Alice" }, { name: "Bob" }],
            });
        });

        test("should throw unauthenticated on a nested @cypher field returning a protected type", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    name: String
                    profile: ${User.name}Profile
                        @cypher(statement: "MATCH (p:${User.name}Profile) RETURN p LIMIT 1", columnName: "p")
                }

                type ${User.name}Profile @node @authentication {
                    email: String
                    secret: String
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

            await testHelper.executeCypher(`
                CREATE (:${User} { name: "Keanu" })
                CREATE (:${User.name}Profile { email: "keanu@example.com", secret: "keanu-secret" })
            `);

            const query = /* GraphQL */ `
                {
                    ${User.plural} {
                        name
                        profile {
                            email
                            secret
                        }
                    }
                }
            `;

            const unauthenticatedResult = await testHelper.executeGraphQL(query);

            expect(unauthenticatedResult.errors).toHaveLength(1);
            expect(unauthenticatedResult.errors?.[0]?.message).toBe("Unauthenticated");

            const token = createBearerToken(secret, { sub: generate({ charset: "alphabetic" }) });
            const authenticatedResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(authenticatedResult.errors).toBeUndefined();
            expect(authenticatedResult.data).toEqual({
                [User.plural]: [{ name: "Keanu", profile: { email: "keanu@example.com", secret: "keanu-secret" } }],
            });
        });

        test("should throw unauthenticated on a root @cypher field on Mutation returning a protected type", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node @authentication {
                    name: String
                    secret: String
                }

                type Mutation {
                    makeUser(name: String!): ${User}
                        @cypher(statement: "CREATE (u:${User} { name: $name }) RETURN u", columnName: "u")
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

            const query = /* GraphQL */ `
                mutation {
                    makeUser(name: "Alice") {
                        name
                    }
                }
            `;

            const unauthenticatedResult = await testHelper.executeGraphQL(query);

            expect(unauthenticatedResult.errors).toHaveLength(1);
            expect(unauthenticatedResult.errors?.[0]?.message).toBe("Unauthenticated");

            const token = createBearerToken(secret, { sub: generate({ charset: "alphabetic" }) });
            const authenticatedResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(authenticatedResult.errors).toBeUndefined();
            expect(authenticatedResult.data).toEqual({
                makeUser: { name: "Alice" },
            });
        });

        test("should throw unauthenticated on a nested @cypher field selected in a generated mutation response", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    name: String
                    profile: ${User.name}Profile
                        @cypher(statement: "MATCH (p:${User.name}Profile) RETURN p LIMIT 1", columnName: "p")
                }

                type ${User.name}Profile @node @authentication {
                    email: String
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

            await testHelper.executeCypher(`
                CREATE (:${User.name}Profile { email: "keanu@example.com" })
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.create}(input: [{ name: "Keanu" }]) {
                        ${User.plural} {
                            name
                            profile {
                                email
                            }
                        }
                    }
                }
            `;

            const unauthenticatedResult = await testHelper.executeGraphQL(query);

            expect(unauthenticatedResult.errors).toHaveLength(1);
            expect(unauthenticatedResult.errors?.[0]?.message).toBe("Unauthenticated");

            const token = createBearerToken(secret, { sub: generate({ charset: "alphabetic" }) });
            const authenticatedResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(authenticatedResult.errors).toBeUndefined();
            expect(authenticatedResult.data).toEqual({
                [User.operations.create]: {
                    [User.plural]: [{ name: "Keanu", profile: { email: "keanu@example.com" } }],
                },
            });
        });
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

    test("should apply both type-level and field-level authentication - pass", async () => {
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

        const token = createBearerToken(secret, { sub: userId, roles: ["admin"] });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any).adminData.customId).toEqual(userId);
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
