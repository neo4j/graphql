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
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Connections Alias", () => {
    let driver: Driver;

    const movieTitle = "Forrest Gump";
    const actorName = "Tom Hanks";
    const screenTime = 120;

    const typeDefs = gql`
        type Movie {
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
        }

        type Actor {
            name: String!
            movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
        }

        interface ActedIn {
            screenTime: Int!
        }
    `;

    const { schema } = new Neo4jGraphQL({ typeDefs });

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should allow nested connections", async () => {
        const session = driver.session();

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(where: { node: { name: "${actorName}" } }) {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        node {
                                            title
                                            actors {
                                                name
                                            }
                                        }
                                    }
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
                    CREATE (movie:Movie {title: $movieTitle})
                    CREATE (actor:Actor {name: $actorName})
                    CREATE (actor)-[:ACTED_IN {screenTime: $screenTime}]->(movie)
                `,
                {
                    movieTitle,
                    actorName,
                    screenTime,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.edges[0].node.moviesConnection).toEqual({
                edges: [
                    {
                        node: {
                            title: movieTitle,
                            actors: [
                                {
                                    name: actorName,
                                },
                            ],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should allow where clause on nested connections", async () => {
        const session = driver.session();

        const query = `
            {
                movies(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(where: { node: { name: "${actorName}" } }) {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection(where: { node: { title: "${movieTitle}" } }) {
                                    edges {
                                        node {
                                            title
                                            actors {
                                                name
                                            }
                                        }
                                    }
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
                    CREATE (movie:Movie {title: $movieTitle})
                    CREATE (actor:Actor {name: $actorName})
                    CREATE (actor)-[:ACTED_IN {screenTime: $screenTime}]->(movie)
                `,
                {
                    movieTitle,
                    actorName,
                    screenTime,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).movies[0].actorsConnection.edges[0].node.moviesConnection).toEqual({
                edges: [
                    {
                        node: {
                            title: movieTitle,
                            actors: [
                                {
                                    name: actorName,
                                },
                            ],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });
});
