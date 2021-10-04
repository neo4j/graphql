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

    test("should nested create connect using interface relationship fields", async () => {
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
        } finally {
            await session.close();
        }
    });
});
