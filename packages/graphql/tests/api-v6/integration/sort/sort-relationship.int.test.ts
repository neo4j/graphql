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

describe("Sort relationship", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                ratings: Int!
                description: String
            }
            type ${Actor} @node {
                name: String
                age: Int
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int
                role: String
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (a:${Movie} {title: "The Matrix", description: "DVD edition", ratings: 5})
            CREATE (b:${Movie} {title: "The Matrix", description: "Cinema edition", ratings: 4})
            CREATE (c:${Movie} {title: "The Matrix 2", ratings: 2})
            CREATE (d:${Movie} {title: "The Matrix 3", ratings: 4})
            CREATE (e:${Movie} {title: "The Matrix 4", ratings: 3})
            CREATE (keanu:${Actor} {name: "Keanu", age: 55})
            CREATE (keanu)-[:ACTED_IN {year: 1999, role: "Keanu"}]->(a)
            CREATE (keanu)-[:ACTED_IN {year: 1999, role: "Keanu"}]->(b)
            CREATE (keanu)-[:ACTED_IN {year: 2001, role: "Keanu"}]->(c)
            CREATE (keanu)-[:ACTED_IN {year: 2003, role: "Keanu"}]->(d)
            CREATE (keanu)-[:ACTED_IN {year: 2021, role: "Keanu"}]->(e)

        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be able to sort by ASC order", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    connection {
                        edges {
                            node {
                                name
                                movies {
                                    connection(sort: { edges: { node: { title: ASC } } }) {
                                        edges {
                                            node {
                                                title
                                            }
                                        }

                                    }
                                }
                            }
                    }    
               }
            }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Actor.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                name: "Keanu",
                                movies: {
                                    connection: {
                                        edges: [
                                            {
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix 2",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix 3",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix 4",
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });
    });

    test("should be able to sort by DESC order", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    connection {
                        edges {
                            node {
                                name
                                movies {
                                    connection(sort: { edges: { node: { title: DESC } } }) {
                                        edges {
                                            node {
                                                title
                                            }
                                        }

                                    }
                                }
                            }
                    }    
               }
            }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Actor.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                name: "Keanu",
                                movies: {
                                    connection: {
                                        edges: [
                                            {
                                                node: {
                                                    title: "The Matrix 4",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix 3",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix 2",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });
    });

    test("should be able to sort by multiple criteria", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    connection {
                        edges {
                            node {
                                name
                                movies {
                                    connection(sort: { edges: [{ node: { title: ASC } }, { node: { ratings: DESC } }] }) {
                                        edges {
                                            node {
                                                title
                                                description
                                                ratings
                                            }
                                        }

                                    }
                                }
                            }
                    }    
               }
            }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Actor.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                name: "Keanu",
                                movies: {
                                    connection: {
                                        edges: [
                                            {
                                                node: {
                                                    title: "The Matrix",
                                                    description: "DVD edition",
                                                    ratings: 5,
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix",
                                                    description: "Cinema edition",
                                                    ratings: 4,
                                                },
                                            },

                                            {
                                                node: {
                                                    title: "The Matrix 2",
                                                    description: null,
                                                    ratings: 2,
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix 3",
                                                    description: null,
                                                    ratings: 4,
                                                },
                                            },
                                            {
                                                node: {
                                                    title: "The Matrix 4",
                                                    description: null,
                                                    ratings: 3,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });
    });

    test("should be able to sort by relationship properties", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    connection {
                        edges {
                            node {
                                name
                                movies {
                                    connection(sort: { edges: { properties: { year: ASC } } }) {
                                        edges {
                                            properties {
                                                year
                                            }
                                            node {
                                                title
                                            }
                                        }
                                    }
                                }
                            }
                    }    
               }
            }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Actor.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                name: "Keanu",
                                movies: {
                                    connection: {
                                        edges: [
                                            {
                                                properties: { year: 1999 },
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                            {
                                                properties: { year: 1999 },
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                            {
                                                properties: { year: 2001 },
                                                node: {
                                                    title: "The Matrix 2",
                                                },
                                            },
                                            {
                                                properties: { year: 2003 },
                                                node: {
                                                    title: "The Matrix 3",
                                                },
                                            },
                                            {
                                                properties: { year: 2021 },
                                                node: {
                                                    title: "The Matrix 4",
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });
    });
});
