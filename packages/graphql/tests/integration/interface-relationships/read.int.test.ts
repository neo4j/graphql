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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { faker } from "@faker-js/faker";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import type { UniqueType } from "../../utils/graphql-types";
import { generateUniqueType } from "../../utils/graphql-types";

describe("interface relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let typeMovie: UniqueType;
    let typeSeries: UniqueType;
    let typeActor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        typeMovie = generateUniqueType("Movie");
        typeSeries = generateUniqueType("Series");
        typeActor = generateUniqueType("Actor");
        session = await neo4j.getSession();

        const typeDefs = gql`
            interface Production {
                title: String!
            }

            type ${typeMovie} implements Production {
                title: String!
                runtime: Int!
            }

            type ${typeSeries} implements Production {
                title: String!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type ${typeActor} {
                name: String!
                currentlyActingIn: Production @relationship(type: "CURRENTLY_ACTING_IN", direction: OUT)
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await session.run(
            `
                MATCH(a:${typeMovie})
                MATCH(b:${typeSeries})
                MATCH(c:${typeActor})

                DETACH DELETE a
                DETACH DELETE b
                DETACH DELETE c
            `
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and return interface relationship fields", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = faker.datatype.number();
        const seriesScreenTime = faker.datatype.number();

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
            `,
            { actorName, movieTitle, movieRuntime, movieScreenTime, seriesTitle, seriesEpisodes, seriesScreenTime }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { name: actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: movieTitle,
                        },
                        {
                            episodes: seriesEpisodes,
                            title: seriesTitle,
                        },
                    ]),
                    name: actorName,
                },
            ],
        });
    });

    test("should read and return sorted interface relationship fields", async () => {
        const actor = {
            name: generate({
                readable: true,
                charset: "alphabetic",
            }),
        };

        const movie1 = {
            title: "A",
            runtime: faker.datatype.number(),
            screenTime: faker.datatype.number(),
        };

        const movie2 = {
            title: "B",
            runtime: faker.datatype.number(),
            screenTime: faker.datatype.number(),
        };

        const series1 = {
            title: "C",
            episodes: faker.datatype.number(),
            screenTime: faker.datatype.number(),
        };

        const series2 = {
            title: "D",
            episodes: faker.datatype.number(),
            screenTime: faker.datatype.number(),
        };

        const query = gql`
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn(options: { sort: [{ title: DESC }] }) {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${typeActor} { name: $actor.name })
                CREATE (:${typeMovie} { title: $movie1.title, runtime:$movie1.runtime })<-[:ACTED_IN { screenTime: $movie1.screenTime }]-(a)-[:ACTED_IN { screenTime: $movie2.screenTime }]->(:${typeMovie} { title: $movie2.title, runtime: $movie2.runtime })
                CREATE (:${typeSeries} { title: $series1.title, episodes: $series1.episodes })<-[:ACTED_IN { screenTime: $series1.screenTime }]-(a)-[:ACTED_IN { screenTime: $series2.screenTime }]->(:${typeSeries} { title: $series2.title, episodes: $series2.episodes })
            `,
            { actor, movie1, movie2, series1, series2 }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query.loc!.source,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { name: actor.name },
        });

        expect(gqlResult.errors).toBeFalsy();

        const [gqlActor] = (gqlResult.data as any)[typeActor.plural] as any[];

        expect(gqlActor.name).toEqual(actor.name);
        expect(gqlActor.actedIn).toHaveLength(4);
        expect(gqlActor.actedIn[0]).toEqual({ title: series2.title, episodes: series2.episodes });
        expect(gqlActor.actedIn[1]).toEqual({ title: series1.title, episodes: series1.episodes });
        expect(gqlActor.actedIn[2]).toEqual({ title: movie2.title, runtime: movie2.runtime });
        expect(gqlActor.actedIn[3]).toEqual({ title: movie1.title, runtime: movie1.runtime });
    });

    test("should read and return non-array interface relationship fields", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = faker.datatype.number();
        const seriesScreenTime = faker.datatype.number();

        const newMovieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const newMovieRuntime = faker.datatype.number();

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    currentlyActingIn {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a)-[:CURRENTLY_ACTING_IN]->(:${typeMovie} { title: $newMovieTitle, runtime: $newMovieRuntime })
            `,
            {
                actorName,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                newMovieTitle,
                newMovieRuntime,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { name: actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    currentlyActingIn: {
                        title: newMovieTitle,
                        runtime: newMovieRuntime,
                    },
                    name: actorName,
                },
            ],
        });
    });

    test("should read and return interface relationship fields with shared where", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesEpisodes = faker.datatype.number();
        const seriesScreenTime = faker.datatype.number();

        const query = `
            query Actors($name: String, $title: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn(where: { title: $title }) {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: "Apple", runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: "Apple", episodes: $seriesEpisodes })
            `,
            { actorName, movieTitle, movieRuntime, movieScreenTime, seriesEpisodes, seriesScreenTime }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { name: actorName, title: "Apple" },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: "Apple",
                        },
                        {
                            episodes: seriesEpisodes,
                            title: "Apple",
                        },
                    ]),
                    name: actorName,
                },
            ],
        });
    });

    test("should read and return interface relationship fields with type specific where", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesEpisodes = faker.datatype.number();
        const seriesScreenTime = faker.datatype.number();

        const query = `
            query Actors($name: String, $title: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn(where: { _on: { ${typeMovie}: { title: $title } } }) {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: "Apple", runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: "Apple", episodes: $seriesEpisodes })
            `,
            { actorName, movieTitle, movieRuntime, movieScreenTime, seriesEpisodes, seriesScreenTime }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { name: actorName, title: "Apple" },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: [
                        {
                            runtime: movieRuntime,
                            title: "Apple",
                        },
                    ],
                    name: actorName,
                },
            ],
        });
    });

    test("should read and return interface relationship fields with where override", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesEpisodes = faker.datatype.number();
        const seriesScreenTime = faker.datatype.number();

        const query = `
            query Actors($name: String, $title: String, $movieTitle: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn(where: { title: $title, _on: { ${typeMovie}: { title: $movieTitle } } }) {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: "Pear", runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: "Apple", episodes: $seriesEpisodes })
            `,
            { actorName, movieTitle, movieRuntime, movieScreenTime, seriesEpisodes, seriesScreenTime }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { name: actorName, title: "Apple", movieTitle: "Pear" },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: "Pear",
                        },
                        {
                            episodes: seriesEpisodes,
                            title: "Apple",
                        },
                    ]),
                    name: actorName,
                },
            ],
        });
    });

    test("should read and return all relationships with type specific where", async () => {
        const query = `
            query {
                ${typeActor.plural} {
                    actedInConnection(
                        where: { node: { _on: { ${typeMovie}: { title_STARTS_WITH: "The " } } }, edge: { screenTime_GT: 60 } }
                    ) {
                        edges {
                            node {
                                title
                                ... on ${typeMovie} {
                                    runtime
                                }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${typeActor} { name: "Arthur" })
                CREATE (a)-[:ACTED_IN { screenTime: 62 }]->(:${typeMovie} { title: "The Movie1", runtime: 100 })
                CREATE (a)-[:ACTED_IN { screenTime: 62 }]->(:${typeMovie} { title: "Movie2", runtime: 150 })
                CREATE (a)-[:ACTED_IN { screenTime: 62 }]->(:${typeSeries} { title: "Apple", episodes: 10 })
            `
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedInConnection: {
                        edges: [
                            {
                                node: {
                                    runtime: 100,
                                    title: "The Movie1",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
