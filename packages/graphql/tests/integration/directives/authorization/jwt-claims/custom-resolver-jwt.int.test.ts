/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import { createBearerToken } from "../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("custom resolvers with JWT", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let User: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("auth-injection", () => {
        test("should inject auth in context of custom Query", async () => {
            const typeDefs = `
                type ${User} @node {
                    id: ID
                }

                type Query {
                    me: ${User}
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: {
                        me: (_, __, ctx) => ({ id: ctx.jwt.sub }),
                    },
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
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });

        test("should inject auth in context of custom Mutation", async () => {
            const typeDefs = `
                type ${User} @node {
                    id: ID
                }

                type Mutation {
                    me: ${User}
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                resolvers: { Mutation: { me: (_, __, ctx) => ({ id: ctx.jwt.sub }) } },
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });

        test("should inject auth in context of custom Field resolver", async () => {
            const typeDefs = `
                type ${User} @node {
                    customId: ID
                }

                type Query {
                    me: ${User}
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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: { me: () => ({}) },
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

        test("should inject auth in context of custom Query when decoded JWT passed in", async () => {
            const typeDefs = `
                type ${User} @node {
                    id: ID
                }

                type Query {
                    me: ${User}
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

            const jwt = {
                sub: userId,
                name: "John Doe",
                iat: 1516239022,
            };

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                resolvers: {
                    Query: {
                        me: (_, __, ctx) => ({ id: ctx.jwt.sub }),
                    },
                },
            });

            const gqlResult = await testHelper.executeGraphQL(query, {
                contextValue: { jwt },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any).me.id).toEqual(userId);
        });
    });
});
