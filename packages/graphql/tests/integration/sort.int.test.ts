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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("sort", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("primitive fields", () => {
        test("should sort a list of nodes", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            number: Int
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieIds = [
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                    ].map((x) => `"${x}"`);

                    const query = `
                        query {
                            movies(
                                where: { id_IN: [${movieIds.join(",")}] },
                                options: { sort: [{ number: ${type} }] }
                            ) {
                               number
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (:Movie {id: ${movieIds[0]}, number: 1})
                            CREATE (:Movie {id: ${movieIds[1]}, number: 2})
                            CREATE (:Movie {id: ${movieIds[2]}, number: 3})
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { movies } = gqlResult.data as any;

                        /* eslint-disable jest/no-conditional-expect */
                        if (type === "ASC") {
                            expect(movies[0].number).toEqual(1);
                            expect(movies[1].number).toEqual(2);
                            expect(movies[2].number).toEqual(3);
                        }

                        if (type === "DESC") {
                            expect(movies[0].number).toEqual(3);
                            expect(movies[1].number).toEqual(2);
                            expect(movies[2].number).toEqual(1);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should sort nested relationships", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                        }

                        type Genre {
                            id: ID
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const query = `
                        query {
                            movies(where: { id: "${movieId}" }) {
                                genres(options: { sort: [{ id: ${type} }] }) {
                                    id
                                }
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (m:Movie {id: "${movieId}"})
                            CREATE (g1:Genre {id: "1"})
                            CREATE (g2:Genre {id: "2"})
                            MERGE (m)-[:HAS_GENRE]->(g1)
                            MERGE (m)-[:HAS_GENRE]->(g2)
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { genres } = (gqlResult.data as any).movies[0];

                        /* eslint-disable jest/no-conditional-expect */
                        if (type === "ASC") {
                            expect(genres[0].id).toEqual("1");
                            expect(genres[1].id).toEqual("2");
                        }

                        if (type === "DESC") {
                            expect(genres[0].id).toEqual("2");
                            expect(genres[1].id).toEqual("1");
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });
    });

    describe("cypher fields", () => {
        let session: Session;

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Actor {
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

        const { schema } = new Neo4jGraphQL({ typeDefs });

        const title1 = generate({
            charset: "alphabetic",
        });
        const title2 = generate({
            charset: "alphabetic",
        });
        const name1 = generate({
            charset: "alphabetic",
        });
        const name2 = generate({
            charset: "alphabetic",
        });

        beforeAll(async () => {
            session = driver.session();
            await session.run(
                `
                        CREATE (m1:Movie {title: $title1})
                        CREATE (m2:Movie {title: $title2})
                        CREATE (a1:Actor {name: $name1})
                        CREATE (a2:Actor {name: $name2})
                        MERGE (a1)-[:ACTED_IN {screenTime: 1}]->(m1)<-[:ACTED_IN {screenTime: 1}]-(a2)
                        MERGE (a1)-[:ACTED_IN {screenTime: 1}]->(m2)
                    `,
                {
                    title1,
                    title2,
                    name1,
                    name2,
                }
            );
        });

        afterAll(async () => {
            await session.close();
        });

        test("should sort DESC on top level", async () => {
            const query = gql`
                query($actorNames: [String!]!, $direction: SortDirection!) {
                    actors(where: { name_IN: $actorNames }, options: { sort: [{ totalScreenTime: $direction }] }) {
                        name
                        totalScreenTime
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { actorNames: [name1, name2], direction: "DESC" },
            });

            expect(graphqlResult.errors).toBeUndefined();

            const graphqlActors = graphqlResult.data?.actors;

            expect(graphqlActors).toHaveLength(2);

            expect(graphqlActors[0].name).toEqual(name1);
            expect(graphqlActors[0].totalScreenTime).toEqual(2);
            expect(graphqlActors[1].name).toEqual(name2);
            expect(graphqlActors[1].totalScreenTime).toEqual(1);
        });

        test("should sort ASC on top level", async () => {
            const query = gql`
                query($actorNames: [String!]!, $direction: SortDirection!) {
                    actors(where: { name_IN: $actorNames }, options: { sort: [{ totalScreenTime: $direction }] }) {
                        name
                        totalScreenTime
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { actorNames: [name1, name2], direction: "ASC" },
            });

            expect(graphqlResult.errors).toBeUndefined();

            const graphqlActors = graphqlResult.data?.actors;

            expect(graphqlActors).toHaveLength(2);

            expect(graphqlActors[0].name).toEqual(name2);
            expect(graphqlActors[0].totalScreenTime).toEqual(1);
            expect(graphqlActors[1].name).toEqual(name1);
            expect(graphqlActors[1].totalScreenTime).toEqual(2);
        });

        test("should sort ASC on nested level", async () => {
            const query = gql`
                query($title: String!, $actorNames: [String!]!, $direction: SortDirection!) {
                    movies(where: { title: $title }) {
                        title
                        actors(where: { name_IN: $actorNames }, options: { sort: [{ totalScreenTime: $direction }] }) {
                            name
                            totalScreenTime
                        }
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { title: title1, actorNames: [name1, name2], direction: "ASC" },
            });

            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovies = graphqlResult.data?.movies;

            expect(graphqlMovies).toHaveLength(1);
            expect(graphqlMovies[0].title).toBe(title1);

            const graphqlActors = graphqlResult.data?.movies[0].actors;

            expect(graphqlActors).toHaveLength(2);

            expect(graphqlActors[0].name).toEqual(name2);
            expect(graphqlActors[0].totalScreenTime).toEqual(1);
            expect(graphqlActors[1].name).toEqual(name1);
            expect(graphqlActors[1].totalScreenTime).toEqual(2);
        });

        test("should sort DESC on nested level", async () => {
            const query = gql`
                query($title: String!, $actorNames: [String!]!, $direction: SortDirection!) {
                    movies(where: { title: $title }) {
                        title
                        actors(where: { name_IN: $actorNames }, options: { sort: [{ totalScreenTime: $direction }] }) {
                            name
                            totalScreenTime
                        }
                    }
                }
            `;

            const graphqlResult = await graphql({
                schema,
                source: query.loc!.source,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { title: title1, actorNames: [name1, name2], direction: "DESC" },
            });

            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovies = graphqlResult.data?.movies;

            expect(graphqlMovies).toHaveLength(1);
            expect(graphqlMovies[0].title).toBe(title1);

            const graphqlActors = graphqlResult.data?.movies[0].actors;

            expect(graphqlActors).toHaveLength(2);

            expect(graphqlActors[0].name).toEqual(name1);
            expect(graphqlActors[0].totalScreenTime).toEqual(2);
            expect(graphqlActors[1].name).toEqual(name2);
            expect(graphqlActors[1].totalScreenTime).toEqual(1);
        });
    });

    describe("interface relationship", () => {
        const typeDefs = gql`
            interface Production {
                title: String!
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        const { schema } = new Neo4jGraphQL({
            typeDefs,
        });

        const movie1 = {
            title: "A",
            runtime: 400,
        };

        const movie2 = {
            title: "B",
            runtime: 300,
        };

        const series1 = {
            title: "C",
            episodes: 200,
        };

        const series2 = {
            title: "D",
            episodes: 100,
        };

        const actor = {
            name: generate({ charset: "alphabetic" }),
        };

        const testLabel = generate({ charset: "alphabetic", readable: false });

        beforeAll(async () => {
            const session = driver.session();
            await session.run(
                `
                        CREATE (actor:Actor:${testLabel})
                        SET actor = $actor
                        CREATE (movie1:Movie:${testLabel})<-[:ACTED_IN {screenTime: 30}]-(actor)
                        SET movie1 = $movie1
                        CREATE (movie2:Movie:${testLabel})<-[:ACTED_IN {screenTime: 40}]-(actor)
                        SET movie2 = $movie2
                        CREATE (series1:Series:${testLabel})<-[:ACTED_IN {screenTime: 50}]-(actor)
                        SET series1 = $series1
                        CREATE (series2:Series:${testLabel})<-[:ACTED_IN {screenTime: 60}]-(actor)
                        SET series2 = $series2
                    `,
                {
                    actor,
                    movie1,
                    movie2,
                    series1,
                    series2,
                }
            );
            await session.close();
        });

        afterAll(async () => {
            const session = driver.session();
            await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
            await session.close();
        });

        describe("field", () => {
            test("should sort ASC", async () => {
                const query = gql`
                    query($actorName: String!) {
                        actors(where: { name: $actorName }) {
                            name
                            actedIn(options: { sort: [{ title: ASC }] }) {
                                title
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: query.loc!.source,
                    contextValue: { driver },
                    variableValues: { actorName: actor.name },
                });

                expect(graphqlResult.errors).toBeUndefined();

                const [graphqlActor] = graphqlResult.data?.actors;

                expect(graphqlActor.name).toEqual(actor.name);
                expect(graphqlActor.actedIn).toHaveLength(4);
                expect(graphqlActor.actedIn[0].title).toBe(movie1.title);
                expect(graphqlActor.actedIn[1].title).toBe(movie2.title);
                expect(graphqlActor.actedIn[2].title).toBe(series1.title);
                expect(graphqlActor.actedIn[3].title).toBe(series2.title);
            });

            test("should sort DESC", async () => {
                const query = gql`
                    query($actorName: String!) {
                        actors(where: { name: $actorName }) {
                            name
                            actedIn(options: { sort: [{ title: DESC }] }) {
                                title
                            }
                        }
                    }
                `;

                const graphqlResult = await graphql({
                    schema,
                    source: query.loc!.source,
                    contextValue: { driver },
                    variableValues: { actorName: actor.name },
                });

                expect(graphqlResult.errors).toBeUndefined();

                const [graphqlActor] = graphqlResult.data?.actors;
                expect(graphqlActor.name).toEqual(actor.name);

                const { actedIn: production } = graphqlActor;
                expect(graphqlActor.actedIn).toHaveLength(4);
                expect(production[0].title).toBe(series2.title);
                expect(production[1].title).toBe(series1.title);
                expect(production[2].title).toBe(movie2.title);
                expect(production[3].title).toBe(movie1.title);
            });
        });

        describe("connection", () => {
            describe("field in selection set", () => {
                const query = gql`
                    query($actorName: String!, $titleSort: SortDirection!) {
                        actors(where: { name: $actorName }) {
                            name
                            actedInConnection(sort: [{ node: { title: $titleSort } }]) {
                                edges {
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                `;

                test("should sort ASC", async () => {
                    const graphqlResult = await graphql({
                        schema,
                        source: query.loc!.source,
                        contextValue: { driver },
                        variableValues: { actorName: actor.name, titleSort: "ASC" },
                    });

                    expect(graphqlResult.errors).toBeUndefined();

                    const [graphqlActor] = graphqlResult.data?.actors;

                    expect(graphqlActor.name).toEqual(actor.name);
                    expect(graphqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(graphqlActor.actedInConnection.edges[0].node.title).toBe(movie1.title);
                    expect(graphqlActor.actedInConnection.edges[1].node.title).toBe(movie2.title);
                    expect(graphqlActor.actedInConnection.edges[2].node.title).toBe(series1.title);
                    expect(graphqlActor.actedInConnection.edges[3].node.title).toBe(series2.title);
                });

                test("should sort DESC", async () => {
                    const graphqlResult = await graphql({
                        schema,
                        source: query.loc!.source,
                        contextValue: { driver },
                        variableValues: { actorName: actor.name, titleSort: "DESC" },
                    });

                    expect(graphqlResult.errors).toBeUndefined();

                    const [graphqlActor] = graphqlResult.data?.actors;

                    expect(graphqlActor.name).toEqual(actor.name);
                    expect(graphqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(graphqlActor.actedInConnection.edges[0].node.title).toBe(series2.title);
                    expect(graphqlActor.actedInConnection.edges[1].node.title).toBe(series1.title);
                    expect(graphqlActor.actedInConnection.edges[2].node.title).toBe(movie2.title);
                    expect(graphqlActor.actedInConnection.edges[3].node.title).toBe(movie1.title);
                });
            });

            describe("field not in selection set", () => {
                const query = gql`
                    query($actorName: String!, $titleSort: SortDirection!) {
                        actors(where: { name: $actorName }) {
                            name
                            actedInConnection(sort: [{ node: { title: $titleSort } }]) {
                                edges {
                                    node {
                                        ... on Movie {
                                            runtime
                                        }
                                        ... on Series {
                                            episodes
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                test("should sort ASC", async () => {
                    const graphqlResult = await graphql({
                        schema,
                        source: query.loc!.source,
                        contextValue: { driver },
                        variableValues: { actorName: actor.name, titleSort: "ASC" },
                    });

                    expect(graphqlResult.errors).toBeUndefined();

                    const [graphqlActor] = graphqlResult.data?.actors;

                    expect(graphqlActor.name).toEqual(actor.name);
                    expect(graphqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(graphqlActor.actedInConnection.edges[0].node.runtime).toBe(movie1.runtime);
                    expect(graphqlActor.actedInConnection.edges[1].node.runtime).toBe(movie2.runtime);
                    expect(graphqlActor.actedInConnection.edges[2].node.episodes).toBe(series1.episodes);
                    expect(graphqlActor.actedInConnection.edges[3].node.episodes).toBe(series2.episodes);
                });

                test("should sort DESC", async () => {
                    const graphqlResult = await graphql({
                        schema,
                        source: query.loc!.source,
                        contextValue: { driver },
                        variableValues: { actorName: actor.name, titleSort: "DESC" },
                    });

                    expect(graphqlResult.errors).toBeUndefined();

                    const [graphqlActor] = graphqlResult.data?.actors;

                    expect(graphqlActor.name).toEqual(actor.name);
                    expect(graphqlActor.actedInConnection.edges).toHaveLength(4);
                    expect(graphqlActor.actedInConnection.edges[0].node.episodes).toBe(series2.episodes);
                    expect(graphqlActor.actedInConnection.edges[1].node.episodes).toBe(series1.episodes);
                    expect(graphqlActor.actedInConnection.edges[2].node.runtime).toBe(movie2.runtime);
                    expect(graphqlActor.actedInConnection.edges[3].node.runtime).toBe(movie1.runtime);
                });
            });
        });
    });
});
