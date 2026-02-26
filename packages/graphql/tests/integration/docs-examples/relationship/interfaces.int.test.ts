/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Interfaces", () => {
    let Person: UniqueType;
    let Movie: UniqueType;
    let Series: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
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

    afterAll(async () => {
        await testHelper.close();
    });

    describe("Queries", () => {
        const BenAffleck = `Ben Affleck ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const Argo = `Argo ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const GoneGirl = `Gone Girl ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const BuffyTheVampireSlayer = `Buffy the Vampire Slayer ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const TheVoyageOfTheMimi = `The Voyage of the Mimi ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;

        beforeAll(async () => {
            // set-up for queries
            await testHelper.executeCypher(`
                CREATE (p:${Person} {name: "${BenAffleck}"})
                CREATE (a:${Movie} {title: "${Argo}", released: 2012})
                CREATE (g:${Movie} {title: "${GoneGirl}", released: 2014})
                CREATE (b:${Series} {title: "${BuffyTheVampireSlayer}", episodes: 144})
                CREATE (t:${Series} {title: "${TheVoyageOfTheMimi}", episodes: 7})
                MERGE (p)-[:ACTED_IN {roles: ["Tony Mendez"]}]->(a)
                MERGE (p)-[:ACTED_IN {roles: ["Nick Dunne"]}]->(g)
                MERGE (p)-[:ACTED_IN {roles: ["Basketball Player #10"], episodes: 1}]->(b)
                MERGE (p)-[:ACTED_IN {roles: ["C.T. Granville"], episodes: 7}]->(t)
            `);
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
            expect(result.data as any).toEqual({
                productions: [
                    {
                        title: Argo,
                        released: 2012,
                        actors: [
                            {
                                name: BenAffleck,
                            },
                        ],
                    },
                    {
                        title: BuffyTheVampireSlayer,
                        actors: [
                            {
                                name: BenAffleck,
                            },
                        ],
                    },
                    {
                        title: GoneGirl,
                        released: 2014,
                        actors: [
                            {
                                name: BenAffleck,
                            },
                        ],
                    },
                    {
                        title: TheVoyageOfTheMimi,
                        actors: [
                            {
                                name: BenAffleck,
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
            expect(result.data as any).toEqual({
                productionsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: Argo,
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: BenAffleck,
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
                                title: BuffyTheVampireSlayer,
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: BenAffleck,
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
                                title: GoneGirl,
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: BenAffleck,
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
                                title: TheVoyageOfTheMimi,
                                actorsConnection: {
                                    edges: [
                                        {
                                            node: {
                                                name: BenAffleck,
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
            expect(result.data as any).toEqual({
                [Person.plural]: [
                    {
                        name: BenAffleck,
                        actedIn: expect.toIncludeSameMembers([
                            {
                                title: Argo,
                                released: 2012,
                            },
                            {
                                title: BuffyTheVampireSlayer,
                                episodes: 144,
                            },
                            {
                                title: GoneGirl,
                                released: 2014,
                            },
                            {
                                title: TheVoyageOfTheMimi,
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
            expect(result.data as any).toEqual({
                [Person.plural]: [
                    {
                        name: BenAffleck,
                        actedIn: expect.toIncludeSameMembers([
                            {
                                title: Argo,
                                released: 2012,
                            },
                            {
                                title: GoneGirl,
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
            // clean-up for mutations
            await testHelper.executeCypher(`
                MATCH (p:${Person} )
                MATCH (a:${Movie} )
                MATCH (b:${Series})
                DETACH DELETE p,a,b
            `);
        });

        test("example 5: Create a Person node with related Production nodes", async () => {
            const BenAffleck = `Ben Affleck ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const Argo = `Argo ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const GoneGirl = `Gone Girl ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const BuffyTheVampireSlayer = `Buffy the Vampire Slayer ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const TheVoyageOfTheMimi = `The Voyage of the Mimi ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            const query = /* GraphQL */ `
            mutation CreateActorAndProductions {
                ${Person.operations.create}(
                    input: [
                        {
                            name: "${BenAffleck}"
                            actedIn: {
                                create: [
                                    {
                                        edge: { roles: ["Tony Mendez"] }
                                        node: { ${Movie}: { title: "${Argo}", released: 2012 } }
                                    }
                                    {
                                        edge: { roles: ["Nick Dunne"] }
                                        node: { ${Movie}: { title: "${GoneGirl}", released: 2014 } }
                                    }
                                    {
                                        edge: { roles: ["Basketball Player #10"] }
                                        node: { ${Series}: { title: "${BuffyTheVampireSlayer}", episodes: 144 } }
                                    }
                                    {
                                        edge: { roles: ["C.T. Granville"] }
                                        node: { ${Series}: { title: "${TheVoyageOfTheMimi}", episodes: 7 } }
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
            expect(result.data as any).toEqual({
                [Person.operations.create]: {
                    [Person.plural]: [
                        {
                            name: BenAffleck,
                        },
                    ],
                },
            });

            await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: BenAffleck,
                    },
                    to: {
                        title: Argo,
                        released: 2012,
                    },
                    relationship: {
                        roles: ["Tony Mendez"],
                    },
                },
                {
                    from: {
                        name: BenAffleck,
                    },
                    to: {
                        title: GoneGirl,
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
                        name: BenAffleck,
                    },
                    to: {
                        title: BuffyTheVampireSlayer,
                        episodes: 144,
                    },
                    relationship: {
                        roles: ["Basketball Player #10"],
                    },
                },
                {
                    from: {
                        name: BenAffleck,
                    },
                    to: {
                        title: TheVoyageOfTheMimi,
                        episodes: 7,
                    },
                    relationship: {
                        roles: ["C.T. Granville"],
                    },
                },
            ]);
        });

        test("example 6: Update Person nodes and create ACTED_IN relationships to Production nodes filtered by Movie type", async () => {
            const JaceNorman = `Jace Norman ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const HenryDanger = `Henry Danger ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            await testHelper.executeCypher(`
            CREATE (p:${Person} {name: "${JaceNorman}"})
            CREATE (h:${Movie} {title: "${HenryDanger}", released: 2025})
            CREATE (hs:${Series} {title: "${HenryDanger}", released: 2010})
            MERGE (p)-[:ACTED_IN {roles: ["Henry Danger"]}]->(hs)
        `);

            const query = /* GraphQL */ `
            mutation {
                ${Person.operations.update}(
                    where: { name: { eq: "${JaceNorman}" } }
                    update: {
                        actedIn: [
                            {
                                connect: [
                                    {
                                        edge: { roles: ["Henry Hart"] }
                                        where: {
                                            node: {
                                                typename: [${Movie}],
                                                title: { eq: "${HenryDanger}" }
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
            expect(result.data as any).toEqual({
                [Person.operations.update]: {
                    info: {
                        relationshipsCreated: 1,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: JaceNorman,
                    },
                    to: {
                        title: HenryDanger,
                        released: 2025,
                    },
                    relationship: {
                        roles: ["Henry Hart"],
                    },
                },
            ]);
        });

        test("example 7: Update Person nodes and update the ACTED_IN relationships to any Production nodes with relationship properties based on the properties type", async () => {
            const JaceNorman = `Jace Norman ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const HenryDanger = `Henry Danger ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            await testHelper.executeCypher(`
            CREATE (p:${Person} {name: "${JaceNorman}"})
            CREATE (h:${Movie} {title: "${HenryDanger}", released: 2025})
            CREATE (hs:${Series} {title: "${HenryDanger}", released: 2010})
            MERGE (p)-[:ACTED_IN {roles: ["Henry Danger"]}]->(hs)
            MERGE (p)-[:ACTED_IN {roles: ["Henry Danger"]}]->(h)
        `);
            const query = /* GraphQL */ `
            mutation {
                ${Person.operations.update}(
                    where: { name: { eq: "${JaceNorman}" } }
                    update: {
                        actedIn: [
                            {
                                update: {
                                    where: { node:  { title:  { eq: "${HenryDanger}" } } }
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
            expect(result.data as any).toEqual({
                [Person.operations.update]: {
                    info: {
                        relationshipsCreated: 0,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: JaceNorman,
                    },
                    to: {
                        title: HenryDanger,
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
