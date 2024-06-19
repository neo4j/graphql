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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("@limit directive", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Production: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Production = testHelper.createUniqueType("Production");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @limit(default: 2, max: 4){
                title: String
                ratings: Int!
                description: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
            type ${Actor} @node @limit(default: 3, max: 5) {
                name: String
            }

            type ${Production} @node @limit(max: 2) {
                name: String
            }
            
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (m1:${Movie} {title: "The Matrix", description: "DVD edition", movieRatings: 5})
            CREATE (m1b:${Movie} {title: "The Matrix", description: "Cinema edition", movieRatings: 4})
            CREATE (m2:${Movie} {title: "The Matrix 2", movieRatings: 2})
            CREATE (m3:${Movie} {title: "The Matrix 3", movieRatings: 4})
            CREATE (m4:${Movie} {title: "The Matrix 4", movieRatings: 3})

            CREATE (a1:${Actor} {name: "Keanu Reeves"})
            CREATE (a2:${Actor} {name: "Joe Pantoliano"})
            CREATE (a3:${Actor} {name: "Laurence Fishburne"})
            CREATE (a4:${Actor} {name: "Carrie-Anne Moss"})
            CREATE (a5:${Actor} {name: "Hugo Weaving"})
            CREATE (a6:${Actor} {name: "Lana Wachowski"})

            CREATE (p1:${Production} {name: "Warner Bros"})
            CREATE (p2:${Production} {name: "Disney"})
            CREATE (p3:${Production} {name: "Universal"})

            WITH m1, m1b, m2, m3, m4, a1, a2, a3, a4, a5, a6 
            UNWIND [a1, a2, a3, a4, a5, a6] as ai
            CREATE (ai)-[:ACTED_IN]->(m1)
            CREATE (ai)-[:ACTED_IN]->(m1b)
            CREATE (ai)-[:ACTED_IN]->(m2)
            CREATE (ai)-[:ACTED_IN]->(m3)
            CREATE (ai)-[:ACTED_IN]->(m4)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should limit the top level query with default value", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: expect.toBeArrayOfSize(2),
                },
            },
        });
    });

    test("should override the default limit if 'first' provided", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection(first: 3) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: expect.toBeArrayOfSize(3),
                },
            },
        });
    });

    test("should limit the top level query with max value if not default is available", async () => {
        const query = /* GraphQL */ `
            query {
                ${Production.plural} {
                    connection {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Production.plural]: {
                connection: {
                    edges: expect.toBeArrayOfSize(2),
                },
            },
        });
    });

    test("should limit the top level query with max value the option given is higher", async () => {
        const query = /* GraphQL */ `
            query {
                ${Production.plural} {
                    connection(first: 10){
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Production.plural]: {
                connection: {
                    edges: expect.toBeArrayOfSize(2),
                },
            },
        });
    });

    test("should limit the nested field with default value", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection(first: 1) {
                        edges {
                            node {
                                title
                                actors {
                                    connection {
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
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: [
                        expect.objectContaining({
                            node: {
                                title: expect.any(String),
                                actors: {
                                    connection: {
                                        edges: expect.toBeArrayOfSize(3),
                                    },
                                },
                            },
                        }),
                    ],
                },
            },
        });
    });

    test("should override the default limit to the nested field if `first` provided", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection(first: 1) {
                        edges {
                            node {
                                title
                                actors {
                                    connection(first: 4) {
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
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: [
                        expect.objectContaining({
                            node: {
                                title: expect.any(String),
                                actors: {
                                    connection: {
                                        edges: expect.toBeArrayOfSize(4),
                                    },
                                },
                            },
                        }),
                    ],
                },
            },
        });
    });

    test("should limit the nested field with max value if `first` option given is higher", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection(first: 1) {
                        edges {
                            node {
                                title
                                actors {
                                    connection(first: 10) {
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
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: [
                        expect.objectContaining({
                            node: {
                                title: expect.any(String),
                                actors: {
                                    connection: {
                                        edges: expect.toBeArrayOfSize(5),
                                    },
                                },
                            },
                        }),
                    ],
                },
            },
        });
    });
});
