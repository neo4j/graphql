/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level with nested connection", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                year: Int! @groupBy
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Person} @node {
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("groupBy in top level query with nested connection in groupBy", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})<-[:ACTED_IN]-(:${Person} { name: "Another Keanu" })
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {year: true}) {
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

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                    actorsConnection: { edges: [] },
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: "Another Keanu",
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                    actorsConnection: { edges: [] },
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("groupBy in top level query with nested connection with limit in groupBy", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (m:${Movie} {title: "Another Movie", year: 1999})
            
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Actor 1" })
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Actor 2" })
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Actor 3" })
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                                actorsConnection(first: 2, sort: {node: {name: ASC}}) {
                                    edges {
                                        node {
                                            name
                                        }
                                    }º
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                    actorsConnection: { edges: [] },
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: "Actor 1",
                                                },
                                            },
                                            {
                                                node: {
                                                    name: "Actor 2",
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                    actorsConnection: { edges: [] },
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("groupBy in top level query with nested connection in groupBy and nested aggregate", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})<-[:ACTED_IN]-(:${Person} { name: "Another Keanu" })
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                                actorsConnection {
                                    aggregate {
                                    count {
                                        nodes
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                    actorsConnection: { aggregate: { count: { nodes: 0 } } },
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                    actorsConnection: {
                                        aggregate: { count: { nodes: 1 } },
                                    },
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                    actorsConnection: { aggregate: { count: { nodes: 0 } } },
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });
});
