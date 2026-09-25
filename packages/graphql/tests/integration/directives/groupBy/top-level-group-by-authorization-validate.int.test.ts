/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level with @authorization validate", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { title: { eq: "someTitle" } } } }]) {
                title: String!
                released: Int! @groupBy @authorization(validate: [{ where: { node: { other: { eq: 1 } } } }])
                other: Int! @groupBy
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

    test("throws forbidden when a movie violates type-level validate rule", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "anotherTitle", released: 2001, other: 1})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: { released: true, other: true }) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("returns grouped values when all movies satisfy validate rules", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "someTitle", released: 2001, other: 1})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: { released: true, other: true }) {
                        values {
                            released
                            other
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        values: {
                            released: 1999,
                            other: 1,
                        },
                    },
                    {
                        values: {
                            released: 2001,
                            other: 1,
                        },
                    },
                ]),
            },
        });
    });

    test("returns grouped aggregate when all movies satisfy validate rules", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "someTitle", released: 2001, other: 1})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(first: 10) {
                    groupBy(fields: { released: true, other: true }) {
                        values {
                            released
                            other
                        }
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        values: {
                            released: 1999,
                            other: 1,
                        },
                        aggregate: {
                            count: { nodes: 1 },
                            node: { title: { longest: "someTitle" } },
                        },
                    },
                    {
                        values: {
                            released: 2001,
                            other: 1,
                        },
                        aggregate: {
                            count: { nodes: 1 },
                            node: { title: { longest: "someTitle" } },
                        },
                    },
                ]),
            },
        });
    });

    test("throws forbidden for grouped aggregate when a movie violates type-level validate rule", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "anotherTitle", released: 2001, other: 1})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(first: 10) {
                    groupBy(fields: { released: true, other: true }) {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });
});
