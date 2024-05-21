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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Query aliasing", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(direction: OUT, type: "DIRECTED", properties: "Directed")
            }

            type Directed @relationshipProperties {
                year: Int!
            }

            type ${Movie} @node {
                id: ID!
                title: String
                actors: [${Actor}!]! @relationship(direction: IN, type: "DIRECTED", properties: "Directed")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
            CREATE(m:${Movie} { title: "The Matrix", id: "1" })<-[:DIRECTED {year: 1999}]-(a:${Actor} {name: "Keanu"})
            CREATE(m2:${Movie} { title: "The Matrix Reloaded", id: "2" })<-[:DIRECTED {year: 2001}]-(a)
        `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to get a Movie with related actors and relationship properties with aliased fields", async () => {
        const query = /* GraphQL */ `
            query {
                myMovies: ${Movie.plural} {
                    c: connection {
                        e: edges {
                            n: node {
                               name: title
                               uid: id,
                                a: actors {
                                    nc: connection {
                                        ne: edges {
                                            nn: node {
                                                nodeName: name
                                            },
                                            np: properties {
                                                y:year
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
            myMovies: {
                c: {
                    e: expect.toIncludeSameMembers([
                        {
                            n: {
                                name: "The Matrix",
                                uid: "1",
                                a: {
                                    nc: {
                                        ne: [
                                            {
                                                nn: { nodeName: "Keanu" },
                                                np: { y: 1999 },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        {
                            n: {
                                name: "The Matrix Reloaded",
                                uid: "2",
                                a: {
                                    nc: {
                                        ne: [
                                            {
                                                nn: { nodeName: "Keanu" },
                                                np: { y: 2001 },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ]),
                },
            },
        });
    });

    test("should allow multiple aliases on the same connection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    connection {
                        edges {
                            node {
                                first: movies(where: { edges: { node: { id: {equals:  "1" } } } }) {
                                    connection {
                                        edges {
                                            node {
                                                title
                                            }
                                        }
                                    }
                                }
                                second: movies(where: { edges: { node: { id: {equals: "2" } } } }) {
                                    connection {
                                        edges {
                                            node {
                                                titleAlias: title
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
                                first: {
                                    connection: {
                                        edges: [{ node: { title: "The Matrix" } }],
                                    },
                                },
                                second: {
                                    connection: {
                                        edges: [{ node: { titleAlias: "The Matrix Reloaded" } }],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });
    });

    test("should allow multiple aliases on relationship properties", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    connection {
                        edges {
                            node {
                                movies {
                                    connection {
                                        edges {
                                            properties {
                                                year1: year
                                                year2: year
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
                                movies: {
                                    connection: {
                                        edges: expect.arrayContaining([
                                            {
                                                properties: {
                                                    year1: 2001,
                                                    year2: 2001,
                                                },
                                            },
                                            {
                                                properties: {
                                                    year1: 1999,
                                                    year2: 1999,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });
    });

    // Check Original tests: connection/alias.int.test.ts
    test.todo("should alias pageInfo");
    test.todo("should alias cursor");
});
