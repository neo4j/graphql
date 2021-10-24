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

describe("mutation events (update > connect)", () => {
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
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT, properties: "DirectorOf")
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

    test("should connect using interface relationship fields and emit events", async () => {
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
            mutation ConnectMovie($name: String, $title: String, $screenTime: Int!) {
                updateActors(
                    where: { name: $name }
                    connect: { actedIn: { edge: { screenTime: $screenTime }, where: { node: { title: $title } } } }
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
                CREATE (:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle })
            `,
                { actorName, movieTitle, movieRuntime, seriesTitle, seriesScreenTime }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName, title: movieTitle, screenTime: movieScreenTime },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.updateActors.actors[0].actedIn).toHaveLength(2);
            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.arrayContaining([
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                },
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
            expect(events[1]).toMatchObject({
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
        } finally {
            await session.close();
        }
    });

    test("should do a simple connect and emit events", async () => {
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
        const directorSalary = faker.random.number();

        const query = `
            mutation ConnectMovie($movieTitle: String, $directorName: String, $directorSalary: Int!) {
                updateDirectors(
                    where: { name: $directorName }
                    connect: {
                        directed: {
                            edge: { salary: $directorSalary }
                            where: { node: { title: $movieTitle } }
                        }
                    }
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
                CREATE (:Director { name: $directorName })
                CREATE (:Movie { title: $movieTitle, runtime:$movieRuntime })
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
                    directorSalary,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateDirectors: {
                    directors: [
                        {
                            name: directorName,
                            directedConnection: {
                                edges: [{
                                    salary: directorSalary,
                                    node: {
                                        title: movieTitle,
                                    },
                                }],
                            },
                        },
                    ],
                },
            });

            expect(events).toHaveLength(2);
            expect(events[0]).toMatchObject({
                event: 'Director.Connected',
                payload: {
                    name: 'Director',
                    type: 'Connected',
                    toName: 'Movie',
                    relationshipName: 'DIRECTED',
                    properties: {
                        salary: directorSalary,
                    },
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Movie.Connected',
                payload: {
                    name: 'Movie',
                    type: 'Connected',
                    toName: 'Director',
                    relationshipName: 'DIRECTED',
                    properties: {
                        salary: directorSalary,
                    },
                },
            });
        } finally {
            await session.close();
            localEventEmitter.removeAnyListener(onEvent);
        }
    });

});
