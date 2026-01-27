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

describe("1-* simple relationship", () => {
    let Movie: UniqueType;
    let Person: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                director: ${Person}! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type ${Person} @node {
                name: String!
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
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

    test("returns all relationships", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED]-(a:${Person} { name: "Keanu"})
            CREATE(a)-[:DIRECTED]->(:${Movie} { title: "The Matrix 2"})
        `);

        const query = `
            query {
               ${Person.plural} {
                    directed {
                        title
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Person.plural]: [
                {
                    directed: expect.toIncludeSameMembers([
                        {
                            title: "The Matrix",
                        },
                        {
                            title: "The Matrix 2",
                        },
                    ]),
                },
            ],
        });
    });

    test("nested filter", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED]-(a:${Person} { name: "Keanu"})
            CREATE (:${Movie} { title: "The Apartment"})
        `);

        const query = `
            query {
               ${Movie.plural}(where: { director: { name: { eq: "Keanu" } } }) {
                    director {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    director: {
                        name: "Keanu",
                    },
                },
            ],
        });
    });

    test("double nested filter", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED]-(a:${Person} { name: "Keanu"})
            CREATE (:${Movie} { title: "The Apartment"})
        `);

        const query = `
            query {
               ${Person.plural}(where: { directed: { some: { director: { name: { eq: "Keanu" } } } } }) {
                    directed {
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
                    directed: [
                        {
                            title: "The Matrix",
                            director: {
                                name: "Keanu",
                            },
                        },
                    ],
                },
            ],
        });
    });

    test("nested filter with edge properties", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED {year: 1999}]-(a:${Person} { name: "Keanu"})
            CREATE (:${Movie} { title: "The Apartment"})
        `);

        const query = `
            query {
               ${Movie.plural}(where: { directorConnection: { edge: { year: { eq: 1999 } } } }) {
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
                                    name: "Keanu",
                                },
                                properties: {
                                    year: 1999,
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
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED {year: 1999}]-(a:${Person} { name: "Keanu"})
            CREATE (:${Movie} { title: "The Apartment"})
        `);

        const query = `
            query {
               ${Person.plural}(where: { directedConnection: { some: { node: { directorConnection: { OR: [{ edge: { year: { gt: 2000 } } }, { node: { name: { startsWith: "K" } } }] } } } } }) {
                    directedConnection {
                        edges {
                            node {
                                title
                                directorConnection {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                }
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
            [Person.plural]: [
                {
                    directedConnection: {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix",
                                    directorConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: "Keanu",
                                                },
                                            },
                                        ],
                                    },
                                },
                                properties: {
                                    year: 1999,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("filter returns 1 element", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED]-(a:${Person} { name: "Keanu"})
            CREATE(a)-[:DIRECTED]->(:${Movie} { title: "The Matrix 2"})
        `);

        const query = `
            query {
               ${Person.plural} {
                    directed(where: { title: {eq: "The Matrix"} }) {
                        title
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Person.plural]: [
                {
                    directed: [
                        {
                            title: "The Matrix",
                        },
                    ],
                },
            ],
        });
    });

    test("filter returns > 1 element", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED]-(a:${Person} { name: "Keanu"})
            CREATE(a)-[:DIRECTED]->(:${Movie} { title: "The Matrix 2"})
        `);

        const query = `
            query {
               ${Person.plural} {
                    directed(where: { title: {startsWith: "The Matrix"} }) {
                        title
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Person.plural]: [
                {
                    directed: expect.toIncludeSameMembers([
                        {
                            title: "The Matrix",
                        },
                        {
                            title: "The Matrix 2",
                        },
                    ]),
                },
            ],
        });
    });

    test("fails on 1-1 non nullable relationship", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})
        `);

        const query = `
            query {
                ${Movie.plural} {
                    director {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toEqual([
            expect.objectContaining({
                message: `Cannot return null for non-nullable field ${Movie}.director.`,
            }),
        ]);
    });

    test("no filter from the 1- relationship side", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:DIRECTED]-(a:${Person} { name: "Keanu"})
        `);

        const query = `
            query {
               ${Movie.plural} {
                    director(where: { name: {startsWith: "The Matrix"} }) {
                        name
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
