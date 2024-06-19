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

describe("@alias directive", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Director: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Director = testHelper.createUniqueType("Director");

        const typeDefs = /* GraphQL */ `
            type ${Director} @node {
                name: String
                nameAgain: String @alias(property: "name")
                movies: [${Movie}!]! @relationship(direction: OUT, type: "DIRECTED", properties: "Directed")
            }

            type Directed @relationshipProperties {
                year: Int!
                movieYear: Int! @alias(property: "year")
            }

            type ${Movie} @node {
                title: String
                titleAgain: String @alias(property: "title")
                directors: [${Director}!]! @relationship(direction: IN, type: "DIRECTED", properties: "Directed")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
            CREATE(m:${Movie} { title: "The Matrix" })<-[:DIRECTED {year: 1999}]-(d:${Director} {name: "Watchowsky"})
        `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Query node with alias", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                title
                                titleAgain
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
                                titleAgain: "The Matrix",
                            },
                        },
                    ],
                },
            },
        });
    });

    test("Query node and relationship with alias", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                title
                                titleAgain
                                directors {
                                    connection {
                                        edges {
                                            node {
                                                name
                                                nameAgain
                                            }
                                            properties {
                                                year
                                                movieYear
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
                                titleAgain: "The Matrix",
                                directors: {
                                    connection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: "Watchowsky",
                                                    nameAgain: "Watchowsky",
                                                },
                                                properties: {
                                                    year: 1999,
                                                    movieYear: 1999,
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
