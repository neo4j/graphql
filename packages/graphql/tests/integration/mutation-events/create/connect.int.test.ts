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

describe("mutation events (create > connect)", () => {
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
                series: Series! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production {
                title: String!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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
        localEventEmitter.addAnyListener(onEvent);
    });

    beforeEach(() => {
        events.splice(0);
    });

    afterAll(async () => {
        await driver.close();
        localEventEmitter.removeAnyListener(onEvent);
    });

    test("should nested create connect using interface relationship fields and emit events", async () => {
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

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!, $name2: String) {
                createActors(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: {
                                    edge: { screenTime: $screenTime }
                                    where: { node: { title: $title } }
                                    connect: {
                                        actors: { edge: { screenTime: $screenTime }, where: { node: { name: $name2 } } }
                                    }
                                }
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
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:Actor { name: $name })
            `,
                { movieTitle, movieRuntime, name: actorName2 }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                    name2: actorName2,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.createActors.actors[0].actedIn[0].actors).toHaveLength(2);
            expect(gqlResult.data).toEqual({
                createActors: {
                    actors: [
                        {
                            actedIn: [
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.arrayContaining([{ name: actorName2 }, { name: actorName1 }]),
                                },
                            ],
                            name: actorName1,
                        },
                    ],
                },
            });
            expect(events).toHaveLength(6);
            expect(events[0]).toMatchObject({
                event: 'Actor.Created',
                payload: {
                    name: 'Actor',
                    type: 'Created',
                    properties: {
                        name: actorName1,
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
            expect(events[4]).toMatchObject({
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
            expect(events[5]).toMatchObject({
                event: 'Actor.Created',
                payload: {
                    name: 'Actor',
                    type: 'Created',
                    properties: {
                        name: actorName1,
                    },
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should nested create connect using interface relationship fields and only connect from one type", async () => {
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

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!, $name2: String) {
                createActors(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: {
                                    edge: { screenTime: $screenTime }
                                    where: { node: { title: $title } }
                                    connect: {
                                        _on: {
                                            Movie: {
                                                actors: {
                                                    edge: { screenTime: $screenTime }
                                                    where: { node: { name: $name2 } }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                ) {
                    actors {
                        name
                        actedIn {
                            __typename
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
                CREATE (:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:Series { title: $movieTitle, episodes:$movieRuntime })
                CREATE (:Actor { name: $name })
            `,
                { movieTitle, movieRuntime, name: actorName2 }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                    name2: actorName2,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.createActors.actors[0].actedIn).toHaveLength(2);
            expect(
                gqlResult.data?.createActors.actors[0].actedIn.find((actedIn) => actedIn.__typename === "Movie").actors
            ).toHaveLength(2);
            expect(gqlResult.data?.createActors.actors[0].actedIn).toHaveLength(2);

            expect(gqlResult.data).toEqual({
                createActors: {
                    actors: [
                        {
                            actedIn: expect.arrayContaining([
                                {
                                    __typename: "Movie",
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.arrayContaining([{ name: actorName2 }, { name: actorName1 }]),
                                },
                                {
                                    __typename: "Series",
                                    title: movieTitle,
                                    actors: [{ name: actorName1 }],
                                },
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });
            expect(events).toHaveLength(8);
        } finally {
            await session.close();
        }
    });

    test("should only connect to one type when only _on used", async () => {
        const session = driver.session();

        const actorName1 = generate({
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
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!) {
                createActors(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: {
                                    edge: { screenTime: $screenTime }
                                    where: { node: { _on: { Movie: { title: $title } } } }
                                }
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
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:Series { title: $movieTitle, episodes:$movieRuntime })
            `,
                { movieTitle, movieRuntime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
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
                                    actors: [{ name: actorName1 }],
                                },
                            ],
                            name: actorName1,
                        },
                    ],
                },
            });
            expect(events).toHaveLength(3);
        } finally {
            await session.close();
        }
    });
});
