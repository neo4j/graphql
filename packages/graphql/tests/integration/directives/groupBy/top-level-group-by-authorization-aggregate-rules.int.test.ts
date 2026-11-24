/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level with @authorization aggregation rules", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                    @authorization(
                        filter: [
                            {
                                where: {
                                    node: {
                                        actorsConnection: {
                                            aggregate: { node: { name: { shortestLength: { gt: 2 } } } }
                                        }
                                    }
                                }
                            }
                        ]
                    )
                released: Int!
                    @groupBy
                    @authorization(
                        validate: [
                            {
                                where: {
                                    node: {
                                        actorsConnection: {
                                            aggregate: { node: { name: { shortestLength: { gt: 2 } } } }
                                        }
                                    }
                                }
                            }
                        ]
                    )
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

    test("throws forbidden for values projection when aggregate validate rule fails", async () => {
        await testHelper.executeCypher(`
            CREATE (m1:${Movie} {title: "Movie One", released: 1999, other: 1})
            CREATE (m2:${Movie} {title: "Movie Two", released: 2001, other: 1})
            CREATE (m1)<-[:ACTED_IN]-(:${Person} {name: "someName", born: 1970})
            CREATE (m2)<-[:ACTED_IN]-(:${Person} {name: "Al", born: 1970})
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

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("filters movies in node projection based on aggregate filter rule", async () => {
        await testHelper.executeCypher(`
            CREATE (m1:${Movie} {title: "Movie One", released: 1999, other: 1})
            CREATE (m2:${Movie} {title: "Movie Two", released: 2001, other: 1})
            CREATE (m3:${Movie} {title: "Movie Three", released: 1999, other: 2})
            CREATE (m1)<-[:ACTED_IN]-(:${Person} {name: "someName", born: 1970})
            CREATE (m2)<-[:ACTED_IN]-(:${Person} {name: "Al", born: 1975})
            CREATE (m3)<-[:ACTED_IN]-(:${Person} {name: "someName", born: 1980})
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
                                    title: "Movie One",
                                },
                            },
                        ],
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "Movie Three",
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("applies nested person filter authorization in grouped nested actorsConnection", async () => {
        await testHelper.executeCypher(`
            CREATE (m1:${Movie} {title: "Movie One", released: 1999, other: 1})
            CREATE (m1)<-[:ACTED_IN]-(:${Person} {name: "someName", born: 1970})
            CREATE (m1)<-[:ACTED_IN]-(:${Person} {name: "someoneElse", born: 1980})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: { released: true, other: true }) {
                        values {
                            released
                            other
                        }
                        edges {
                            node {
                                title
                                actorsConnection {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
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
                groupBy: [
                    {
                        values: {
                            released: 1999,
                            other: 1,
                        },
                        edges: [
                            {
                                node: {
                                    title: "Movie One",
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: "someName",
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        });
    });
});
