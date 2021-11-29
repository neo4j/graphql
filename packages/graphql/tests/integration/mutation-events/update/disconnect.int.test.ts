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
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { localEventEmitter } from "../../../../src/utils/pubsub";

describe("mutation events (update > disconnect)", () => {
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

            interface DirectorOf @relationshipProperties {
                salary: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Director {
                name: String!
                directed: [Movie] @relationship(type: "DIRECTED", direction: OUT, properties: "DirectorOf")
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

    test("emits no events after unsuccessful disconnect", async () => {

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
            mutation DisconnectMovie($name: String, $title: String) {
                updateActors(
                    where: { name: $name },
                    disconnect: { actedIn: { where: { node: { title: $title } } } }
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
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle })
            `,
                { actorName, movieTitle, movieRuntime, seriesTitle, seriesScreenTime, movieScreenTime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName, title: 'X' },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.updateActors.actors[0].actedIn).toHaveLength(2);
            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.arrayContaining([
                                {
                                    title: seriesTitle,
                                },
                                {
                                    title: movieTitle,
                                    runtime: movieRuntime,
                                },
                            ]),
                            name: actorName,
                        },
                    ],
                },
            });

            expect(events).toHaveLength(0);
        } finally {
            await session.close();
        }
    });
    test("disconnect using interface relationship fields and emit events", async () => {
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
            mutation DisconnectMovie($name: String, $title: String) {
                updateActors(
                    where: { name: $name },
                    disconnect: { actedIn: { where: { node: { title: $title } } } }
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
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle })
            `,
                { actorName, movieTitle, movieRuntime, seriesTitle, seriesScreenTime, movieScreenTime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.updateActors.actors[0].actedIn).toHaveLength(1);
            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.arrayContaining([
                                {
                                    title: seriesTitle,
                                },
                            ]),
                            name: actorName,
                        },
                    ],
                },
            });


            expect(events).toHaveLength(2);
            expect(events[0]).toMatchObject({
                event: 'Actor.Disconnected',
                payload: {
                    name: 'Actor',
                    type: 'Disconnected',
                    toName: 'Movie',
                    relationshipName: 'ACTED_IN',
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Movie.Disconnected',
                payload: {
                    name: 'Movie',
                    type: 'Disconnected',
                    toName: 'Actor',
                    relationshipName: 'ACTED_IN',
                },
            });
            expect(events[0].payload.properties).toBeUndefined();
            expect(events[1].payload.properties).toBeUndefined();
        } finally {
            await session.close();
        }
    });

    test("should do a simple disconnect and emit events", async () => {
        const session = driver.session();

        const directorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieRuntime = faker.random.number();

        const query = `
            mutation DisconnectMovie($movieTitle: String, $directorName: String) {
                updateDirectors(
                    where: { name: $directorName }
                    disconnect: { directed: { where: { node: { title: $movieTitle } } } }
                ) {
                    directors {
                        name
                        directedConnection {
                            edges {
                                salary
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;


        try {
            await session.run(
                `
                CREATE (:Director { name: $directorName })-[:DIRECTED { salary: 16000 }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
            `,
                { movieTitle, movieRuntime, directorName }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    directorName,
                    movieTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateDirectors: {
                    directors: [
                        {
                            name: directorName,
                            directedConnection: {
                                edges: [],
                            },
                        },
                    ],
                },
            });

            expect(events).toHaveLength(2);
            expect(events[0]).toMatchObject({
                event: 'Director.Disconnected',
                payload: {
                    name: 'Director',
                    type: 'Disconnected',
                    toName: 'Movie',
                    relationshipName: 'DIRECTED',
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Movie.Disconnected',
                payload: {
                    name: 'Movie',
                    type: 'Disconnected',
                    toName: 'Director',
                    relationshipName: 'DIRECTED',
                },
            });
        } finally {
            await session.close();
            localEventEmitter.removeAnyListener(onEvent);
        }
    });

});
