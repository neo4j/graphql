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

describe("1-* relationship involving Interface type", () => {
    let Movie: UniqueType;
    let Person: UniqueType;
    let Dog: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Dog = testHelper.createUniqueType("Dog");

        const typeDefs = /* GraphQL */ `
            interface Actor {
                name: String!
            }
            interface Director {
                years: Int!
            }

            type ${Movie} @node {
                title: String!
                actor: [${Dog}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                director: ${Person} @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type ${Dog} implements Actor @node {
                name: String!
                actedIn: ${Movie} @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ${Person} implements Actor & Director @node{
                name: String!
                years: Int!
                actedIn: ${Movie} @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
             }

            type ActedIn @relationshipProperties {
                screenTime: Int!
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

    test("create single relationship", async () => {
        const query = `
            mutation {
                ${Movie.operations.create}(input: [{ title: "The Matrix", director: { create: { node: { name: "Keanu", years: 20 } } } }]) {
                    ${Movie.plural} {
                        title
                        director {
                           name
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                        director: {
                            name: "Keanu",
                        },
                    },
                ],
            },
        });

        await testHelper.expectRelationship(Person, Movie, "DIRECTED").toEqual([
            {
                from: {
                    name: "Keanu",
                    years: 20,
                },
                to: {
                    title: "The Matrix",
                },
                relationship: {},
            },
        ]);
    });

    test("delete single relationship", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(k:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(m2)
            CREATE(k)-[:DIRECTED]->(:${Movie} { title: "Holiday"})
        `);

        const query = `
            mutation {
                ${Movie.operations.delete}(where: { title: { eq: "Holiday" } }, delete: { director: { delete: { actedIn: { where: { node: { title: { startsWith: "The" } } } } } } }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.operations.delete]: {
                nodesDeleted: 3,
            },
        });

        await testHelper.expectNode(Movie).toEqual([{ title: "The Office" }]);
    });

    test("returns all fields", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(m2)
        `);

        const query = `
            query {
               ${Movie.plural} {
                    title
                    actor {
                        name
                        actedIn {
                            title
                        }
                    }
                    director {
                       years
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
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                    actor: [
                        {
                            name: "Hachiko",
                            actedIn: expect.toBeOneOf([{ title: "The Matrix" }, { title: "The Office" }]),
                        },
                    ],
                    director: {
                        years: 10,
                        directed: expect.toIncludeSameMembers([
                            {
                                title: "The Matrix",
                            },
                            {
                                title: "The Office",
                            },
                        ]),
                    },
                },
                {
                    title: "The Office",
                    actor: [
                        {
                            name: "Hachiko",
                            actedIn: expect.toBeOneOf([{ title: "The Matrix" }, { title: "The Office" }]),
                        },
                    ],
                    director: {
                        years: 10,
                        directed: expect.toIncludeSameMembers([
                            {
                                title: "The Matrix",
                            },
                            {
                                title: "The Office",
                            },
                        ]),
                    },
                },
            ]),
        });
    });

    test("returns filtered", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(m2)
        `);

        const query = `
            query {
               ${Movie.plural}(where: {title: {eq: "The Matrix"}}) {
                    actor(where: { name: {startsWith: "K" } }) {
                        name
                        actedIn {
                            title
                        }
                    }
                    director {
                       years
                       directed(where: {title: { eq: "The Office"} }) {
                            title
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actor: [],
                    director: {
                        years: 10,
                        directed: [
                            {
                                title: "The Office",
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("nested filter", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(m2)
        `);

        const query = `
            query {
               ${Movie.plural}(where: { director: { name: { eq: "Director" } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "The Office",
                },
            ]),
        });
    });

    test("double nested filter", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(m2)
        `);

        const query = `
            query {
               ${Person.plural}(where: { actedIn: { director: { years: { eq: 10 } } } }) {
                    actedIn {
                        title
                        director {
                            name
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Person.plural]: [
                {
                    actedIn: {
                        title: "The Matrix",
                        director: {
                            name: "Director",
                        },
                    },
                },
            ],
        });
    });

    test("nested filter with edge properties", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN {screenTime: 100}]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN {screenTime: 20}]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED {year: 2020}]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED {year: 1995}]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN {screenTime: 50}]->(m2)
        `);

        const query = `
            query {
               ${Movie.plural}(where: { directorConnection: { edge: { year: { gt: 1999 } } } }) {
                    directorConnection {
                        edges {
                            node {
                                name
                            }
                            properties {
                                year
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    directorConnection: {
                        edges: [
                            {
                                node: {
                                    name: "Director",
                                },
                                properties: {
                                    year: 2020,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("double nested filter with edge properties", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN {screenTime: 100}]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN {screenTime: 20}]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED {year: 2020}]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED {year: 1995}]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN {screenTime: 50}]->(m2)
        `);

        const query = `
            query {
               ${Movie.plural}(where: { actorConnection: { some: { node: { actedInConnection: { OR: [{ edge: { screenTime: { gt: 20 } } }, { node: { title: { eq: "The Matrix" } } }] } } } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "The Office",
                },
            ]),
        });
    });

    test("no filter from the 1- relationship side", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(d:${Person} { name: "Director", years: 10})
            CREATE(d)-[:DIRECTED]->(m2:${Movie} { title: "The Office"})
            CREATE(a)-[:ACTED_IN]->(m2)
        `);

        const query = `
            query {
               ${Movie.plural} {
                    actor {
                        name
                        actedIn {
                            title
                        }
                    }
                    director(where: {name: { eq: "Keanu"} }) {
                       years
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
            `Unknown argument "where" on field "${Movie}.director".`
        );
    });
});
