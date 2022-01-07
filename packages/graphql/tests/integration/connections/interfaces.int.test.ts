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

describe("Connections -> Interfaces", () => {
    let driver: Driver;
    let bookmarks: string[];

    const typeDefs = gql`
        interface Production {
            title: String!
        }

        type Movie implements Production {
            title: String!
            runtime: Int!
        }

        type Series implements Production {
            title: String!
            episodes: Int!
        }

        interface ActedIn @relationshipProperties {
            screenTime: Int!
        }

        type Actor {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
    `;

    const actorName = "Jason Momoa";

    const seriesTitle = "Game of Thrones";
    const seriesEpisodes = 73;
    const seriesScreenTime = 858;

    const movie1Title = "Dune";
    const movie1Runtime = 155;
    const movie1ScreenTime = 90;

    const movie2Title = "Aquaman";
    const movie2Runtime = 144;
    const movie2ScreenTime = 120;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `
                    CREATE (actor:Actor {name: $actorName})
                    CREATE (actor)-[:ACTED_IN {screenTime: $seriesScreenTime}]->(:Series {title: $seriesTitle, episodes: $seriesEpisodes})
                    CREATE (actor)-[:ACTED_IN {screenTime: $movie1ScreenTime}]->(:Movie {title: $movie1Title, runtime: $movie1Runtime})
                    CREATE (actor)-[:ACTED_IN {screenTime: $movie2ScreenTime}]->(:Movie {title: $movie2Title, runtime: $movie2Runtime})
                `,
                {
                    actorName,
                    seriesTitle,
                    seriesEpisodes,
                    seriesScreenTime,
                    movie1Title,
                    movie1Runtime,
                    movie1ScreenTime,
                    movie2Title,
                    movie2Runtime,
                    movie2ScreenTime,
                }
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run(
                `
                    MATCH (actor:Actor {name: $actorName})
                    MATCH (series:Series {title: $seriesTitle})
                    MATCH (movie1:Movie {title: $movie1Title})
                    MATCH (movie2:Movie {title: $movie2Title})
                    DETACH DELETE actor, series, movie1, movie2
                `,
                {
                    actorName,
                    seriesTitle,
                    movie1Title,
                    movie2Title,
                }
            );
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedInConnection {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: expect.arrayContaining([
                            {
                                screenTime: movie1ScreenTime,
                                node: {
                                    title: movie1Title,
                                    runtime: movie1Runtime,
                                },
                            },
                            {
                                screenTime: movie2ScreenTime,
                                node: {
                                    title: movie2Title,
                                    runtime: movie2Runtime,
                                },
                            },
                            {
                                screenTime: seriesScreenTime,
                                node: {
                                    title: seriesTitle,
                                    episodes: seriesEpisodes,
                                },
                            },
                        ]),
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting node and relationship properties with shared where argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedInConnection(where: { node: { title: "Game of Thrones" } }) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: [
                            {
                                screenTime: seriesScreenTime,
                                node: {
                                    title: seriesTitle,
                                    episodes: seriesEpisodes,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting node and relationship properties with shared where override", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedInConnection(where: { node: { title: "Game of Thrones", _on: { Movie: { title: "Dune" } } } }) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: [
                            {
                                screenTime: movie1ScreenTime,
                                node: {
                                    title: movie1Title,
                                    runtime: movie1Runtime,
                                },
                            },
                            {
                                screenTime: seriesScreenTime,
                                node: {
                                    title: seriesTitle,
                                    episodes: seriesEpisodes,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting node and relationship properties with sort argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedInConnection(sort: [{ edge: { screenTime: DESC } }]) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: [
                            {
                                screenTime: seriesScreenTime,
                                node: {
                                    title: seriesTitle,
                                    episodes: seriesEpisodes,
                                },
                            },
                            {
                                screenTime: movie2ScreenTime,
                                node: {
                                    title: movie2Title,
                                    runtime: movie2Runtime,
                                },
                            },
                            {
                                screenTime: movie1ScreenTime,
                                node: {
                                    title: movie1Title,
                                    runtime: movie1Runtime,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting node and relationship properties with pagination", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedInConnection(first: 2, sort: { edge: { screenTime: DESC } }) {
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                            endCursor
                        }
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
                            }
                        }
                    }
                }
            }
        `;

        const nextQuery = `
            query Actors($name: String, $after: String) {
                actors(where: { name: $name }) {
                    name
                    actedInConnection(first: 2, after: $after, sort: { edge: { screenTime: DESC } }) {
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                            endCursor
                        }
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        pageInfo: {
                            hasNextPage: true,
                            hasPreviousPage: false,
                            endCursor: expect.any(String),
                        },
                        edges: [
                            {
                                screenTime: seriesScreenTime,
                                node: {
                                    title: seriesTitle,
                                    episodes: seriesEpisodes,
                                },
                            },
                            {
                                screenTime: movie2ScreenTime,
                                node: {
                                    title: movie2Title,
                                    runtime: movie2Runtime,
                                },
                            },
                        ],
                    },
                },
            ]);

            const nextResult = await graphql({
                schema: neoSchema.schema,
                source: nextQuery,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    name: actorName,
                    after: result.data?.actors[0].actedInConnection.pageInfo.endCursor,
                },
            });

            expect(nextResult.errors).toBeFalsy();

            expect(nextResult?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        pageInfo: {
                            hasNextPage: false,
                            hasPreviousPage: true,
                            endCursor: expect.any(String),
                        },
                        edges: [
                            {
                                screenTime: movie1ScreenTime,
                                node: {
                                    title: movie1Title,
                                    runtime: movie1Runtime,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With where argument for shared field on node with node in database", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
        query Actors($name: String, $title: String) {
            actors(where: { name: $name }) {
                name
                actedInConnection(where: { node: { title: $title } }) {
                    edges {
                        screenTime
                        node {
                            title
                            ... on Movie {
                                runtime
                            }
                            ... on Series {
                                episodes
                            }
                        }
                    }
                }
            }
        }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks } },
                variableValues: {
                    name: actorName,
                    title: movie1Title,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: [
                            {
                                screenTime: movie1ScreenTime,
                                node: {
                                    title: movie1Title,
                                    runtime: movie1Runtime,
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
