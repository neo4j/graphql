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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("1-* relationship involving Interface type declared relationship", () => {
    let Movie: UniqueType;
    let Person: UniqueType;
    let Dog: UniqueType;
    let Series: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Dog = testHelper.createUniqueType("Dog");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
            interface Actor {
                name: String!
                actedIn: Production! @declareRelationship
                directed: [Production!]! @declareRelationship
            }
            interface Production {
                title: String!
                actor: [Actor!]! @declareRelationship
                director: ${Person}! @declareRelationship
            }

            type ${Movie} implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedInMovie")
                director: ${Person}! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type ${Series} implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN , properties: "ActedInSeries")
                director: ${Person}! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type ${Dog} implements Actor @node {
                name: String!
                actedIn: Production! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedInMovie")
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
            }

            type ${Person} implements Actor @node{
                name: String!
                actedIn: Production! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedInSeries")
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
             }

            type ActedInMovie @relationshipProperties {
                screenTime: Int
            }

            type ActedInSeries @relationshipProperties {
                episodes: Int
            }

            type Directed @relationshipProperties {
                year: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("returns all fields", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director"})
            CREATE(d)-[:DIRECTED]->(s:${Series} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(s)

        `);

        const query = `
            query {
              productions {
                    actor {
                        name
                        actedIn {
                            title
                        }
                    }
                    director {
                       name
                       directed {
                            title
                       }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            productions: [
                {
                    actor: [
                        {
                            name: "Hachiko",
                            actedIn: {
                                title: "The Matrix",
                            },
                        },
                        {
                            name: "Keanu",
                            actedIn: {
                                title: "The Matrix",
                            },
                        },
                    ],
                    director: {
                        name: "Director",
                        directed: [
                            {
                                title: "The Matrix",
                            },
                            { title: "The Office" },
                        ],
                    },
                },
                {
                    actor: [
                        {
                            name: "Hachiko",
                            actedIn: {
                                title: "The Matrix",
                            },
                        },
                    ],
                    director: {
                        name: "Director",
                        directed: [
                            {
                                title: "The Matrix",
                            },
                            { title: "The Office" },
                        ],
                    },
                },
            ],
        });
    });

    test("returns filtered fields", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director"})
            CREATE(d)-[:DIRECTED]->(s:${Series} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(s)
        `);

        const query = `
            query {
              productions {
                    actor(where: { name: { eq: "Hachiko" }}) {
                        name
                        actedIn {
                            title
                        }
                    }
                    director {
                       name
                       directed(where: { title: { eq: "The Office"} }) {
                            title
                       }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            productions: [
                {
                    actor: [
                        {
                            name: "Hachiko",
                            actedIn: {
                                title: "The Matrix",
                            },
                        },
                    ],
                    director: {
                        name: "Director",
                        directed: [{ title: "The Office" }],
                    },
                },
                {
                    actor: [
                        {
                            name: "Hachiko",
                            actedIn: {
                                title: "The Matrix",
                            },
                        },
                    ],
                    director: {
                        name: "Director",
                        directed: [{ title: "The Office" }],
                    },
                },
            ],
        });
    });

    test("nested filter", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director"})
            CREATE(d)-[:DIRECTED]->(s:${Series} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(s)
        `);

        const query = `
            query {
               productions(where: { director: { name: { eq: "Director" } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            productions: [
                {
                    title: "The Matrix",
                },
                {
                    title: "The Office",
                },
            ],
        });
    });

    test("double nested filter", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director"})
            CREATE(d)-[:DIRECTED]->(s:${Series} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(s)
        `);

        const query = `
            query {
                actors(where: { actedIn: { director: { name: { eq: "Director" } } } }) {
                    name
                    actedIn {
                        title
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            actors: [
                {
                    name: "Hachiko",
                    actedIn: {
                        title: "The Matrix",
                    },
                },
                {
                    name: "Keanu",
                    actedIn: {
                        title: "The Matrix",
                    },
                },
            ],
        });
    });

    test("nested filter with edge properties", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN {screenTime: 100}]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN {screenTime: 40, episodes: 2}]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED {year: 1992}]-(d:${Person} { name: "Director"})
            CREATE(d)-[:DIRECTED {year: 2000}]->(s:${Series} { title: "The Office"})
            CREATE(a)-[:ACTED_IN {screenTime: 20, episodes: 5}]->(s)
        `);

        const query = `
            query {
               productions(where: { directorConnection: { edge: { Directed: { year: { gt: 1992 } } } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            productions: [
                {
                    title: "The Office",
                },
            ],
        });
    });

    test("double nested filter with edge properties", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN {screenTime: 100}]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN {screenTime: 40, episodes: 2}]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED {year: 1992}]-(d:${Person} { name: "Director"})
            CREATE(d)-[:DIRECTED {year: 2000}]->(s:${Series} { title: "The Office"})
            CREATE(a)-[:ACTED_IN {screenTime: 20, episodes: 5}]->(s)
        `);

        const query = `
            query {
               actors(where: { actedInConnection: { node: { directorConnection: { OR: [{ edge: { Directed: { year: { gt: 1996 } } } }, { node: { name: { eq: "Director" } } }] } } }  }) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            actors: [
                {
                    name: "Hachiko",
                },
                {
                    name: "Keanu",
                },
            ],
        });
    });

    test("no filter from the 1- relationship side", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director"})
            CREATE(d)-[:DIRECTED]->(s:${Series} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(s)
        `);

        const query = `
            query {
              productions {
                    actor {
                        name
                        actedIn {
                            title
                        }
                    }
                    director(where: { name: { eq: "Hachiko" }}) {
                       name
                       directed {
                            title
                       }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toHaveLength(1);
        expect((result.errors?.[0] || { message: "" }).message).toBe(
            `Unknown argument "where" on field "Production.director".`
        );
    });
});
