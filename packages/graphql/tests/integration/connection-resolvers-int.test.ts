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
import { offsetToCursor } from "graphql-relay";
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
                            edge: {
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
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
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

    test("it should provide an after offset that correctly results in the next batch of items", async () => {
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
            driver,
        });

        const create = `
            mutation CreateMovie($input: [MovieCreateInput!]!) {
                createMovies(input: $input) {
                    movies {
                        id
                        title
                        actorsConnection(first: 5, sort: [{ node: { name: ASC } }]) {
                            totalCount
                            pageInfo {
                                hasNextPage
                                hasPreviousPage
                                endCursor
                                startCursor
                            }
                            edges {
                                cursor
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

        const actors = [...Array(20).keys()].map((x) => ({
            node: {
                id: x.toString(),
                name: String.fromCharCode(x + 1 + 64) + generate({ charset: "alphabetic" }),
            },
            edge: {
                screenTime: Math.floor(Math.random() * 200),
            },
        }));

        const movieTitle = "Bill & Ted's Excellent Pagination Adventure";
        const movieId = generate({ charset: "alphabetic" });

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    input: [
                        {
                            id: movieId,
                            title: movieTitle,
                            actors: {
                                create: actors,
                            },
                        },
                    ],
                },
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.createMovies?.movies).toEqual([
                {
                    id: movieId,
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 20,
                        edges: actors.slice(0, 5).map(({ node, edge }) => ({
                            node,
                            screenTime: edge.screenTime,
                            cursor: expect.any(String),
                        })),
                        pageInfo: {
                            hasNextPage: true,
                            hasPreviousPage: false,
                            startCursor: offsetToCursor(0),
                            endCursor: offsetToCursor(4),
                        },
                    },
                },
            ]);

            const secondQuery = `
                query Movies($movieId: ID!, $endCursor: String) {
                    movies(where: { id: $movieId }) {
                        id
                        title
                        actorsConnection(sort: [{ node: { name: ASC } }], first: 5, after: $endCursor) {
                            totalCount
                            edges {
                                cursor
                                screenTime
                                node {
                                    id
                                    name
                                }
                            }
                            pageInfo {
                                hasPreviousPage
                                hasNextPage
                                startCursor
                                endCursor
                            }
                        }
                    }
                }
            `;

            const result2 = await graphql({
                schema: neoSchema.schema,
                source: secondQuery,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    movieId,
                    endCursor: (result?.data as any)?.createMovies.movies[0].actorsConnection.pageInfo.endCursor,
                },
            });
            expect(result2.errors).toBeFalsy();

            expect((result2?.data as any)?.movies[0]).toEqual({
                id: movieId,
                title: movieTitle,
                actorsConnection: {
                    totalCount: 20,
                    edges: actors.slice(5, 10).map(({ node, edge }) => ({
                        node,
                        cursor: expect.any(String),
                        screenTime: edge.screenTime,
                    })),
                    pageInfo: {
                        hasPreviousPage: true,
                        hasNextPage: true,
                        startCursor: offsetToCursor(5),
                        endCursor: offsetToCursor(9),
                    },
                },
            });

            const result3 = await graphql({
                schema: neoSchema.schema,
                source: secondQuery,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    movieId,
                    endCursor: (result2?.data as any)?.movies[0].actorsConnection.pageInfo.endCursor,
                },
            });

            expect(result3.errors).toBeFalsy();

            expect((result3?.data as any)?.movies[0]).toEqual({
                id: movieId,
                title: movieTitle,
                actorsConnection: {
                    totalCount: 20,
                    edges: actors.slice(10, 15).map(({ node, edge }) => ({
                        node,
                        cursor: expect.any(String),
                        screenTime: edge.screenTime,
                    })),
                    pageInfo: {
                        hasPreviousPage: true,
                        hasNextPage: true,
                        startCursor: offsetToCursor(10),
                        endCursor: offsetToCursor(14),
                    },
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return a total count of zero and correct pageInfo if no edges", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                id: ID
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        const query = `
            query GetMovie($movieId: ID) {
                movies(where: { id: $movieId }) {
                    id
                    actorsConnection {
                        totalCount
                        pageInfo {
                            startCursor
                            endCursor
                            hasNextPage
                            hasPreviousPage
                        }
                    }
                }
            }
        `;

        try {
            await session.run("CREATE (:Movie { id: $movieId })", { movieId });

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { movieId },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).movies).toEqual([
                {
                    id: movieId,
                    actorsConnection: {
                        totalCount: 0,
                        pageInfo: { startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false },
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
