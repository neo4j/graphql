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

describe("@groupBy directive top level with nested connection aggregate and relationship properties", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Person: UniqueType;
    let ActedIn: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        ActedIn = testHelper.createUniqueType("ActedIn");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                year: Int! @groupBy
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "${ActedIn}", direction: IN)
            }
            type ${Person} @node {
                name: String!
            }
            type ${ActedIn} @relationshipProperties {
                role: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("groupBy with nested actorsConnection aggregate including edge and node aggregations", async () => {
        await testHelper.executeCypher(`
            CREATE (m1:${Movie} {title: "The Matrix", year: 1999})
            CREATE (m2:${Movie} {title: "Another Movie", year: 1999})
            CREATE (m3:${Movie} {title: "Sequel", year: 2001})
            CREATE (p1:${Person} {name: "Keanu Reeves"})
            CREATE (p2:${Person} {name: "Carrie-Anne Moss"})
            CREATE (p3:${Person} {name: "Laurence Fishburne"})
            CREATE (m1)<-[:ACTED_IN {role: "Neo"}]-(p1)
            CREATE (m1)<-[:ACTED_IN {role: "Carrie"}]-(p2)
            CREATE (m2)<-[:ACTED_IN {role: "Trinity"}]-(p2)
            CREATE (m3)<-[:ACTED_IN {role: "Morpheus"}]-(p3)
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: { year: true }) {
                        values {
                            year
                        }
                        edges {
                            node {
                                title
                                actorsConnection {
                                    aggregate {
                                        count {
                                            nodes
                                        }
                                        edge {
                                            role {
                                                longest
                                            }
                                        }
                                        node {
                                            name {
                                                shortest
                                            }
                                        }
                                    }
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
                        values: { year: 1999 },
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                    actorsConnection: {
                                        aggregate: {
                                            count: { nodes: 2 },
                                            edge: { role: { longest: "Carrie" } },
                                            node: { name: { shortest: "Keanu Reeves" } },
                                        },
                                        edges: [
                                            { node: { name: "Keanu Reeves" } },
                                            { node: { name: "Carrie-Anne Moss" } },
                                        ],
                                    },
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                    actorsConnection: {
                                        aggregate: {
                                            count: { nodes: 1 },
                                            edge: { role: { longest: "Trinity" } },
                                            node: { name: { shortest: "Carrie-Anne Moss" } },
                                        },
                                        edges: [{ node: { name: "Carrie-Anne Moss" } }],
                                    },
                                },
                            },
                        ]),
                    },
                    {
                        values: { year: 2001 },
                        edges: [
                            {
                                node: {
                                    title: "Sequel",
                                    actorsConnection: {
                                        aggregate: {
                                            count: { nodes: 1 },
                                            edge: { role: { longest: "Morpheus" } },
                                            node: { name: { shortest: "Laurence Fishburne" } },
                                        },
                                        edges: [{ node: { name: "Laurence Fishburne" } }],
                                    },
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });
});
