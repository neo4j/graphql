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
import faker from "faker";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("interface relationships", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and return interface relationship fields", async () => {
        const session = driver.session();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = faker.random.number();
        const seriesScreenTime = faker.random.number();

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedIn {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle, episodes: $seriesEpisodes })
            `,
                { actorName, movieTitle, movieRuntime, movieScreenTime, seriesTitle, seriesEpisodes, seriesScreenTime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.actors[0].actedIn).toHaveLength(2);
            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        actedIn: expect.arrayContaining([
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
        } finally {
            await session.close();
        }
    });

    test("should read and return sorted interface relationship fields", async () => {
        const session = driver.session();

        const actor = {
            name: generate({
                readable: true,
                charset: "alphabetic",
            }),
        };

        const movie1 = {
            title: "A",
            runtime: faker.random.number(),
            screenTime: faker.random.number(),
        };

        const movie2 = {
            title: "B",
            runtime: faker.random.number(),
            screenTime: faker.random.number(),
        };

        const series1 = {
            title: "C",
            episodes: faker.random.number(),
            screenTime: faker.random.number(),
        };

        const series2 = {
            title: "D",
            episodes: faker.random.number(),
            screenTime: faker.random.number(),
        };

        const query = gql`
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedIn(options: { sort: [{ title: DESC }] }) {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actor.name })
                CREATE (:Movie { title: $movie1.title, runtime:$movie1.runtime })<-[:ACTED_IN { screenTime: $movie1.screenTime }]-(a)-[:ACTED_IN { screenTime: $movie2.screenTime }]->(:Movie { title: $movie2.title, runtime: $movie2.runtime })
                CREATE (:Series { title: $series1.title, episodes: $series1.episodes })<-[:ACTED_IN { screenTime: $series1.screenTime }]-(a)-[:ACTED_IN { screenTime: $series2.screenTime }]->(:Series { title: $series2.title, episodes: $series2.episodes })
            `,
                { actor, movie1, movie2, series1, series2 }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query.loc!.source,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actor.name },
            });

            expect(gqlResult.errors).toBeFalsy();

            const [gqlActor] = gqlResult.data?.actors;

            expect(gqlActor.name).toEqual(actor.name);
            expect(gqlActor.actedIn).toHaveLength(4);
            expect(gqlActor.actedIn[0]).toEqual({ title: series2.title, episodes: series2.episodes });
            expect(gqlActor.actedIn[1]).toEqual({ title: series1.title, episodes: series1.episodes });
            expect(gqlActor.actedIn[2]).toEqual({ title: movie2.title, runtime: movie2.runtime });
            expect(gqlActor.actedIn[3]).toEqual({ title: movie1.title, runtime: movie1.runtime });
        } finally {
            await session.close();
        }
    });

    test("should read and return interface relationship fields with shared where", async () => {
        const session = driver.session();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesEpisodes = faker.random.number();
        const seriesScreenTime = faker.random.number();

        const query = `
            query Actors($name: String, $title: String) {
                actors(where: { name: $name }) {
                    name
                    actedIn(where: { title: $title }) {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: "Apple", runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: "Apple", episodes: $seriesEpisodes })
            `,
                { actorName, movieTitle, movieRuntime, movieScreenTime, seriesEpisodes, seriesScreenTime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName, title: "Apple" },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.actors[0].actedIn).toHaveLength(2);
            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        actedIn: expect.arrayContaining([
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
        } finally {
            await session.close();
        }
    });

    test("should read and return interface relationship fields with type specific where", async () => {
        const session = driver.session();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesEpisodes = faker.random.number();
        const seriesScreenTime = faker.random.number();

        const query = `
            query Actors($name: String, $title: String) {
                actors(where: { name: $name }) {
                    name
                    actedIn(where: { _on: { Movie: { title: $title } } }) {
                        title
                        ... on Movie {
                            runtime
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: "Apple", runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: "Apple", episodes: $seriesEpisodes })
            `,
                { actorName, movieTitle, movieRuntime, movieScreenTime, seriesEpisodes, seriesScreenTime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName, title: "Apple" },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                actors: [
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
        } finally {
            await session.close();
        }
    });

    test("should read and return interface relationship fields with where override", async () => {
        const session = driver.session();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesEpisodes = faker.random.number();
        const seriesScreenTime = faker.random.number();

        const query = `
            query Actors($name: String, $title: String, $movieTitle: String) {
                actors(where: { name: $name }) {
                    name
                    actedIn(where: { title: $title, _on: { Movie: { title: $movieTitle } } }) {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: "Pear", runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: "Apple", episodes: $seriesEpisodes })
            `,
                { actorName, movieTitle, movieRuntime, movieScreenTime, seriesEpisodes, seriesScreenTime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName, title: "Apple", movieTitle: "Pear" },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.actors[0].actedIn).toHaveLength(2);
            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        actedIn: expect.arrayContaining([
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
        } finally {
            await session.close();
        }
    });
});
