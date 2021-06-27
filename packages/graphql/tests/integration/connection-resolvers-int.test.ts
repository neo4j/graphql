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
import { Neo4jGraphQL } from "../../src/classes";
import neo4j from "./neo4j";

describe("Connection Resolvers", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should define a connection field resolver and resolve it", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                id: ID
                name: String!
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie {
                id: ID
                title: String!
                actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{
                    id: "${movieId}",
                    title: "Point Break",
                    actors: {
                        create: [{
                            node: {
                                id: "${actorId}",
                                name: "Keanu Reeves"
                            },
                            properties: {
                                screenTime: 100
                            }
                        }]
                    }
                }]) {
                    movies {
                        id
                        actorsConnection {
                            totalCount
                            pageInfo {
                                hasNextPage
                                hasPreviousPage
                                endCursor
                                startCursor
                            }
                            edges {
                                screenTime
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).createMovies.movies[0]).toEqual({
                id: movieId,
                actorsConnection: {
                    totalCount: 1,
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        endCursor: expect.any(String),
                        startCursor: expect.any(String),
                    },
                    edges: [
                        {
                            screenTime: 100,
                            node: {
                                id: actorId,
                                name: "Keanu Reeves",
                            },
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });
});
