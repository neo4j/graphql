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

describe("Sort relationship with alias", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String @alias(property: "movieTitle")
                ratings: Int! @alias(property: "movieRatings")
                description: String
            }
            type ${Actor} @node {
                name: String
                age: Int
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int @alias(property: "movieYear")
                role: String @alias(property: "movieRole")
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (a:${Movie} {movieTitle: "The Matrix", description: "DVD edition", movieRatings: 5})
            CREATE (b:${Movie} {movieTitle: "The Matrix", description: "Cinema edition", movieRatings: 4})
            CREATE (c:${Movie} {movieTitle: "The Matrix 2", movieRatings: 2})
            CREATE (d:${Movie} {movieTitle: "The Matrix 3", movieRatings: 4})
            CREATE (e:${Movie} {movieTitle: "The Matrix 4", movieRatings: 3})
            CREATE (keanu:${Actor} {name: "Keanu", age: 55})
            CREATE (keanu)-[:ACTED_IN {movieYear: 1999, movieRole: "Neo"}]->(a)
            CREATE (keanu)-[:ACTED_IN {movieYear: 1999, movieRole: "Neo"}]->(b)
            CREATE (keanu)-[:ACTED_IN {movieYear: 2001, movieRole: "Mr. Anderson"}]->(c)
            CREATE (keanu)-[:ACTED_IN {movieYear: 2003, movieRole: "Neo"}]->(d)
            CREATE (keanu)-[:ACTED_IN {movieYear: 2021, movieRole: "Neo"}]->(e)

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
                                    connection(sort: { edges: [{ properties: { role: DESC } }, { properties: { year: ASC } } ] }) {
                                        edges {
                                            properties {
                                                year
                                                role
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
                                                properties: { year: 1999, role: "Neo" },
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                            {
                                                properties: { year: 1999, role: "Neo" },
                                                node: {
                                                    title: "The Matrix",
                                                },
                                            },
                                            {
                                                properties: { year: 2003, role: "Neo" },
                                                node: {
                                                    title: "The Matrix 3",
                                                },
                                            },
                                            {
                                                properties: { year: 2021, role: "Neo" },
                                                node: {
                                                    title: "The Matrix 4",
                                                },
                                            },
                                            {
                                                properties: { year: 2001, role: "Mr. Anderson" },
                                                node: {
                                                    title: "The Matrix 2",
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

    test("should be able to sort by relationship properties and node properties", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    connection {
                        edges {
                            node {
                                name
                                movies {
                                    connection(sort: { edges: [
                                            { properties: { role: DESC } },
                                            { node: { title: ASC } },                                           
                                            { properties: { year: DESC } },
                                            { node: { description: ASC } }
                                         
                                        ] }) {
                                        edges {
                                            properties {
                                                year
                                                role
                                            }
                                            node {
                                                title
                                                description
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
                                                properties: { year: 1999, role: "Neo" },
                                                node: {
                                                    title: "The Matrix",
                                                    description: "Cinema edition",
                                                },
                                            },
                                            {
                                                properties: { year: 1999, role: "Neo" },
                                                node: {
                                                    title: "The Matrix",
                                                    description: "DVD edition",
                                                },
                                            },

                                            {
                                                properties: { year: 2003, role: "Neo" },
                                                node: {
                                                    title: "The Matrix 3",
                                                    description: null,
                                                },
                                            },
                                            {
                                                properties: { year: 2021, role: "Neo" },
                                                node: {
                                                    title: "The Matrix 4",
                                                    description: null,
                                                },
                                            },
                                            {
                                                properties: { year: 2001, role: "Mr. Anderson" },
                                                node: {
                                                    title: "The Matrix 2",
                                                    description: null,
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
