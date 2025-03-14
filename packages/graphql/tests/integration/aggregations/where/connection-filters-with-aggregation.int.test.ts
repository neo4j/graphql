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

describe("aggregations-where-edge-string", () => {
    let testHelper: TestHelper;
    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        testHelper = new TestHelper();
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            interface Production {
                title: String
            }

            type ${Movie} implements Production @node {
                title: String
            }

            type ${Series} implements Production @node {
                title: String!
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screentime: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
            CREATE (a:${Actor} {name: "Keanu"})-[:ACTED_IN {screentime: 19}]->(:${Movie} {title: "The Matrix"})
            CREATE (a)-[:ACTED_IN {screentime: 20}]->(:${Movie} {title: "The Matrix: With a very long subtitle"})
            CREATE (a)-[:ACTED_IN {screentime: 19}]->(:${Series} {title: "The Mat"})
        `
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("aggregate with edge filters in nested connection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    moviesConnection(where: { edge: { screentime_EQ: 19 }, node: { title_EQ: "The Matrix" } }) {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
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
            [Actor.plural]: [
                {
                    moviesConnection: {
                        aggregate: {
                            count: {
                                nodes: 1,
                            },
                            node: {
                                title: {
                                    longest: "The Matrix",
                                },
                            },
                        },
                    },
                },
            ],
        });
    });

    test("aggregate with edge filters in nested connection to an interface", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    actedInConnection(where: { edge: { screentime_EQ: 19 }, node: { title_EQ: "The Matrix" } }) {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
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
            [Actor.plural]: [
                {
                    actedInConnection: {
                        aggregate: {
                            count: {
                                nodes: 1,
                            },
                            node: {
                                title: {
                                    longest: "The Matrix",
                                },
                            },
                        },
                    },
                },
            ],
        });
    });
});
