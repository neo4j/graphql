/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level with @authorization filter", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { title: { eq: "someTitle" } } } }]) {
                title: String!
                released: Int! @groupBy @authorization(filter: [{ where: { node: { other: { eq: 1 } } } }])
                other: Int! @groupBy
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Person} @node {
                name: String! @authorization(filter: [{ where: { node: { name: { eq: "someName" } } } }])
                born: Int! @groupBy
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

    test("filters grouped values using type and field authorization rules", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 2})
            CREATE (:${Movie} {title: "anotherTitle", released: 2001, other: 1})
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
                groupBy: [
                    {
                        values: {
                            released: 1999,
                            other: 1,
                        },
                    },
                ],
            },
        });
    });

    test("filters grouped edges by type-level title authorization", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "someTitle", released: 2001, other: 1})
            CREATE (:${Movie} {title: "anotherTitle", released: 1999, other: 1})
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

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: [
                            {
                                node: {
                                    title: "someTitle",
                                },
                            },
                        ],
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "someTitle",
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("returns no groups when every movie is filtered out by type-level authorization", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "otherTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "anotherTitle", released: 2001, other: 1})
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
                groupBy: [],
            },
        });
    });

    test("returns grouped aggregate for rows allowed by type-level filter authorization", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "someTitle", released: 2001, other: 1})
            CREATE (:${Movie} {title: "otherTitle", released: 2001, other: 1})
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
});
