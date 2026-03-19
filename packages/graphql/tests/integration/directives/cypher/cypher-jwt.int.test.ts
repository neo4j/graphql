/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("should inject the JWT into cypher directive", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("query", async () => {
        const typeDefs = `
            type Query {
                userId: ID @cypher(statement: """
                    RETURN $jwt.sub AS sub
                """, columnName: "sub")
            }
        `;

        const userId = generate({
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
            {
                userId
            }
        `;

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).userId).toEqual(userId);
    });

    test("query (decoded JWT)", async () => {
        const typeDefs = `
            type Query {
                userId: ID @cypher(statement: """
                    RETURN $jwt.sub AS sub
                """, columnName: "sub")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            {
                userId
            }
        `;

        const jwt = {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        };

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: { jwt },
        });

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).userId).toEqual(userId);
    });

    test("mutation", async () => {
        const typeDefs = `
            type ${User} @node {
                id: ID
            }

            type Mutation {
                userId: ID @cypher(statement: """
                    RETURN $jwt.sub AS sub
                """, columnName: "sub")
            }
        `;

        const userId = generate({
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
                userId
            }
        `;

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).userId).toEqual(userId);
    });

    test("mutation (decoded JWT)", async () => {
        const typeDefs = `
            type ${User} @node {
                id: ID
            }

            type Mutation {
                userId: ID @cypher(statement: """
                    RETURN $jwt.sub AS a
                """, columnName: "a")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const jwt = {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        };

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                userId
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: { jwt },
        });

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).userId).toEqual(userId);
    });

    test("should inject the auth into cypher directive on fields", async () => {
        const typeDefs = `
            type ${User} @node {
                id: ID
                userId: ID @cypher(statement: """
                    RETURN $jwt.sub AS a
                """, columnName: "a")
            }
        `;

        const userId = generate({
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
        {
             ${User.plural}(where: {id_EQ: "${userId}"}){
                userId
            }
        }
        `;

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})
            `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[User.plural][0].userId).toEqual(userId);
    });

    test("should inject the auth into cypher directive on fields (decoded JWT)", async () => {
        const typeDefs = `
            type ${User} @node {
                id: ID
                userId: ID @cypher(statement: """
                    RETURN $jwt.sub AS a
                """, columnName: "a")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const jwt = {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        };

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
        {
             ${User.plural}(where: {id_EQ: "${userId}"}){
                userId
            }
        }
        `;

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})
            `);

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: { jwt },
        });

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[User.plural][0].userId).toEqual(userId);
    });
});
