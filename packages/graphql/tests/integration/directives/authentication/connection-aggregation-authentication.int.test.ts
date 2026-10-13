/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Connection aggregation authentication", () => {
    const testHelper = new TestHelper();
    let Employee: UniqueType;

    beforeEach(async () => {
        Employee = testHelper.createUniqueType("Employee");

        const typeDefs = /* GraphQL */ `
            type ${Employee} @node {
                name: String
                salary: Float @authentication
                ssn: String @authentication
                coworkers: [${Employee}!]! @relationship(type: "KNOWS", direction: OUT)
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

        await testHelper.executeCypher(`
            CREATE (:${Employee} { name: "Alice", salary: 185000.0, ssn: "111-22-3333" })
            CREATE (:${Employee} { name: "Bob", salary: 240000.0, ssn: "444-55-6666" })
            WITH 1 AS ignored
            MATCH (alice:${Employee} { name: "Alice" }), (bob:${Employee} { name: "Bob" })
            CREATE (alice)-[:KNOWS]->(bob)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("rejects an unauthenticated aggregate over an authenticated field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.operations.connection} {
                    aggregate {
                        node {
                            salary {
                                min
                                max
                                average
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
        expect(gqlResult.data?.[Employee.operations.connection]).toBeFalsy();
    });

    test("rejects an unauthenticated string aggregate over an authenticated field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.operations.connection} {
                    aggregate {
                        node {
                            ssn {
                                longest
                                shortest
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
        expect(gqlResult.data?.[Employee.operations.connection]).toBeFalsy();
    });

    test("allows an unauthenticated aggregate over unprotected fields of an entity with protected fields", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.operations.connection} {
                    aggregate {
                        count { nodes }
                        node { name { longest } }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data?.[Employee.operations.connection]).toEqual({
            aggregate: {
                count: { nodes: 2 },
                node: { name: { longest: "Alice" } },
            },
        });
    });

    test("allows an authenticated aggregate over a protected field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.operations.connection} {
                    aggregate { node { ssn { longest } } }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"));

        expect(gqlResult.errors).toBeUndefined();
    });

    test("rejects an unauthenticated relationship aggregate over an authenticated field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.plural} {
                    coworkersConnection {
                        aggregate { node { salary { max } } }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
    });

    test("allows an unauthenticated relationship aggregate over an unprotected field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.plural}(where: { name: { eq: "Alice" } }) {
                    coworkersConnection {
                        aggregate { node { name { longest } } }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data?.[Employee.plural]).toEqual([
            { coworkersConnection: { aggregate: { node: { name: { longest: "Bob" } } } } },
        ]);
    });
});
