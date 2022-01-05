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
                currentlyActingIn: Production @relationship(type: "CURRENTLY_ACTING_IN", direction: OUT)
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

    test("should read and return non-array interface relationship fields", async () => {
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

        const newMovieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const newMovieRuntime = faker.random.number();

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    currentlyActingIn {
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
                CREATE (a)-[:CURRENTLY_ACTING_IN]->(:Movie { title: $newMovieTitle, runtime: $newMovieRuntime })
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
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        currentlyActingIn: {
                            title: newMovieTitle,
                            runtime: newMovieRuntime,
                        },
                        name: actorName,
                    },
                ],
            });
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
