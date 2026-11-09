/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Aggregation authentication", () => {
    const testHelper = new TestHelper();
    let Employee: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Employee = testHelper.createUniqueType("Employee");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Employee} @node {
                name: String
                salary: Float @authentication
                ssn: String @authentication
                coworkers: [${Employee}!]! @relationship(type: "KNOWS", direction: OUT)
            }

            type ${Movie} @node @authentication(operations: [AGGREGATE]) {
                title: String
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
            CREATE (:${Movie} { title: "Alpha" })
            CREATE (:${Movie} { title: "Beta" })
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
                ${Employee.operations.aggregate} {
                    salary {
                                min
                                max
                                average
                                sum
                            }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
        expect(gqlResult.data?.[Employee.operations.aggregate]).toBeFalsy();
    });

    test("rejects an unauthenticated string aggregate over an authenticated field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.operations.aggregate} {
                    ssn {
                                longest
                                shortest
                            }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
        expect(gqlResult.data?.[Employee.operations.aggregate]).toBeFalsy();
    });

    test("allows an unauthenticated aggregate over unprotected fields of an entity with protected fields", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.operations.aggregate} {
                    count
                    name { longest }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data?.[Employee.operations.aggregate]).toEqual({
            count: 2,
            name: { longest: "Alice" },
        });
    });

    test("allows an authenticated aggregate over a protected field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.operations.aggregate}(where: { name: "Bob" }) {
                    ssn { longest }
                    salary { max }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"));

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data?.[Employee.operations.aggregate]).toEqual({
            ssn: { longest: "444-55-6666" },
            salary: { max: 240000 },
        });
    });

    test("rejects an unauthenticated relationship aggregate over an authenticated field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.plural} {
                    coworkersAggregate {
                        node { salary { max } }
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
                ${Employee.plural}(where: { name: "Alice" }) {
                    coworkersAggregate {
                        node { name { longest } }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data?.[Employee.plural]).toEqual([
            { coworkersAggregate: { node: { name: { longest: "Bob" } } } },
        ]);
    });

    test("allows an authenticated relationship aggregate over a protected field", async () => {
        const query = /* GraphQL */ `
            {
                ${Employee.plural}(where: { name: "Alice" }) {
                    coworkersAggregate {
                        node { salary { max } }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"));

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data?.[Employee.plural]).toEqual([
            { coworkersAggregate: { node: { salary: { max: 240000 } } } },
        ]);
    });

    test("allows an authenticated aggregate over an aggregate-authenticated entity", async () => {
        const query = /* GraphQL */ `
            {
                ${Movie.operations.aggregate} { count }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"));

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data?.[Movie.operations.aggregate]).toEqual({ count: 2 });
    });

    test("rejects an unauthenticated top-level aggregate over an aggregate-authenticated entity", async () => {
        const query = /* GraphQL */ `
            {
                ${Movie.operations.aggregate} {
                    count
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Unauthenticated");
        expect(gqlResult.data?.[Movie.operations.aggregate]).toBeFalsy();
    });
});
