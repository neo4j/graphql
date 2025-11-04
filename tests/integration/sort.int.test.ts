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
import { TestHelper } from "../utils/tests-helper";

const testLabel = generate({ charset: "alphabetic" });

describe("sort", () => {
    const testHelper = new TestHelper();
    const movieType = testHelper.createUniqueType("Movie");
    const seriesType = testHelper.createUniqueType("Series");
    const actorType = testHelper.createUniqueType("Actor");

    const typeDefs = gql`
        interface Production {
            id: ID!
            title: String!
        }
        type ${movieType} implements Production {
            id: ID!
            title: String!
            runtime: Int!
            actors: [${actorType}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            numberOfActors: Int! @cypher(statement: "MATCH (actor:${actorType})-[:ACTED_IN]->(this) RETURN count(actor) AS count", columnName: "count")
        }

        type ${seriesType} implements Production {
            id: ID!
            title: String!
            episodes: Int!
        }
        type ${actorType} {
            id: ID!
            name: String!
            movies: [${movieType}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            totalScreenTime: Int!
                @cypher(
                    statement: """
                    MATCH (this)-[r:ACTED_IN]->(:${movieType})
                    RETURN sum(r.screenTime) AS sum
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
    ] as const;

    beforeAll(async () => {
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (m1:${movieType}:${testLabel}) SET m1 = $movies[0]
                    CREATE (m2:${movieType}:${testLabel}) SET m2 = $movies[1]
                    CREATE (s1:${seriesType}:${testLabel}) SET s1 = $series[0]
                    CREATE (s2:${seriesType}:${testLabel}) SET s2 = $series[1]

                    CREATE (a1:${actorType}:${testLabel}) SET a1.id = $actors[0].id, a1.name = $actors[0].name
                    CREATE (a2:${actorType}:${testLabel}) SET a2.id = $actors[1].id, a2.name = $actors[1].name

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

    describe("on top level", () => {
        describe("primitive fields", () => {
            const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
                testHelper.executeGraphQL(source, {
                    variableValues: { movieIds: movies.map(({ id }) => id), direction },
                });

            describe("with field in selection set", () => {
                const queryWithTitle = `
                            query ($movieIds: [ID!]!, $direction: SortDirection!) {
                                ${movieType.plural}(
                                    where: { id_IN: $movieIds },
                                    options: { sort: [{ title: $direction }] }
                                ) {
                                    id
                                    title
                                }
                            }
                        `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithTitle);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                });
            });

            describe("with field aliased in selection set", () => {
                const queryWithTitle = `
                            query ($movieIds: [ID!]!, $direction: SortDirection!) {
                                ${movieType.plural}(
                                    where: { id_IN: $movieIds },
                                    options: { sort: [{ title: $direction }] }
                                ) {
                                    id
                                    aliased: title
                                }
                            }
                        `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithTitle);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutTitle = `
                        query ($movieIds: [ID!]!, $direction: SortDirection!) {
                            ${movieType.plural}(
                                where: { id_IN: $movieIds },
                                options: { sort: [{ title: $direction }] }
                            ) {
                                id
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithoutTitle);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                });
            });
        });

        describe("cypher fields", () => {
            const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
                testHelper.executeGraphQL(source, {
                    variableValues: { movieIds: movies.map(({ id }) => id), direction },
                });

            describe("with field in selection set", () => {
                const queryWithNumberOfActors = `
                            query ($movieIds: [ID!]!, $direction: SortDirection!) {
                                ${movieType.plural}(
                                    where: { id_IN: $movieIds },
                                    options: { sort: [{ numberOfActors: $direction }] }
                                ) {
                                    id
                                    numberOfActors
                                }
                            }
                        `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithNumberOfActors);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");
                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: Array<{ id: string; numberOfActors: number }> = (gqlResult.data as any)?.[
                        movieType.plural
                    ];

                    expect(gqlMovies[0]?.id).toBe(movies[0].id);
                    expect(gqlMovies[0]?.numberOfActors).toBe(1);
                    expect(gqlMovies[1]?.id).toBe(movies[1].id);
                    expect(gqlMovies[1]?.numberOfActors).toBe(2);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: Array<{ id: string; numberOfActors: number }> = (gqlResult.data as any)?.[
                        movieType.plural
                    ];

                    expect(gqlMovies[0]?.id).toBe(movies[1].id);
                    expect(gqlMovies[0]?.numberOfActors).toBe(2);
                    expect(gqlMovies[1]?.id).toBe(movies[0].id);
                    expect(gqlMovies[1]?.numberOfActors).toBe(1);
                });
            });

            describe("with field aliased in selection set", () => {
                const queryWithNumberOfActors = `
                            query ($movieIds: [ID!]!, $direction: SortDirection!) {
                                ${movieType.plural}(
                                    where: { id_IN: $movieIds },
                                    options: { sort: [{ numberOfActors: $direction }] }
                                ) {
                                    id
                                    aliased: numberOfActors
                                }
                            }
                        `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithNumberOfActors);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: Array<{ id: string; aliased: number }> = (gqlResult.data as any)?.[
                        movieType.plural
                    ];

                    expect(gqlMovies[0]?.id).toBe(movies[0].id);
                    expect(gqlMovies[0]?.aliased).toBe(1);
                    expect(gqlMovies[1]?.id).toBe(movies[1].id);
                    expect(gqlMovies[1]?.aliased).toBe(2);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: Array<{ id: string; aliased: number }> = (gqlResult.data as any)?.[
                        movieType.plural
                    ];

                    expect(gqlMovies[0]?.id).toBe(movies[1].id);
                    expect(gqlMovies[0]?.aliased).toBe(2);
                    expect(gqlMovies[1]?.id).toBe(movies[0].id);
                    expect(gqlMovies[1]?.aliased).toBe(1);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutNumberOfActors = `
                        query ($movieIds: [ID!]!, $direction: SortDirection!) {
                            ${movieType.plural}(
                                where: { id_IN: $movieIds },
                                options: { sort: [{ numberOfActors: $direction }] }
                            ) {
                                id
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithoutNumberOfActors);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    // Movie 1 has 1 actor
                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    // Movie 2 has 2 actors
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    // Movie 2 has 2 actors
                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    // Movie 1 has 1 actor
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                });
            });

            describe("with field not in selection set and multiple sort elements", () => {
                const queryWithoutNumberOfActors = `
                        query ($movieIds: [ID!]!, $direction: SortDirection!) {
                            ${movieType.plural}(
                                where: { id_IN: $movieIds },
                                options: { sort: [{ numberOfActors: $direction, id: $direction }] }
                            ) {
                                id
                            }
                        }
                    `;

                const gqlResultByType = gqlResultByTypeFromSource(queryWithoutNumberOfActors);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies).toHaveLength(2);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { [movieType.plural]: gqlMovies } = gqlResult.data as any;
                    expect(gqlMovies).toHaveLength(2);
                });
            });
        });
    });

    describe("on relationship", () => {
        const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
            testHelper.executeGraphQL(source, {
                variableValues: { movieId: movies[1].id, actorIds: actors.map(({ id }) => id), direction },
            });

        describe("primitive fields", () => {
            describe("with field in selection set", () => {
                const queryWithName = `
                                query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                                    ${movieType.plural}(where: { id: $movieId }) {
                                        id
                                        actors(where: { id_IN: $actorIds }, options: { sort: [{ name: $direction }] }) {
                                            id
                                            name
                                        }
                                    }
                                }
                            `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithName);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; name: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; name: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[0].id);
                });
            });

            describe("with field aliased in selection set", () => {
                const queryWithName = `
                                query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                                    ${movieType.plural}(where: { id: $movieId }) {
                                        id
                                        actors(where: { id_IN: $actorIds }, options: { sort: [{ name: $direction }] }) {
                                            id
                                            aliased: name
                                        }
                                    }
                                }
                            `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithName);

                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; name: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; name: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[0].id);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutName = `
                                query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                                    ${movieType.plural}(where: { id: $movieId }) {
                                        id
                                        actors(where: { id_IN: $actorIds }, options: { sort: [{ name: $direction }] }) {
                                            id
                                        }
                                    }
                                }
                            `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithoutName);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = (gqlResult.data as any)?.[
                        movieType.plural
                    ][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = (gqlResult.data as any)?.[
                        movieType.plural
                    ][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[0].id);
                });
            });
        });

        describe("cypher fields", () => {
            // Actor 1 has 3 totalScreenTime
            // Actor 2 has 1 totalScreenTime
            describe("with field in selection set", () => {
                const queryWithTotalScreenTime = `
                    query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                        ${movieType.plural}(where: { id: $movieId }) {
                            id
                            actors(where: { id_IN: $actorIds }, options: { sort: [{ totalScreenTime: $direction }] }) {
                                id
                                totalScreenTime
                            }
                        }
                    }
                `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithTotalScreenTime);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; totalScreenTime: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[1].id);
                    expect(gqlMovie.actors[0]?.totalScreenTime).toBe(1);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1]?.totalScreenTime).toBe(3);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; totalScreenTime: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[0].id);
                    expect(gqlMovie.actors[0]?.totalScreenTime).toBe(3);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1]?.totalScreenTime).toBe(1);
                });
            });

            describe("with field aliased in selection set", () => {
                const queryWithTotalScreenTime = `
                    query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                        ${movieType.plural}(where: { id: $movieId }) {
                            id
                            actors(where: { id_IN: $actorIds }, options: { sort: [{ totalScreenTime: $direction }] }) {
                                id
                                aliased: totalScreenTime
                            }
                        }
                    }
                `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithTotalScreenTime);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; aliased: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[1].id);
                    expect(gqlMovie.actors[0]?.aliased).toBe(1);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1]?.aliased).toBe(3);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; aliased: string }> } = (
                        gqlResult.data as any
                    )?.[movieType.plural][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0]?.id).toBe(actors[0].id);
                    expect(gqlMovie.actors[0]?.aliased).toBe(3);
                    expect(gqlMovie.actors[1]?.id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1]?.aliased).toBe(1);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutTotalScreenTime = `
                    query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                        ${movieType.plural}(where: { id: $movieId }) {
                            id
                            actors(where: { id_IN: $actorIds }, options: { sort: [{ totalScreenTime: $direction }] }) {
                                id
                            }
                        }
                    }
                `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithoutTotalScreenTime);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = (gqlResult.data as any)?.[
                        movieType.plural
                    ][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    // Actor 2 has 1 totalScreenTime
                    expect(gqlMovie.actors[0]?.id).toBe(actors[1].id);
                    // Actor 1 has 3 totalScreenTime
                    expect(gqlMovie.actors[1]?.id).toBe(actors[0].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = (gqlResult.data as any)?.[
                        movieType.plural
                    ][0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    // Actor 1 has 3 totalScreenTime
                    expect(gqlMovie.actors[0]?.id).toBe(actors[0].id);
                    // Actor 2 has 1 totalScreenTime
                    expect(gqlMovie.actors[1]?.id).toBe(actors[1].id);
                });
            });
        });

        it("sort with skip and limit on relationship", async () => {
            const query = `
                query {
                    ${movieType.plural} {
                        actors(options: { limit: 1, offset: 1, sort: { name: ASC } }) {
                            name
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[movieType.plural]).toEqual(
                expect.toIncludeSameMembers([{ actors: [] }, { actors: [{ name: actors[1].name }] }])
            );
        });
    });

    describe("on interface relationship", () => {
        describe("primitive fields", () => {
            const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
                testHelper.executeGraphQL(source, {
                    variableValues: { actorId: actors[0].id, direction },
                });
            describe("with field in selection set", () => {
                const queryWithSortField = `
                        query ($actorId: ID!, $direction: SortDirection!) {
                            ${actorType.plural}(where: { id: $actorId }) {
                                id
                                actedIn(options: { sort: [{ title: $direction }] }) {
                                    id
                                    title
                                }
                            }
                        }
                    `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[actorType.plural] as any[];
                    expect(gqlActor.id).toEqual(actors[0].id);

                    const { actedIn: production } = gqlActor;
                    expect(production).toHaveLength(4);
                    expect(production[0].id).toBe(movies[0].id);
                    expect(production[1].id).toBe(movies[1].id);
                    expect(production[2].id).toBe(series[0].id);
                    expect(production[3].id).toBe(series[1].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[actorType.plural] as any[];
                    expect(gqlActor.id).toEqual(actors[0].id);

                    const { actedIn: production } = gqlActor;
                    expect(gqlActor.actedIn).toHaveLength(4);
                    expect(production[0].id).toBe(series[1].id);
                    expect(production[1].id).toBe(series[0].id);
                    expect(production[2].id).toBe(movies[1].id);
                    expect(production[3].id).toBe(movies[0].id);
                });
            });

            describe("with field aliased in selection set", () => {
                const queryWithAliasedSortField = `
                    query ($actorId: ID!, $direction: SortDirection!) {
                        ${actorType.plural}(where: { id: $actorId }) {
                            id
                            actedIn(options: { sort: [{ title: $direction }] }) {
                                id
                                aliased: title
                            }
                        }
                    }
                `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithAliasedSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[actorType.plural] as any[];
                    expect(gqlActor.id).toEqual(actors[0].id);

                    const { actedIn: production } = gqlActor;
                    expect(production).toHaveLength(4);
                    expect(production[0].id).toBe(movies[0].id);
                    expect(production[1].id).toBe(movies[1].id);
                    expect(production[2].id).toBe(series[0].id);
                    expect(production[3].id).toBe(series[1].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[actorType.plural] as any[];
                    expect(gqlActor.id).toEqual(actors[0].id);

                    const { actedIn: production } = gqlActor;
                    expect(gqlActor.actedIn).toHaveLength(4);
                    expect(production[0].id).toBe(series[1].id);
                    expect(production[1].id).toBe(series[0].id);
                    expect(production[2].id).toBe(movies[1].id);
                    expect(production[3].id).toBe(movies[0].id);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithOutSortField = `
                    query ($actorId: ID!, $direction: SortDirection!) {
                        ${actorType.plural}(where: { id: $actorId }) {
                            id
                            actedIn(options: { sort: [{ title: $direction }] }) {
                                id
                            }
                        }
                    }
                `;
                const gqlResultByType = gqlResultByTypeFromSource(queryWithOutSortField);
                test("ASC", async () => {
                    const gqlResult = await gqlResultByType("ASC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[actorType.plural] as any[];
                    expect(gqlActor.id).toEqual(actors[0].id);

                    const { actedIn: production } = gqlActor;
                    expect(production).toHaveLength(4);
                    expect(production[0].id).toBe(movies[0].id);
                    expect(production[1].id).toBe(movies[1].id);
                    expect(production[2].id).toBe(series[0].id);
                    expect(production[3].id).toBe(series[1].id);
                });

                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const [gqlActor] = gqlResult.data?.[actorType.plural] as any[];
                    expect(gqlActor.id).toEqual(actors[0].id);

                    const { actedIn: production } = gqlActor;
                    expect(gqlActor.actedIn).toHaveLength(4);
                    expect(production[0].id).toBe(series[1].id);
                    expect(production[1].id).toBe(series[0].id);
                    expect(production[2].id).toBe(movies[1].id);
                    expect(production[3].id).toBe(movies[0].id);
                });
            });
        });
    });
});
