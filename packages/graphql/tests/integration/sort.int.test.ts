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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

const testLabel = generate({ charset: "alphabetic" });

describe("sort", () => {
    let driver: Driver;

    const typeDefs = gql`
        type Movie {
            id: ID!
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            numberOfActors: Int! @cypher(statement: "MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor)")
        }
        type Actor {
            id: ID!
            name: String!
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            totalScreenTime: Int!
                @cypher(
                    statement: """
                    MATCH (this)-[r:ACTED_IN]->(:Movie)
                    RETURN sum(r.screenTime)
                    """
                )
        }
        interface ActedIn {
            screenTime: Int!
        }
    `;

    const movies = [
        {
            id: generate({ charset: "alphabetic" }),
            title: "A",
        },
        {
            id: generate({ charset: "alphabetic" }),
            title: "B",
        },
    ];

    const actors = [
        {
            id: generate({ charset: "alphabetic" }),
            name: "A",
        },
        {
            id: generate({ charset: "alphabetic" }),
            name: "B",
        },
    ];

    const { schema } = new Neo4jGraphQL({ typeDefs });

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        await session.run(
            `
                    CREATE (m1:Movie:${testLabel}) SET m1 = $movies[0]
                    CREATE (m2:Movie:${testLabel}) SET m2 = $movies[1]
                    CREATE (a1:Actor:${testLabel}) SET a1 = $actors[0]
                    CREATE (a2:Actor:${testLabel}) SET a2 = $actors[1]
                    MERGE (a1)-[:ACTED_IN {screenTime: 1}]->(m1)
                    MERGE (a1)-[:ACTED_IN {screenTime: 2}]->(m2)<-[:ACTED_IN {screenTime: 1}]-(a2)
                `,
            { movies, actors }
        );
    });

    afterAll(async () => {
        const session = driver.session();
        await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
        await session.close();
        await driver.close();
    });

    describe("on top level", () => {
        describe("primitive fields", () => {
            const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
                graphql({
                    schema,
                    source,
                    contextValue: { driver },
                    variableValues: { movieIds: movies.map(({ id }) => id), direction },
                });

            describe("with field in selection set", () => {
                const queryWithTitle = `
                        query ($movieIds: [ID!]!, $direction: SortDirection!) {
                            movies(
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

                    const { movies: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { movies: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutTitle = `
                        query ($movieIds: [ID!]!, $direction: SortDirection!) {
                            movies(
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

                    const { movies: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { movies: gqlMovies } = gqlResult.data as any;

                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                });
            });
        });

        describe("cypher fields", () => {
            const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
                graphql({
                    schema,
                    source,
                    contextValue: { driver },
                    variableValues: { movieIds: movies.map(({ id }) => id), direction },
                });

            describe("with field in selection set", () => {
                const queryWithNumberOfActors = `
                        query ($movieIds: [ID!]!, $direction: SortDirection!) {
                            movies(
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

                    const gqlMovies: Array<{ id: string; numberOfActors: number }> = gqlResult.data?.movies;

                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    expect(gqlMovies[0].numberOfActors).toBe(1);
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                    expect(gqlMovies[1].numberOfActors).toBe(2);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovies: Array<{ id: string; numberOfActors: number }> = gqlResult.data?.movies;

                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    expect(gqlMovies[0].numberOfActors).toBe(2);
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                    expect(gqlMovies[1].numberOfActors).toBe(1);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutNumberOfActors = `
                        query ($movieIds: [ID!]!, $direction: SortDirection!) {
                            movies(
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

                    const { movies: gqlMovies } = gqlResult.data as any;

                    // Movie 1 has 1 actor
                    expect(gqlMovies[0].id).toBe(movies[0].id);
                    // Movie 2 has 2 actors
                    expect(gqlMovies[1].id).toBe(movies[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const { movies: gqlMovies } = gqlResult.data as any;

                    // Movie 2 has 2 actors
                    expect(gqlMovies[0].id).toBe(movies[1].id);
                    // Movie 1 has 1 actor
                    expect(gqlMovies[1].id).toBe(movies[0].id);
                });
            });
        });
    });

    describe("on nested relationship", () => {
        const gqlResultByTypeFromSource = (source: string) => (direction: "ASC" | "DESC") =>
            graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { movieId: movies[1].id, actorIds: actors.map(({ id }) => id), direction },
            });

        describe("primitive fields", () => {
            describe("with field in selection set", () => {
                const queryWithName = `
                                query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                                    movies(where: { id: $movieId }) {
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

                    const gqlMovie: { id: string; actors: Array<{ id: string; name: string }> } =
                        gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0].id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1].id).toBe(actors[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; name: string }> } =
                        gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0].id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1].id).toBe(actors[0].id);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutName = `
                                query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                                    movies(where: { id: $movieId }) {
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

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0].id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1].id).toBe(actors[1].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0].id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1].id).toBe(actors[0].id);
                });
            });
        });

        describe("cypher fields", () => {
            // Actor 1 has 3 totalScreenTime
            // Actor 2 has 1 totalScreenTime
            describe("with field in selection set", () => {
                const queryWithTotalScreenTime = `
                    query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                        movies(where: { id: $movieId }) {
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

                    const gqlMovie: { id: string; actors: Array<{ id: string; totalScreenTime: string }> } =
                        gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0].id).toBe(actors[1].id);
                    expect(gqlMovie.actors[0].totalScreenTime).toBe(1);
                    expect(gqlMovie.actors[1].id).toBe(actors[0].id);
                    expect(gqlMovie.actors[1].totalScreenTime).toBe(3);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string; totalScreenTime: string }> } =
                        gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    expect(gqlMovie.actors[0].id).toBe(actors[0].id);
                    expect(gqlMovie.actors[0].totalScreenTime).toBe(3);
                    expect(gqlMovie.actors[1].id).toBe(actors[1].id);
                    expect(gqlMovie.actors[1].totalScreenTime).toBe(1);
                });
            });

            describe("with field not in selection set", () => {
                const queryWithoutTotalScreenTime = `
                    query($movieId: ID!, $actorIds: [ID!]!, $direction: SortDirection!) {
                        movies(where: { id: $movieId }) {
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

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    // Actor 2 has 1 totalScreenTime
                    expect(gqlMovie.actors[0].id).toBe(actors[1].id);
                    // Actor 1 has 3 totalScreenTime
                    expect(gqlMovie.actors[1].id).toBe(actors[0].id);
                });
                test("DESC", async () => {
                    const gqlResult = await gqlResultByType("DESC");

                    expect(gqlResult.errors).toBeUndefined();

                    const gqlMovie: { id: string; actors: Array<{ id: string }> } = gqlResult.data?.movies[0];
                    expect(gqlMovie).toBeDefined();

                    expect(gqlMovie.id).toBe(movies[1].id);
                    // Actor 1 has 3 totalScreenTime
                    expect(gqlMovie.actors[0].id).toBe(actors[0].id);
                    // Actor 2 has 1 totalScreenTime
                    expect(gqlMovie.actors[1].id).toBe(actors[1].id);
                });
            });
        });
    });
});
