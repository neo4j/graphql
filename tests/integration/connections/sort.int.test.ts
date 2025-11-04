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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

const testLabel = generate({ charset: "alphabetic" });

describe("connections sort", () => {
    const testHelper = new TestHelper();

    const Movie = testHelper.createUniqueType("Movie");
    const Series = testHelper.createUniqueType("Series");
    const Actor = testHelper.createUniqueType("Actor");

    const typeDefs = gql`
        interface Production {
            id: ID!
            title: String!
        }
        type ${Movie} implements Production {
            id: ID!
            title: String!
            runtime: Int!
            actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            numberOfActors: Int! @cypher(statement: "MATCH (actor:${Actor})-[:ACTED_IN]->(this) RETURN count(actor) as count", columnName: "count")
        }

        type ${Series} implements Production {
            id: ID!
            title: String!
            episodes: Int!
        }
        type ${Actor} {
            id: ID!
            name: String!
            movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            totalScreenTime: Int!
                @cypher(
                    statement: """
                    MATCH (this)-[r:ACTED_IN]->(:${Movie})
                    RETURN sum(r.screenTime) as sum
                    """,
                    columnName: "sum"
                )
        }
        type ActedIn @relationshipProperties {
            screenTime: Int!
        }
    `;

    const movies = [
        {
            id: generate({ charset: "alphabetic" }),
            title: "A",
            runtime: 400,
        },
        {
            id: generate({ charset: "alphabetic" }),
            title: "B",
            runtime: 300,
        },
        {
            id: generate({ charset: "alphabetic" }),
            title: "E",
            runtime: 300,
        },
    ] as const;

    const series = [
        {
            id: generate({ charset: "alphabetic" }),
            title: "C",
            episodes: 200,
        },
        {
            id: generate({ charset: "alphabetic" }),
            title: "D",
            episodes: 100,
        },
    ] as const;

    const actors = [
        {
            id: generate({ charset: "alphabetic" }),
            name: `A${generate({ charset: "alphbetic" })}`,
            screenTime: {
                [movies[0].id]: 2,
                [movies[1].id]: 1,
                [series[0].id]: 6,
                [series[1].id]: 4,
            },
        },
        {
            id: generate({ charset: "alphabetic" }),
            name: `B${generate({ charset: "alphbetic" })}`,
            screenTime: {
                [movies[1].id]: 1,
            },
        },
    ];

    beforeAll(async () => {
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (m1:${Movie}:${testLabel}) SET m1 = $movies[0]
                    CREATE (m2:${Movie}:${testLabel}) SET m2 = $movies[1]
                    CREATE (m3:${Movie}:${testLabel}) SET m3 = $movies[2]
                    CREATE (s1:${Series}:${testLabel}) SET s1 = $series[0]
                    CREATE (s2:${Series}:${testLabel}) SET s2 = $series[1]

                    CREATE (a1:${Actor}:${testLabel}) SET a1.id = $actors[0].id, a1.name = $actors[0].name
                    CREATE (a2:${Actor}:${testLabel}) SET a2.id = $actors[1].id, a2.name = $actors[1].name

                    MERGE (a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[m1.id]}]->(m1)
                    MERGE (a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[m2.id]}]->(m2)<-[:ACTED_IN {screenTime: $actors[1].screenTime[m2.id]}]-(a2)
                    MERGE (s1)<-[:ACTED_IN {screenTime: $actors[0].screenTime[s1.id]}]-(a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[s2.id]}]->(s2)
                `,
            { movies, series, actors }
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    it("top level connection with skip and limit", async () => {
        const query = `
           query {
            ${Movie.operations.connection}(first: 1, sort: {title: DESC}) {
                totalCount
                edges {
                    node {
                        title
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
           }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [Movie.operations.connection]: {
                totalCount: 3,
                edges: [
                    {
                        node: {
                            title: "E",
                        },
                    },
                ],
                pageInfo: {
                    hasNextPage: true,
                    endCursor: expect.toBeString(),
                },
            },
        });
        const cursor = (result.data as any)[Movie.operations.connection].pageInfo.endCursor;
        const secondQuery = `
        query {
         ${Movie.operations.connection}(first: 1, sort: {title: DESC}, after: "${cursor}") {
             totalCount
             edges {
                 node {
                     title
                 }
             }
             pageInfo {
                 hasNextPage
                 endCursor
             }
         }
        }
     `;

        const secondResult = await testHelper.executeGraphQL(secondQuery);
        expect(secondResult.errors).toBeUndefined();
        expect(secondResult.data as any).toEqual({
            [Movie.operations.connection]: {
                totalCount: 3,
                edges: [
                    {
                        node: {
                            title: "B",
                        },
                    },
                ],
                pageInfo: {
                    hasNextPage: true,
                    endCursor: expect.toBeString(),
                },
            },
        });
    });

    it("top level connection sort with cypher field and multiple sort fields", async () => {
        const query = `
        query {
         ${Movie.operations.connection}(first: 2, sort: {title: DESC, numberOfActors: ASC}) {
             totalCount
             edges {
                 node {
                     title
                     actorsConnection {
                        edges {
                            node {
                                name
                                totalScreenTime
                            }
                        }
                     }
                    }
             }
             pageInfo {
                 hasNextPage
                 endCursor
             }
         }
        }
     `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [Movie.operations.connection]: {
                totalCount: 3,
                edges: expect.toBeArrayOfSize(2),
                pageInfo: {
                    hasNextPage: true,
                    endCursor: expect.toBeString(),
                },
            },
        });
    });

    it("top level connection sort with nested cypher field", async () => {
        const query = `
        query {
         ${Movie.operations.connection}(first: 2, sort: {title: DESC}) {
             totalCount
             edges {
                 node {
                     title
                     numberOfActors
                 }
             }
             pageInfo {
                 hasNextPage
                 endCursor
             }
         }
        }
     `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [Movie.operations.connection]: {
                totalCount: 3,
                edges: [
                    {
                        node: {
                            title: "E",
                            numberOfActors: 0,
                        },
                    },
                    {
                        node: {
                            title: "B",
                            numberOfActors: 2,
                        },
                    },
                ],
                pageInfo: {
                    hasNextPage: true,
                    endCursor: expect.toBeString(),
                },
            },
        });
    });

    describe("on interface connection", () => {
        const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
            testHelper.executeGraphQL(source, {
                variableValues: { actorId: actors[0]?.id, direction },
            });
        describe("node", () => {
            describe("field in selection set", () => {
                const queryWithSortField = `
                        query ($actorId: ID!, $direction: SortDirection!) {
                            ${Actor.plural}(where: { id: $actorId }) {
                                id
                                actedInConnection(sort: [{ node: { title: $direction } }]) {
                                    edges {
                                        node {
                                            id
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(series[1].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(movies[0].id);
                });
            });

            describe("field aliased in selection set", () => {
                const queryWithAliasedSortField = `
                        query ($actorId: ID!, $direction: SortDirection!) {
                            ${Actor.plural}(where: { id: $actorId }) {
                                id
                                actedInConnection(sort: [{ node: { title: $direction } }]) {
                                    edges {
                                        node {
                                            id
                                            aliased: title
                                        }
                                    }
                                }
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithAliasedSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(series[1].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(movies[0].id);
                });
            });

            describe("field not in selection set", () => {
                const queryWithoutSortField = `
                        query ($actorId: ID!, $direction: SortDirection!) {
                            ${Actor.plural}(where: { id: $actorId }) {
                                id
                                actedInConnection(sort: [{ node: { title: $direction } }]) {
                                    edges {
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithoutSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(series[1].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(movies[0].id);
                });
            });
        });
        describe("edge", () => {
            describe("field in selection set", () => {
                const queryWithSortField = `
                        query ($actorId: ID!, $direction: SortDirection!) {
                            ${Actor.plural}(where: { id: $actorId }) {
                                id
                                actedInConnection(sort: [{ edge: { screenTime: $direction } }]) {
                                    edges {
                                        properties {
                                            screenTime
                                        }
                                        node {
                                            id
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(series[0].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(movies[1].id);
                });
            });

            describe("field aliased in selection set", () => {
                const queryWithAliasedSortField = `
                        query ($actorId: ID!, $direction: SortDirection!) {
                            ${Actor.plural}(where: { id: $actorId }) {
                                id
                                actedInConnection(sort: [{ edge: { screenTime: $direction } }]) {
                                    edges {
                                        properties {
                                            aliased: screenTime
                                        }
                                        node {
                                            id
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithAliasedSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(series[0].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(movies[1].id);
                });
            });

            describe("field not in selection set", () => {
                const queryWithoutSortField = `
                        query ($actorId: ID!, $direction: SortDirection!) {
                            ${Actor.plural}(where: { id: $actorId }) {
                                id
                                actedInConnection(sort: [{ edge: { screenTime: $direction } }]) {
                                    edges {
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithoutSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(movies[1].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(series[0].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[Actor.plural] as any[];

                    expect(gqlActor.id).toEqual(actors[0]?.id);
                    expect(gqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(gqlActor.actedInConnection.edges[0].node.id).toBe(series[0].id);
                    expect(gqlActor.actedInConnection.edges[1].node.id).toBe(series[1].id);
                    expect(gqlActor.actedInConnection.edges[2].node.id).toBe(movies[0].id);
                    expect(gqlActor.actedInConnection.edges[3].node.id).toBe(movies[1].id);
                });
            });
        });
    });
});
