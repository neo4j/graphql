/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Interfaces", () => {
    let Person: UniqueType;
    let Movie: UniqueType;
    let Series: UniqueType;

    const testHelper = new TestHelper();

    describe("Queries", () => {
        beforeEach(async () => {
            Person = testHelper.createUniqueType("Person");
            Movie = testHelper.createUniqueType("Movie");
            Series = testHelper.createUniqueType("Series");

            const typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                actors: [${Person}!]! @declareRelationship
            }

            type ${Movie} implements Production @node {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Series} implements Production @node {
                title: String!
                episodes: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "ActedInSeries", direction: IN)
            }

            type ActedIn @relationshipProperties {
                roles: [String!]!
            }

            type ActedInSeries @relationshipProperties {
                roles: [String!]!
                episodes: Int
            }

            type ${Person} @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.executeCypher(`
                CREATE (p:${Person} {name: "Ben Affleck"})
                CREATE (a:${Movie} {title: "Argo", released: 2012})
                CREATE (g:${Movie} {title: "Gone Girl", released: 2014})
                CREATE (b:${Series} {title: "Buffy The Vampire Slayer", episodes: 144})
                CREATE (t:${Series} {title: "The Voyage Of The Mimi", episodes: 7})
                MERGE (p)-[:ACTED_IN {roles: ["Tony Mendez"]}]->(a)
                MERGE (p)-[:ACTED_IN {roles: ["Nick Dunne"]}]->(g)
                MERGE (p)-[:ACTED_IN {roles: ["Basketball Player #10"], episodes: 1}]->(b)
                MERGE (p)-[:ACTED_IN {roles: ["C.T. Granville"], episodes: 7}]->(t)
            `);
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("example 1: Get Production nodes with related Actor nodes", async () => {
            const query = /* GraphQL */ `
            query {
                productions(limit: 10, sort: { title: ASC }) {
                    title
                    ... on ${Movie} {
                        released
                    }
                    actors {
                        name
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                productions: [
                    {
                        title: "Argo",
                        released: 2012,
                        actors: [
                            {
                                name: "Ben Affleck",
                            },
                        ],
                    },
                    {
                        title: "Buffy The Vampire Slayer",
                        actors: [
                            {
                                name: "Ben Affleck",
                            },
                        ],
                    },
                    {
                        title: "Gone Girl",
                        released: 2014,
                        actors: [
                            {
                                name: "Ben Affleck",
                            },
                        ],
                    },
                    {
                        title: "The Voyage Of The Mimi",
                        actors: [
                            {
                                name: "Ben Affleck",
                            },
                        ],
                    },
                ],
            });
        });

        test("example 2: Get Production nodes with related Actor nodes and relationship properties", async () => {
            const query = /* GraphQL */ `
                query {
                    productionsConnection(first: 10, sort: [{ title: ASC }]) {
                        edges {
                            node {
                                title
                                actorsConnection(first: 2, sort: { node: { name: ASC } }) {
                                    edges {
                                        node {
                                            name
                                        }
                                        properties {
                                            ... on ActedIn {
                                                roles
                                            }
                                            ... on ActedInSeries {
                                                roles
                                                episodes
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
                productionsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: "Argo",
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: "Ben Affleck",
                                            },
                                            properties: {
                                                roles: ["Tony Mendez"],
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            node: {
                                title: "Buffy The Vampire Slayer",
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: "Ben Affleck",
                                            },
                                            properties: {
                                                roles: ["Basketball Player #10"],
                                                episodes: 1,
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            node: {
                                title: "Gone Girl",
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: "Ben Affleck",
                                            },
                                            properties: {
                                                roles: ["Nick Dunne"],
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            node: {
                                title: "The Voyage Of The Mimi",
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: "Ben Affleck",
                                            },
                                            properties: {
                                                roles: ["C.T. Granville"],
                                                episodes: 7,
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    ]),
                },
            });
        });

        test("example 3: Get all Person nodes with all Production nodes they ACTED_IN", async () => {
            const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    name
                    actedIn {
                        title
                        ... on ${Movie} {
                            released
                        }
                        ... on ${Series} {
                            episodes
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.plural]: [
                    {
                        name: "Ben Affleck",
                        actedIn: expect.toIncludeSameMembers([
                            {
                                title: "Argo",
                                released: 2012,
                            },
                            {
                                title: "Buffy The Vampire Slayer",
                                episodes: 144,
                            },
                            {
                                title: "Gone Girl",
                                released: 2014,
                            },
                            {
                                title: "The Voyage Of The Mimi",
                                episodes: 7,
                            },
                        ]),
                    },
                ],
            });
        });

        test("example 4: Get all Person nodes with Production nodes they ACTED_IN filtered by Movie type", async () => {
            const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    name
                    actedIn(where: { typename: [${Movie}]  }) {
                        title
                        ... on ${Movie} {
                            released
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.plural]: [
                    {
                        name: "Ben Affleck",
                        actedIn: expect.toIncludeSameMembers([
                            {
                                title: "Argo",
                                released: 2012,
                            },
                            {
                                title: "Gone Girl",
                                released: 2014,
                            },
                        ]),
                    },
                ],
            });
        });
    });

    describe("Mutations", () => {
        beforeEach(async () => {
            Person = testHelper.createUniqueType("Person");
            Movie = testHelper.createUniqueType("Movie");
            Series = testHelper.createUniqueType("Series");

            const typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                actors: [${Person}!]! @declareRelationship
            }

            type ${Movie} implements Production @node {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Series} implements Production @node {
                title: String!
                episodes: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "ActedInSeries", direction: IN)
            }

            type ActedIn @relationshipProperties {
                roles: [String!]!
            }

            type ActedInSeries @relationshipProperties {
                roles: [String!]!
                episodes: Int
            }

            type ${Person} @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("example 5: Create a Person node with related Production nodes", async () => {
            const query = /* GraphQL */ `
            mutation CreateActorAndProductions {
                ${Person.operations.create}(
                    input: [
                        {
                            name: "Ben Affleck"
                            actedIn: {
                                create: [
                                    {
                                        edge: { roles: ["Tony Mendez"] }
                                        node: { ${Movie}: { title: "Argo", released: 2012 } }
                                    }
                                    {
                                        edge: { roles: ["Nick Dunne"] }
                                        node: { ${Movie}: { title: "Gone Girl", released: 2014 } }
                                    }
                                    {
                                        edge: { roles: ["Basketball Player #10"] }
                                        node: { ${Series}: { title: "Buffy the Vampire Slayer", episodes: 144 } }
                                    }
                                    {
                                        edge: { roles: ["C.T. Granville"] }
                                        node: { ${Series}: { title: "The Voyage of the Mimi", episodes: 7 } }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    ${Person.plural} {
                        name
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.create]: {
                    [Person.plural]: [
                        {
                            name: "Ben Affleck",
                        },
                    ],
                },
            });

            await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: "Ben Affleck",
                    },
                    to: {
                        title: "Argo",
                        released: 2012,
                    },
                    relationship: {
                        roles: ["Tony Mendez"],
                    },
                },
                {
                    from: {
                        name: "Ben Affleck",
                    },
                    to: {
                        title: "Gone Girl",
                        released: 2014,
                    },
                    relationship: {
                        roles: ["Nick Dunne"],
                    },
                },
            ]);
            await testHelper.expectRelationship(Person, Series, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: "Ben Affleck",
                    },
                    to: {
                        title: "Buffy the Vampire Slayer",
                        episodes: 144,
                    },
                    relationship: {
                        roles: ["Basketball Player #10"],
                    },
                },
                {
                    from: {
                        name: "Ben Affleck",
                    },
                    to: {
                        title: "The Voyage of the Mimi",
                        episodes: 7,
                    },
                    relationship: {
                        roles: ["C.T. Granville"],
                    },
                },
            ]);
        });

        test("example 6: Update Person nodes and create ACTED_IN relationships to Production nodes filtered by Movie type", async () => {
            await testHelper.executeCypher(`
            CREATE (p:${Person} {name: "Jace Norman"})
            CREATE (h:${Movie} {title: "Henry Danger", released: 2025})
            CREATE (hs:${Series} {title: "Henry Danger", released: 2010})
            MERGE (p)-[:ACTED_IN {roles: ["Henry Danger"]}]->(hs)
        `);

            const query = /* GraphQL */ `
            mutation {
                ${Person.operations.update}(
                    where: { name: { eq: "Jace Norman" } }
                    update: {
                        actedIn: [
                            {
                                connect: [
                                    {
                                        edge: { roles: ["Henry Hart"] }
                                        where: {
                                            node: {
                                                typename: [${Movie}],
                                                title: { eq: "Henry Danger" }
                                            },
                                        },
                                    },
                                ],
                            },
                        ]
                    }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.update]: {
                    info: {
                        relationshipsCreated: 1,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: "Jace Norman",
                    },
                    to: {
                        title: "Henry Danger",
                        released: 2025,
                    },
                    relationship: {
                        roles: ["Henry Hart"],
                    },
                },
            ]);
        });

        test("example 7: Update Person nodes and update the ACTED_IN relationships to any Production nodes with relationship properties based on the properties type", async () => {
            //  setup
            await testHelper.executeCypher(`
            CREATE (p:${Person} {name: "Jace Norman"})
            CREATE (h:${Movie} {title: "Henry Danger", released: 2025})
            CREATE (hs:${Series} {title: "Henry Danger", released: 2010})
            MERGE (p)-[:ACTED_IN {roles: ["Henry Danger"]}]->(hs)
            MERGE (p)-[:ACTED_IN {roles: ["Henry Danger"]}]->(h)
        `);
            const query = /* GraphQL */ `
            mutation {
                ${Person.operations.update}(
                    where: { name: { eq: "Jace Norman" } }
                    update: {
                        actedIn: [
                            {
                                update: {
                                    where: { node:  { title:  { eq: "Henry Danger" } } }
                                    node: {
                                        actors: [
                                            {
                                                update: {
                                                    edge: {
                                                        ActedIn: { roles: { set: ["Henry Hart"] } }, 
                                                        ActedInSeries: { roles: { set: ["Henry Hart"] }, episodes: { set: 57 } } 
                                                    } 
                                                } 
                                            }
                                        ],
                                    },
                                }
                            }
                        ]
                    }
                ) {
                    info {
                    relationshipsCreated
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.update]: {
                    info: {
                        relationshipsCreated: 0,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: "Jace Norman",
                    },
                    to: {
                        title: "Henry Danger",
                        released: 2025,
                    },
                    relationship: {
                        roles: ["Henry Hart"],
                    },
                },
            ]);
        });
    });
});
