/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2812", () => {
    const testHelper = new TestHelper();

    const secret = "secret";

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${Actor} @authorization(validate: [{ where: { node: { nodeCreatedBy_EQ: "$jwt.sub" } } }]) @node {
                id: ID! @id
                name: String
                nodeCreatedBy: String
                fieldA: String @authorization(validate: [{ operations: [CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "role-A" } } }])
                fieldB: String @authorization(validate: [{ operations: [CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "role-B" } } }])
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type ${Movie} @authorization(validate: [{ operations: [CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) @node {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("valid roles", () => {
        test("should not raise with auth fields partially included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldB: "a" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeFalsy();
        });

        test("should not raise with auth fields always included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b", fieldB: "a" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldA: "b", fieldB: "a" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeFalsy();
        });

        test("should not raise with auth fields not included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1"} }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const token = createBearerToken(secret, { roles: ["role-A", "role-B", "admin"], sub: "User" });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeFalsy();
        });
    });

    describe("invalid roles", () => {
        test("should raise with auth fields partially included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldA: "b" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldB: "a" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const token = createBearerToken(secret, { roles: ["admin"], sub: "User" });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeTruthy();
        });

        test("should raise with auth fields always included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1", fieldB: "a", fieldA: "b" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User", fieldB: "a", fieldA: "b" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const token = createBearerToken(secret, { roles: ["admin"], sub: "User" });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeTruthy();
        });

        test("should not raise with auth fields not included in the input", async () => {
            const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { id: "1", actors: { create: [{ node: { nodeCreatedBy: "User", name: "actor 1" } }] } }
                        { id: "2", actors: { create: [{ node: { nodeCreatedBy: "User" } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;
            const token = createBearerToken(secret, { roles: ["admin"], sub: "User" });

            const result = await testHelper.executeGraphQLWithToken(query, token);
            expect(result.errors).toBeFalsy();
        });
    });
});
