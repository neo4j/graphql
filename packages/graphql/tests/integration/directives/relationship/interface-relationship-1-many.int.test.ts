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
    let AI: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Dog = testHelper.createUniqueType("Dog");
        AI = testHelper.createUniqueType("AI");

        const typeDefs = /* GraphQL */ `
            interface Actor {
                name: String!
            }
            interface Director {
                years: Int!
            }

            type ${Movie} @node {
                title: String!
                actor: [${Dog}!]! @relationship(type: "ACTED_IN", direction: IN)
                director: ${Person}! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Dog} implements Actor @node {
                name: String!
                actedIn: ${Movie}! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Person} implements Actor & Director @node{
                name: String!
                years: Int!
                actedIn: ${Movie}! @relationship(type: "ACTED_IN", direction: OUT)
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
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
            [Movie.plural]: [
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
                        years: 10,
                        directed: [
                            {
                                title: "The Matrix",
                            },
                            {
                                title: "The Office",
                            },
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
                        years: 10,
                        directed: [
                            {
                                title: "The Matrix",
                            },
                            {
                                title: "The Office",
                            },
                        ],
                    },
                },
            ],
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
