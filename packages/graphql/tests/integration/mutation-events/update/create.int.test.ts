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

import { gql } from "apollo-server";
import faker from "faker";
import { graphql } from "graphql";
import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import { localEventEmitter } from "../../../../src/utils/pubsub";
import neo4j from "../../neo4j";

describe("interface relationships", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

    const events: { event: string | symbol, payload: any }[] = [];
    function onEvent(event: string | symbol, payload) {
        events.push({ event, payload });
    }

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = gql`
            type Episode {
                title: String!
                runtime: Int!
                series: Series @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production {
                title: String!
                episodes: [Episode] @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        localEventEmitter.addAnyListener(onEvent);
    });

    beforeEach(() => {
        events.splice(0);
    });
 
    afterAll(async () => {
        await driver.close();
        localEventEmitter.removeAnyListener(onEvent);
    });

    test("update create through relationship field and emits events", async () => {
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
        const seriesScreenTime = faker.random.number();

        const query = `
            mutation UpdateCreate(
                $name: String
                $movieTitle: String!
                $movieRuntime: Int!
                $movieScreenTime: Int!
                $seriesTitle: String!
                $seriesScreenTime: Int!
            ) {
                updateActors(
                    where: { name: $name }
                    create: {
                        actedIn: [
                            {
                                edge: { screenTime: $movieScreenTime }
                                node: { Movie: { title: $movieTitle, runtime: $movieRuntime } }
                            }
                            {
                                edge: { screenTime: $seriesScreenTime }
                                node: { Series: { title: $seriesTitle } }
                            }
                        ]
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            title
                            ... on Movie {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
            `,
                { actorName }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name: actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(events).toHaveLength(6);
            expect(events[0]).toMatchObject({
                event: 'Movie.Created',
                payload: {
                    name: 'Movie',
                    type: 'Created',
                    properties: {
                        title: movieTitle,
                        runtime: movieRuntime,
                    },
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Actor.Connected',
                payload: {
                    name: 'Actor',
                    type: 'Connected',
                    toName: 'Movie',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: movieScreenTime,
                    },
                },
            });
            expect(events[2]).toMatchObject({
                event: 'Movie.Connected',
                payload: {
                    name: 'Movie',
                    type: 'Connected',
                    toName: 'Actor',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: movieScreenTime,
                    },
                },
            });
            expect(events[3]).toMatchObject({
                event: 'Series.Created',
                payload: {
                    name: 'Series',
                    type: 'Created',
                    properties: {
                        title: seriesTitle,
                    },
                },
            });
            expect(events[4]).toMatchObject({
                event: 'Actor.Connected',
                payload: {
                    name: 'Actor',
                    type: 'Connected',
                    toName: 'Series',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: seriesScreenTime,
                    },
                },
            });
            expect(events[5]).toMatchObject({
                event: 'Series.Connected',
                payload: {
                    name: 'Series',
                    type: 'Connected',
                    toName: 'Actor',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: seriesScreenTime,
                    },
                },
            });
        } finally {
            await session.close();
        }
    });

    test("simple update create and emit events", async () => {
        const session = driver.session();

        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorName2 = generate({
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
        const seriesScreenTime = faker.random.number();

        const query = `
            mutation UpdateCreate(
                $name1: String
                $name2: String!
                $movieTitle: String!
                $movieRuntime: Int!
                $movieScreenTime: Int!
                $seriesTitle: String!
                $seriesScreenTime: Int!
            ) {
                updateActors(
                    where: { name: $name1 }
                    create: {
                        actedIn: [
                            {
                                edge: { screenTime: $movieScreenTime }
                                node: {
                                    Movie: {
                                        title: $movieTitle
                                        runtime: $movieRuntime
                                        actors: {
                                            create: { edge: { screenTime: $movieScreenTime }, node: { name: $name2 } }
                                        }
                                    }
                                }
                            }
                            { edge: { screenTime: $seriesScreenTime }, node: { Series: { title: $seriesTitle } } }
                        ]
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            title
                            actors {
                                name
                            }
                            ... on Movie {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName1 })
            `,
                { actorName1 }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name1: actorName1,
                    name2: actorName2,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.arrayContaining([
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.arrayContaining([{ name: actorName1 }, { name: actorName2 }]),
                                },
                                {
                                    title: seriesTitle,
                                    actors: [{ name: actorName1 }],
                                },
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });
            expect(
                gqlResult.data?.updateActors.actors[0].actedIn.find((actedIn) => actedIn.title === movieTitle).actors
            ).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("simple update create without relationship properties and emit events", async () => {

        const session = driver.session();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const episodeTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const episodeRunTime = faker.random.number();

        const query = `
            mutation UpdateCreate(
                $seriesTitle: String!
                $episodeTitle: String!
                $episodeRunTime: Int!
            ) {
                updateSeries(
                    where: { title: $seriesTitle }
                    create: {
                        episodes: [
                            {
                                node: {
                                    title: $episodeTitle,
                                    runtime: $episodeRunTime
                                }
                            }
                        ]
                    }
                ) {
                    series {
                        title
                        episodes {
                            title
                            runtime
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (s:Series { title: $seriesTitle })
            `,
                { seriesTitle }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    seriesTitle,
                    episodeTitle,
                    episodeRunTime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateSeries: {
                    series: [{
                        title: seriesTitle,
                        episodes: [
                            {
                                title: episodeTitle,
                                runtime: episodeRunTime,
                            },
                        ],
                    }]
                },
            });
            expect(events).toHaveLength(3);
            expect(events[0]).toMatchObject({
                event: 'Episode.Created',
                payload: {
                    name: 'Episode',
                    type: 'Created',
                    properties: {
                        title: episodeTitle,
                        runtime: episodeRunTime,
                    },
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Series.Connected',
                payload: {
                    name: 'Series',
                    type: 'Connected',
                    toName: 'Episode',
                    relationshipName: 'HAS_EPISODE',
                },
            });
            expect(events[1].payload.properties).toBeUndefined();
            expect(events[2]).toMatchObject({
                event: 'Episode.Connected',
                payload: {
                    name: 'Episode',
                    type: 'Connected',
                    toName: 'Series',
                    relationshipName: 'HAS_EPISODE',
                },
            });
            expect(events[2].payload.properties).toBeUndefined();
        } finally {
            await session.close();
        }
    });
});
