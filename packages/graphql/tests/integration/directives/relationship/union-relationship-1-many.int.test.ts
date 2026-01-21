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

describe("1-* relationships involving Union type", () => {
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
            union Actor =  ${Dog} | ${Person} 
            union Director = ${Person} | ${AI}
            type ${Movie} @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Person} @node {
                name: String!
                actedIn: ${Movie}! @relationship(type: "ACTED_IN", direction: OUT)
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ${Dog} @node {
                nickName: String!
                actedIn: ${Movie}! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type ${AI} @node {
                model: String!
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

    test("returns all relationships", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(:${Dog} { nickName: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(a:${AI} { model: "T-800"})
            CREATE(:${Movie} { title: "The Apartment"})<-[:DIRECTED]-(a)
        `);

        const query = `
            query {
               ${Movie.plural}(where: {title: {eq: "The Matrix"}}) {
                    actor {
                        ... on ${Person} {
                            name
                            actedIn {
                                title
                            }
                        }
                        ... on ${Dog} {
                            nickName
                            actedIn {
                                title
                            }
                        }
                    }
                    director {
                        ... on ${Person} {
                            name
                            directed {
                                title
                            }
                        }
                        ... on ${AI} {
                            model
                            directed {
                                title
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
                    actor: [
                        {
                            nickName: "Hachiko",
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
                        model: "T-800",
                        directed: [
                            {
                                title: "The Matrix",
                            },
                            {
                                title: "The Apartment",
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("filter returns 1 element", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(:${Dog} { nickName: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(a:${AI} { model: "T-800"})
            CREATE(:${Movie} { title: "The Apartment"})<-[:DIRECTED]-(a)
        `);

        const query = `
            query {
               ${Movie.plural}(where: {title: {eq: "The Matrix"}}) {
                    actor(where: { ${Person}: { name: { eq: "Albert" } }, ${Dog}: { nickName: { eq: "Hachiko" } } }) {
                        ... on ${Person} {
                            name
                            actedIn {
                                title
                            }
                        }
                        ... on ${Dog} {
                            nickName
                            actedIn {
                                title
                            }
                        }
                    }
                    director {
                        ... on ${Person} {
                            name
                            directed {
                                title
                            }
                        }
                        ... on ${AI} {
                            model
                            directed(where: { title: { eq: "The Apartment" } }) {
                                title
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
                    actor: [
                        {
                            nickName: "Hachiko",
                            actedIn: {
                                title: "The Matrix",
                            },
                        },
                    ],
                    director: {
                        model: "T-800",
                        directed: [
                            {
                                title: "The Apartment",
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("no filter from the 1- relationship side", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(:${Dog} { nickName: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(a:${AI} { model: "T-800"})
            CREATE(:${Movie} { title: "The Apartment"})<-[:DIRECTED]-(a)
        `);

        const query = `
            query {
               ${Movie.plural}(where: {title: {eq: "The Matrix"}}) {
                    actor {
                        ... on ${Person} {
                            name
                            actedIn {
                                title
                            }
                        }
                        ... on ${Dog} {
                            nickName
                            actedIn {
                                title
                            }
                        }
                    }
                    director(where: { ${Person}: { name: { eq: "Albert" } } }) {
                        ... on ${Person} {
                            name
                            directed {
                                title
                            }
                        }
                        ... on ${AI} {
                            model
                            directed {
                                title
                            }
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
