/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth/jwt-where-filter", () => {
    const testHelper = new TestHelper();

    const secret = "secret";
    const trustedIssuer = "https://idp.example.com";

    let Record: UniqueType;

    beforeEach(async () => {
        Record = testHelper.createUniqueType("Record");
        await testHelper.executeCypher(`CREATE (:${Record} { id: "1", adminOnlyData: "admin-eyes-only" })`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("multiple conditions combined with implicit AND", () => {
        const typeDefs = (jwtFilter: string) => /* GraphQL */ `
            type JWTPayload @jwt {
                iss: String
                roles: [String!]!
            }
            type ${Record} @authentication(operations: [READ], jwt: ${jwtFilter}) @node {
                id: ID
                adminOnlyData: String
            }
        `;

        const createQuery = () => /* GraphQL */ `
            {
                ${Record.plural} {
                    id
                    adminOnlyData
                }
            }
        `;

        test("should not throw when all jwt conditions are satisfied", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ iss: { eq: "${trustedIssuer}" }, roles: { includes: "admin" } }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: trustedIssuer, roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[Record.plural]).toEqual([{ id: "1", adminOnlyData: "admin-eyes-only" }]);
        });

        test("should throw when only the first jwt condition is not satisfied", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ iss: { eq: "${trustedIssuer}" }, roles: { includes: "admin" } }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: "https://evil.example.com", roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw when the first jwt condition is satisfied but a subsequent condition is not", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ iss: { eq: "${trustedIssuer}" }, roles: { includes: "admin" } }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: trustedIssuer, roles: ["user"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw when a condition listed later is not satisfied, regardless of condition order", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ roles: { includes: "admin" }, iss: { eq: "${trustedIssuer}" } }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: "https://evil.example.com", roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });

    describe("explicit logical operators", () => {
        const typeDefs = (jwtFilter: string) => /* GraphQL */ `
            type JWTPayload @jwt {
                iss: String
                roles: [String!]!
            }
            type ${Record} @authentication(operations: [READ], jwt: ${jwtFilter}) @node {
                id: ID
                adminOnlyData: String
            }
        `;

        const createQuery = () => /* GraphQL */ `
            {
                ${Record.plural} {
                    id
                    adminOnlyData
                }
            }
        `;

        test("should throw when an AND condition is not satisfied", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ AND: [{ iss: { eq: "${trustedIssuer}" } }, { roles: { includes: "admin" } }] }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: trustedIssuer, roles: ["user"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw when either OR condition is satisfied", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ OR: [{ iss: { eq: "${trustedIssuer}" } }, { roles: { includes: "admin" } }] }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const issuerSatisfiedToken = createBearerToken(secret, { iss: trustedIssuer, roles: ["user"] });
            const issuerResult = await testHelper.executeGraphQLWithToken(createQuery(), issuerSatisfiedToken);
            expect(issuerResult.errors).toBeUndefined();
            expect((issuerResult as any).data[Record.plural]).toEqual([{ id: "1", adminOnlyData: "admin-eyes-only" }]);

            const roleSatisfiedToken = createBearerToken(secret, { iss: "https://evil.example.com", roles: ["admin"] });
            const roleResult = await testHelper.executeGraphQLWithToken(createQuery(), roleSatisfiedToken);
            expect(roleResult.errors).toBeUndefined();
            expect((roleResult as any).data[Record.plural]).toEqual([{ id: "1", adminOnlyData: "admin-eyes-only" }]);
        });

        test("should throw when no OR condition is satisfied", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ OR: [{ iss: { eq: "${trustedIssuer}" } }, { roles: { includes: "admin" } }] }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: "https://evil.example.com", roles: ["user"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should throw when a NOT condition is satisfied", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ NOT: { iss: { eq: "${trustedIssuer}" } } }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: trustedIssuer, roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });

        test("should not throw when a NOT condition is not satisfied", async () => {
            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs(`{ NOT: { iss: { eq: "${trustedIssuer}" } } }`),
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { iss: "https://evil.example.com", roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(createQuery(), token);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[Record.plural]).toEqual([{ id: "1", adminOnlyData: "admin-eyes-only" }]);
        });
    });
});
