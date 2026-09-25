/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy with field-level validate authorization and JWT", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let Employee: UniqueType;

    beforeEach(async () => {
        Employee = testHelper.createUniqueType("P12Employee");

        const typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                sub: String
            }

            type ${Employee} @node {
                id: ID
                department: String @groupBy
                salary: Int @authorization(validate: [{ where: { node: { id: { eq: "$jwt.sub" } } } }])
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
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("throws forbidden when grouped node projection includes salary for rows not matching jwt sub", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Employee} {id: "alice", department: "eng", salary: 185000})
            CREATE (:${Employee} {id: "bob", department: "eng", salary: 240000})
            CREATE (:${Employee} {id: "carol", department: "sales", salary: 95000})
        `);

        const query = /* GraphQL */ `
            query {
                ${Employee.operations.connection} {
                    groupBy(fields: { department: true }) {
                        edges {
                            node {
                                id
                                salary
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "alice" });
        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("returns grouped node projection when query is restricted to jwt subject", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Employee} {id: "alice", department: "eng", salary: 185000})
            CREATE (:${Employee} {id: "bob", department: "eng", salary: 240000})
            CREATE (:${Employee} {id: "carol", department: "sales", salary: 95000})
        `);

        const query = /* GraphQL */ `
            query {
                ${Employee.operations.connection}(where: { id: { eq: "alice" } }) {
                    groupBy(fields: { department: true }) {
                        edges {
                            node {
                                id
                                salary
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "alice" });
        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Employee.operations.connection]: {
                groupBy: [
                    {
                        edges: [
                            {
                                node: {
                                    id: "alice",
                                    salary: 185000,
                                },
                            },
                        ],
                    },
                ],
            },
        });
    });
});
