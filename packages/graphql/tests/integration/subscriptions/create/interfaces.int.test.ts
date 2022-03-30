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
import { DocumentNode, graphql } from "graphql";
import { faker } from "@faker-js/faker";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";

describe("interface relationships", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;
    let subscriptionsPlugin: TestSubscriptionsPlugin;
    let typeDefs: DocumentNode;
    let session: Session;

    beforeAll(async () => {
        driver = await neo4j();

        typeDefs = gql`
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
    });

    beforeEach(() => {
        subscriptionsPlugin = new TestSubscriptionsPlugin();
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                subscriptions: subscriptionsPlugin,
            },
        });
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create create nested nodes using interface relationship fields", async () => {
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
        const movieRuntime = faker.datatype.number();
        const screenTime = faker.datatype.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const episodeRuntime = faker.datatype.number();

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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
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

        expect((gqlResult.data as any)?.createActors.actors[0].actedIn).toHaveLength(2);
        expect(
            (gqlResult.data as any)?.createActors.actors[0].actedIn.find((actedIn) => actedIn.title === movieTitle)
                .actors
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

        expect(subscriptionsPlugin.eventList).toHaveLength(5);
        expect(subscriptionsPlugin.eventList).toEqual([
            {
                event: "create",
                id: expect.any(Number),
                properties: {
                    new: {
                        name: name2,
                    },
                    old: undefined,
                },
                typename: "Actor",
                timestamp: expect.any(Number),
            },
            {
                event: "create",
                id: expect.any(Number),
                properties: {
                    new: {
                        runtime: movieRuntime,
                        title: movieTitle,
                    },
                    old: undefined,
                },
                typename: "Movie",
                timestamp: expect.any(Number),
            },
            {
                event: "create",
                id: expect.any(Number),
                properties: {
                    new: {
                        runtime: episodeRuntime,
                    },
                    old: undefined,
                },
                typename: "Episode",
                timestamp: expect.any(Number),
            },
            {
                event: "create",
                id: expect.any(Number),
                properties: {
                    new: {
                        title: seriesTitle,
                    },
                    old: undefined,
                },
                typename: "Series",
                timestamp: expect.any(Number),
            },
            {
                event: "create",
                id: expect.any(Number),
                properties: {
                    new: {
                        name: name1,
                    },
                    old: undefined,
                },
                typename: "Actor",
                timestamp: expect.any(Number),
            },
        ]);
    });
});
