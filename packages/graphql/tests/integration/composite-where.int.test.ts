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
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("composite-where", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Delete", () => {
        test("should use composite where to delete", async () => {
            const session = driver.session();

            const typeDefs = `
                type Actor {
                    name: String
                }
    
                type Movie {
                    id: ID!
                    actors: [Actor] @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                interface ActedIn {
                    screenTime: Int
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const actorName = generate({
                charset: "alphabetic",
            });
            const movieId = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const query = `
                mutation($movieId: ID, $actorName: String, $screenTime: Int) {
                    updateMovies(
                        where: {
                            id: $movieId
                        }
                        delete: {
                            actors: {
                                where: {
                                    node: {
                                        name: $actorName
                                    }
                                    relationship: {
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
                        CREATE (:Movie {id: $movieId})<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName})
                    `,
                    { movieId, screenTime, actorName }
                );

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    variableValues: { movieId, actorName, screenTime },
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect(gqlResult?.data?.updateMovies).toEqual({ movies: [{ id: movieId, actors: [] }] });
            } finally {
                await session.close();
            }
        });
    });

    describe("Disconnect", () => {
        test("should use composite where to delete", async () => {
            const session = driver.session();

            const typeDefs = `
                type Actor {
                    name: String
                }
    
                type Movie {
                    id: ID!
                    actors: [Actor] @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                interface ActedIn {
                    screenTime: Int
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const actorName = generate({
                charset: "alphabetic",
            });
            const movieId = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const query = `
                mutation($movieId: ID, $actorName: String, $screenTime: Int) {
                    updateMovies(
                        where: {
                            id: $movieId
                        }
                        disconnect: {
                            actors: {
                                where: {
                                    node: {
                                        name: $actorName
                                    }
                                    relationship: {
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
                        CREATE (:Movie {id: $movieId})<-[:ACTED_IN {screenTime:$screenTime}]-(:Actor {name:$actorName})
                    `,
                    { movieId, screenTime, actorName }
                );

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    variableValues: { movieId, actorName, screenTime },
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect(gqlResult?.data?.updateMovies).toEqual({ movies: [{ id: movieId, actors: [] }] });
            } finally {
                await session.close();
            }
        });
    });
});
