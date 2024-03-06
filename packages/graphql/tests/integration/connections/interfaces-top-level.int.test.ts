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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("Interfaces top level connections", () => {
    const Movie = new UniqueType("Movie");
    const Series = new UniqueType("Series");
    const Actor = new UniqueType("Actor");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4jHelper;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const typeDefs = /* GraphQL */ `
            interface Show {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            type ${Movie} implements Show {
                title: String!
                cost: Float
                runtime: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Show {
                title: String!
                episodes: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();

        await neo4j.run(`
            CREATE (m1:${Movie} {title: "The Matrix", cost: 24})
            CREATE (:${Movie} {title: "The Godfather", cost: 20})
            CREATE (:${Series} {title: "The Matrix Series", episodes: 4})
            CREATE (s1:${Series} {title: "Avatar", episodes: 9})

            CREATE(a:${Actor} {name: "Arthur Dent"})
            CREATE(a)-[:ACTED_IN {screenTime: 10}]->(m1)
            CREATE(a)-[:ACTED_IN {screenTime: 20}]->(s1)
        `);
    });

    afterEach(async () => {
        await cleanNodes(driver, [Series, Movie, Actor]);
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Top level connection page info", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection {
                    pageInfo {
                        endCursor
                        hasNextPage
                        hasPreviousPage
                        startCursor
                    }
                    totalCount
                }
            }
        `;
        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            showsConnection: {
                pageInfo: {
                    endCursor: expect.toBeString(),
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: expect.toBeString(),
                },
                totalCount: 4,
            },
        });
    });

    test("Top level connection with filter", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection(where: { title_CONTAINS: "The Matrix" }) {
                    edges {
                        node {
                            title
                            ... on ${Movie} {
                                cost
                            }
                        }
                    }
                }
            }
        `;
        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            showsConnection: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "The Matrix Series",
                        },
                    },
                    {
                        node: {
                            title: "The Matrix",
                            cost: 24,
                        },
                    },
                ]),
            },
        });
    });

    test("Top level connection with limit", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection(where: { title_CONTAINS: "The Matrix" }, first: 1) {
                    edges {
                        node {
                            title
                            ... on ${Movie} {
                                cost
                            }
                        }
                    }
                }
            }
        `;
        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            showsConnection: {
                edges: expect.toBeArrayOfSize(1),
            },
        });
    });

    test("Top level connection with sort and limit DESC", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection(where: { title_CONTAINS: "The" }, first: 2, sort: { title: DESC }) {
                    edges {
                        node {
                            title
                            ... on ${Movie} {
                                cost
                            }
                        }
                    }
                }
            }
        `;
        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            showsConnection: {
                edges: [
                    {
                        node: {
                            title: "The Matrix Series",
                        },
                    },
                    {
                        node: { title: "The Matrix", cost: 24 },
                    },
                ],
            },
        });
    });

    test("Top level connection with nested connection", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection {
                    edges {
                        node {
                            title
                            actorsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                    properties {
                                        ... on ActedIn {
                                            screenTime
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const queryResults = await graphqlQuery(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            showsConnection: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "The Matrix Series",
                            actorsConnection: {
                                edges: [],
                            },
                        },
                    },
                    {
                        node: {
                            title: "The Matrix",
                            actorsConnection: {
                                edges: [{ node: { name: "Arthur Dent" }, properties: { screenTime: 10 } }],
                            },
                        },
                    },
                    {
                        node: {
                            title: "Avatar",
                            actorsConnection: {
                                edges: [{ node: { name: "Arthur Dent" }, properties: { screenTime: 20 } }],
                            },
                        },
                    },
                    {
                        node: {
                            title: "The Godfather",
                            actorsConnection: {
                                edges: [],
                            },
                        },
                    },
                ]),
            },
        });
    });
});
