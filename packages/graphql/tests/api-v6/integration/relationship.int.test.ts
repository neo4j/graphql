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

describe("Relationship simple query", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actors");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
            CREATE (movie:${Movie} {title: "The Matrix"})<-[:ACTED_IN {year: $year}]-(a:${Actor} {name: "Keanu"})
        `,
            {
                year: 1999,
            }
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be able to get a Movie with related actors", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                title
                                actors {
                                    connection {
                                        edges {
                                            node {
                                                name
                                            },
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
            [Movie.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                title: "The Matrix",
                                actors: {
                                    connection: {
                                        edges: [
                                            {
                                                node: { name: "Keanu" },
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

    test("should be able to get a Movie with related actors and relationship properties", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                title
                                actors {
                                    connection {
                                        edges {
                                            node {
                                                name
                                            },
                                            properties {
                                                year
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
            [Movie.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                title: "The Matrix",
                                actors: {
                                    connection: {
                                        edges: [
                                            {
                                                node: { name: "Keanu" },
                                                properties: { year: 1999 },
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

    test("should be able to get a Movie with related actors and relationship properties with aliased fields", async () => {
        const query = /* GraphQL */ `
            query {
                myMovies: ${Movie.plural} {
                    c: connection {
                        e: edges {
                            n: node {
                               name: title
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
                    e: [
                        {
                            n: {
                                name: "The Matrix",
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
                    ],
                },
            },
        });
    });
});
