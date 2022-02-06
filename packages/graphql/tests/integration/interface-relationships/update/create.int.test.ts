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

describe("interface relationships", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

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
    });

    afterAll(async () => {
        await driver.close();
    });

    test("update create through relationship field", async () => {
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
            expect((gqlResult.data as any)?.updateActors.actors[0].actedIn).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("update nested create through relationship field", async () => {
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
                (gqlResult.data as any)?.updateActors.actors[0].actedIn.find((actedIn) => actedIn.title === movieTitle)
                    .actors
            ).toHaveLength(2);
        } finally {
            await session.close();
        }
    });
});
