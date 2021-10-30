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

describe.skip("mutation events (update > update)", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = gql`
            type Movie {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                gender: String
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("updates nodes and emits events", async () => {
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

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorNewName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const query = `
            mutation UpdateUpdate($name: String, $actorNewName: String, $newGender: String, $oldTitle: String, $newTitle: String) {
                updateActors(
                    where: { name: $name }
                    update: {
                        name: $actorNewName
                        actedIn: {
                            where: { node: { title: $oldTitle } }
                            update: { node: { title: $newTitle, actors: { update: { node: { gender: $newGender } } } } }
                        }
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

        const events: { event: string | symbol, payload: any }[] = [];
        function onEvent(event: string | symbol, payload) {
            events.push({ event, payload });
        }

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                }
            );

            localEventEmitter.addAnyListener(onEvent);
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name: actorName,
                    newGender: 'Male',
                    actorNewName,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.updateActors.actors[0].actedIn).toHaveLength(1);
            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.arrayContaining([
                                {
                                    runtime: movieRuntime,
                                    title: movieNewTitle,
                                },
                            ]),
                            name: actorNewName,
                        },
                    ],
                },
            });

            expect(events).toHaveLength(3);
            expect(events[0]).toMatchObject({
                event: 'Actor.Updated',
                payload: {
                    name: 'Actor',
                    type: 'Updated',
                    properties: {
                        gender: 'Male',
                    },
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Movie.Updated',
                payload: {
                    name: 'Movie',
                    type: 'Updated',
                    properties: {
                        title: movieNewTitle,
                    },
                },
            });
            expect(events[2]).toMatchObject({
                event: 'Actor.Updated',
                payload: {
                    name: 'Actor',
                    type: 'Updated',
                    properties: {
                        name: actorNewName,
                    },
                },
            });
        } finally {
            await session.close();
            localEventEmitter.removeAnyListener(onEvent);
        }
    });

    test("update through unnamed relationship field", async () => {
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
        const actorNewScreentime = faker.random.number();

        const actorNewName = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const query = `
            mutation UpdateUpdate($name: String, $actorNewName: String, $oldTitle: String, $newTitle: String, $actorNewScreentime: Int) {
                updateActors(
                    where: { name: $name }
                    update: {
                        actedIn: {
                            where: { node: { title: $oldTitle } }
                            update: {
                                edge: {
                                    screenTime: $actorNewScreentime
                                },
                                node: {
                                    title: $newTitle,
                                    actors: {
                                        update: {
                                            node: { name: $actorNewName }
                                            edge: { screenTime: $actorNewScreentime }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                        actedInConnection {
                            edges {
                                screenTime
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

        const events: { event: string | symbol, payload: any }[] = [];
        function onEvent(event: string | symbol, payload) {
            events.push({ event, payload });
        }

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                }
            );

            localEventEmitter.addAnyListener(onEvent);
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    name: actorName,
                    actorNewName,
                    actorNewScreentime,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedInConnection: {
                                edges: [{
                                    screenTime: actorNewScreentime,
                                    node: {
                                        title: movieNewTitle,
                                    }
                                }]
                            },
                            name: actorNewName,
                        },
                    ],
                },
            });

            expect(events).toHaveLength(6);
            expect(events[0]).toMatchObject({
                event: 'Actor.Updated',
                payload: {
                    name: 'Actor',
                    type: 'Updated',
                    properties: {
                        name: actorNewName,
                    },
                },
            });
            expect(events[1]).toMatchObject({
                event: 'Movie.RelationshipUpdated',
                payload: {
                    name: 'Movie',
                    type: 'RelationshipUpdated',
                    toName: 'Actor',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: actorNewScreentime,
                    },
                },
            });
            expect(events[2]).toMatchObject({
                event: 'Actor.RelationshipUpdated',
                payload: {
                    name: 'Actor',
                    type: 'RelationshipUpdated',
                    toName: 'Movie',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: actorNewScreentime,
                    },
                },
            });
            expect(events[3]).toMatchObject({
                event: 'Movie.Updated',
                payload: {
                    name: 'Movie',
                    type: 'Updated',
                    properties: {
                        title: movieNewTitle,
                    },
                },
            });
            expect(events[4]).toMatchObject({
                event: 'Actor.RelationshipUpdated',
                payload: {
                    name: 'Actor',
                    type: 'RelationshipUpdated',
                    toName: 'Movie',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: actorNewScreentime,
                    },
                },
            });
            expect(events[5]).toMatchObject({
                event: 'Movie.RelationshipUpdated',
                payload: {
                    name: 'Movie',
                    type: 'RelationshipUpdated',
                    toName: 'Actor',
                    relationshipName: 'ACTED_IN',
                    properties: {
                        screenTime: actorNewScreentime,
                    },
                },
            });
        } finally {
            await session.close();
            localEventEmitter.removeAnyListener(onEvent);
        }
    });

});
