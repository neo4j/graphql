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

import { faker } from "@faker-js/faker";
import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import Neo4j from "../../neo4j";

describe("interface relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let subscriptionsPlugin: TestSubscriptionsEngine;
    let typeDefs: DocumentNode;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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
        subscriptionsPlugin = new TestSubscriptionsEngine();
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: subscriptionsPlugin,
            },
        });
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
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
        const movieRuntime = faker.number.int({ max: 100000 });
        const screenTime = faker.number.int({ max: 100000 });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const episodeRuntime = faker.number.int({ max: 100000 });

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
            contextValue: neo4j.getContextValues(),
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

        expect(gqlResult.data).toEqual({
            createActors: {
                actors: [
                    {
                        actedIn: expect.toIncludeSameMembers([
                            {
                                runtime: movieRuntime,
                                title: movieTitle,
                                actors: expect.toIncludeSameMembers([{ name: name2 }, { name: name1 }]),
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

        expect(subscriptionsPlugin.eventList.filter((event) => event.event === "create")).toHaveLength(5);
        expect(subscriptionsPlugin.eventList).toEqual(
            expect.arrayContaining([
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
            ])
        );
    });
});
