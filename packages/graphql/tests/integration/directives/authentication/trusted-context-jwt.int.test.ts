/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("HTTP authentication with a developer-set trusted context.jwt", () => {
    const testHelper = new TestHelper();

    let Product: UniqueType;
    const secret = "secret";

    beforeEach(async () => {
        Product = testHelper.createUniqueType("Product");
        await testHelper.executeCypher(`CREATE (:${Product} { id: "1", name: "Marvin" })`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("a developer-set context.jwt authenticates a query with role-gated authentication", async () => {
        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }
            type ${Product} @authentication(operations: [READ], jwt: { roles: { includes: "admin" } }) @node {
                id: ID
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = /* GraphQL */ `
            {
                ${Product.plural} {
                    id
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { roles: ["admin"] } },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({ [Product.plural]: [{ id: "1" }] });
    });

    test("a validly signed bearer token authenticates a role-gated query", async () => {
        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }
            type ${Product} @authentication(operations: [READ], jwt: { roles: { includes: "admin" } }) @node {
                id: ID
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = /* GraphQL */ `
            {
                ${Product.plural} {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["admin"] });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({ [Product.plural]: [{ id: "1" }] });
    });

    test("a well-formed bearer token signed with the wrong key is rejected", async () => {
        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }
            type ${Product} @authentication(operations: [READ], jwt: { roles: { includes: "admin" } }) @node {
                id: ID
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = /* GraphQL */ `
            {
                ${Product.plural} {
                    id
                }
            }
        `;

        const token = createBearerToken("wrong-secret", { roles: ["admin"] });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
    });

    test("a malformed bearer token is rejected on a role-gated query", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Product} @authentication(operations: [READ]) @node {
                id: ID
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = /* GraphQL */ `
            {
                ${Product.plural} {
                    id
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, "not a valid token");

        expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
    });

    test("a $jwt.sub authorization filter matches a developer-set context.jwt", async () => {
        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }
            type ${Product}
                @authorization(filter: [{ where: { node: { id: { eq: "$jwt.sub" } } } }])
                @node {
                id: ID
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = /* GraphQL */ `
            {
                ${Product.plural} {
                    id
                }
            }
        `;

        const matching = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { sub: "1" } },
        });
        expect(matching.errors).toBeUndefined();
        expect(matching.data).toEqual({ [Product.plural]: [{ id: "1" }] });

        const nonMatching = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { sub: "2" } },
        });
        expect(nonMatching.errors).toBeUndefined();
        expect(nonMatching.data).toEqual({ [Product.plural]: [] });
    });
});
