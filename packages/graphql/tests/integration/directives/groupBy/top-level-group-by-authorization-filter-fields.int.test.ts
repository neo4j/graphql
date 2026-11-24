/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level with @authorization filter on fields", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String! @authorization(filter: [{ where: { node: { title: { eq: "someTitle" } } } }])
                released: Int! @groupBy @authorization(filter: [{ where: { node: { other: { eq: 1 } } } }])
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

    test("values projection applies released field filter rule", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 2})
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

    test("node projection applies title field filter rule", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
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
                groupBy: [
                    {
                        edges: [
                            {
                                node: {
                                    title: "someTitle",
                                },
                            },
                        ],
                    },
                ],
            },
        });
    });

    test("returns no groups when all rows are filtered by field rules", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 2})
            CREATE (:${Movie} {title: "otherTitle", released: 2001, other: 1})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: { released: true, other: true }) {
                        values {
                            released
                            other
                        }
                        edges{
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
                groupBy: [],
            },
        });
    });

    test("returns grouped aggregate for rows allowed by field-level filter authorization", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "someTitle", released: 1999, other: 1})
            CREATE (:${Movie} {title: "someTitle", released: 2001, other: 1})
            CREATE (:${Movie} {title: "anotherTitle", released: 2001, other: 1})
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
