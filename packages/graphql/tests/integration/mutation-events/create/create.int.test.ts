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

describe("mutation events (create > create)", () => {
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

    test("should create create using interface relationship fields and emit events", async () => {
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

        const query = `
            mutation CreateActorConnectMovie($name: String!, $title: String!, $runtime: Int!, $screenTime: Int!) {
                createActors(
                    input: [
                        {
                            name: $name
                            actedIn: {
                                create: {
                                    edge: { screenTime: $screenTime }
                                    node: { Movie: { title: $title, runtime: $runtime } }
                                }
                            }
                        }
                    ]
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
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name: actorName,
                    title: movieTitle,
                    runtime: movieRuntime,
                    screenTime: movieScreenTime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                createActors: {
                    actors: [
                        {
                            actedIn: [
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                },
                            ],
                            name: actorName,
                        },
                    ],
                },
            });
            expect(events).toHaveLength(4);
            expect(events[0]).toMatchObject({
                event: 'Actor.Created',
                payload: {
                    properties: {
                        name: actorName,
                    },
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Movie.Created',
                payload: {
                    properties: {
                        title: movieTitle,
                        runtime: movieRuntime,
                    },
                },
            });
            expect(events[2]).toMatchObject({
                event: 'Actor.Connected',
                payload: {
                    toName: 'Movie',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: movieScreenTime,
                    },
                },
            });
            expect(events[3]).toMatchObject({
                event: 'Movie.Connected',
                payload: {
                    toName: 'Actor',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: movieScreenTime,
                    },
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should create create nested nodes using interface relationship fields and emit events", async () => {
        const session = driver.session();

        const name1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const name2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.random.number();
        const screenTime = faker.random.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const episodeRuntime = faker.random.number();

        const query = `
            mutation CreateActorConnectMovie(
                $name1: String!
                $name2: String!
                $movieTitle: String!
                $movieRuntime: Int!
                $screenTime: Int!
                $seriesTitle: String!
                $episodeRuntime: Int!
            ) {
                createActors(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                create: [
                                    {
                                        edge: { screenTime: $screenTime }
                                        node: {
                                            Movie: {
                                                title: $movieTitle
                                                runtime: $movieRuntime
                                                actors: {
                                                    create: {
                                                        edge: { screenTime: $screenTime }
                                                        node: { name: $name2 }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    {
                                        edge: { screenTime: $screenTime }
                                        node: {
                                            Series: {
                                                title: $seriesTitle
                                                episodes: { create: { node: { runtime: $episodeRuntime } } }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
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
                            ... on Series {
                                episodes {
                                    runtime
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name1,
                    name2,
                    movieTitle,
                    movieRuntime,
                    screenTime,
                    seriesTitle,
                    episodeRuntime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.createActors.actors[0].actedIn).toHaveLength(2);
            expect(
                gqlResult.data?.createActors.actors[0].actedIn.find((actedIn) => actedIn.title === movieTitle).actors
            ).toHaveLength(2);
            expect(gqlResult.data).toEqual({
                createActors: {
                    actors: [
                        {
                            actedIn: expect.arrayContaining([
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.arrayContaining([{ name: name2 }, { name: name1 }]),
                                },
                                {
                                    title: seriesTitle,
                                    actors: [{ name: name1 }],
                                    episodes: [{ runtime: episodeRuntime }],
                                },
                            ]),
                            name: name1,
                        },
                    ],
                },
            });
            expect(events).toHaveLength(13);
            [
                'Actor.Created',
                'Movie.Created',
                'Actor.Created',
                'Movie.Connected',
                'Actor.Connected',
                'Actor.Connected',
                'Movie.Connected',
                'Series.Created',
                'Episode.Created',
                'Series.Connected',
                'Episode.Connected',
                'Actor.Connected',
                'Series.Connected',
            ].forEach((v, i) => expect(events[i].event).toEqual(v));

        } finally {
            await session.close();
        }
    });
});
