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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("composite-where", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Delete", () => {
        test("should use composite where to delete", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String
                }

                type Movie {
                    id: ID!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                interface ActedIn @relationshipProperties {
                    screenTime: Int
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const actorName1 = generate({
                charset: "alphabetic",
            });
            const actorName2 = generate({
                charset: "alphabetic",
            });
            const movieId = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const query = `
                mutation($movieId: ID, $actorName1: String, $screenTime: Int) {
                    updateMovies(
                        where: {
                            id: $movieId
                        }
                        delete: {
                            actors: {
                                where: {
                                    node: {
                                        name: $actorName1
                                    }
                                    edge: {
                                        screenTime: $screenTime
                                    }
                                }
                            }
                        }
                    ) {
                        movies {
                            id
                            actors {
                                name
                            }
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                        CREATE (m:Movie {id: $movieId})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName1})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName2})
                    `,
                    { movieId, screenTime, actorName1, actorName2 }
                );

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    variableValues: { movieId, actorName1, screenTime },
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                expect(gqlResult?.data?.updateMovies).toEqual({
                    movies: [{ id: movieId, actors: [{ name: actorName2 }] }],
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("Disconnect", () => {
        test("should use composite where to delete", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String
                }

                type Movie {
                    id: ID!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                interface ActedIn @relationshipProperties {
                    screenTime: Int
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const actorName1 = generate({
                charset: "alphabetic",
            });
            const actorName2 = generate({
                charset: "alphabetic",
            });
            const movieId = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const query = `
                mutation($movieId: ID, $actorName1: String, $screenTime: Int) {
                    updateMovies(
                        where: {
                            id: $movieId
                        }
                        disconnect: {
                            actors: {
                                where: {
                                    node: {
                                        name: $actorName1
                                    }
                                    edge: {
                                        screenTime: $screenTime
                                    }
                                }
                            }
                        }
                    ) {
                        movies {
                            id
                            actors {
                                name
                            }
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                        CREATE (m:Movie {id: $movieId})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName1})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName2})
                    `,
                    { movieId, screenTime, actorName1, actorName2 }
                );

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    variableValues: { movieId, actorName1, screenTime },
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                expect(gqlResult?.data?.updateMovies).toEqual({
                    movies: [{ id: movieId, actors: [{ name: actorName2 }] }],
                });
            } finally {
                await session.close();
            }
        });
    });
});
