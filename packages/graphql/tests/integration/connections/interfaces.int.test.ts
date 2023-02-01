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
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("Connections -> Interfaces", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let bookmarks: string[];

    const typeMovie = new UniqueType("Movie");
    const typeSeries = new UniqueType("Series");
    const typeActor = new UniqueType("Actor");

    const typeDefs = gql`
        interface Production {
            title: String!
        }

        type ${typeMovie.name} implements Production {
            title: String!
            runtime: Int!
        }

        type ${typeSeries.name} implements Production {
            title: String!
            episodes: Int!
        }

        interface ActedIn @relationshipProperties {
            screenTime: Int!
        }

        type ${typeActor.name} {
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
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                    CREATE (actor:${typeActor.name} {name: $actorName})
                    CREATE (actor)-[:ACTED_IN {screenTime: $seriesScreenTime}]->(:${typeSeries.name} {title: $seriesTitle, episodes: $seriesEpisodes})
                    CREATE (actor)-[:ACTED_IN {screenTime: $movie1ScreenTime}]->(:${typeMovie.name} {title: $movie1Title, runtime: $movie1Runtime})
                    CREATE (actor)-[:ACTED_IN {screenTime: $movie2ScreenTime}]->(:${typeMovie.name} {title: $movie2Title, runtime: $movie2Runtime})
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
        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                    MATCH (actor:${typeActor.name} {name: $actorName})
                    MATCH (series:${typeSeries.name} {title: $seriesTitle})
                    MATCH (movie1:${typeMovie.name} {title: $movie1Title})
                    MATCH (movie2:${typeMovie.name} {title: $movie2Title})
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedInConnection {
                        edges {
                            screenTime
                            node {
                                title
                                ... on ${typeMovie.name} {
                                    runtime
                                }
                                ... on ${typeSeries.name} {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect((result as any).data[typeActor.plural]).toEqual([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: expect.toIncludeSameMembers([
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedInConnection(where: { node: { title: "Game of Thrones" } }) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on ${typeMovie.name} {
                                    runtime
                                }
                                ... on ${typeSeries.name} {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect((result as any).data[typeActor.plural]).toEqual([
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedInConnection(where: { node: { title: "Game of Thrones", _on: { ${typeMovie.name}: { title: "Dune" } } } }) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on ${typeMovie.name} {
                                    runtime
                                }
                                ... on ${typeSeries.name} {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect((result as any).data[typeActor.plural]).toEqual([
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedInConnection(sort: [{ edge: { screenTime: DESC } }]) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on ${typeMovie.name} {
                                    runtime
                                }
                                ... on ${typeSeries.name} {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect((result as any).data[typeActor.plural]).toEqual([
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query Actors($name: String, $after: String) {
                ${typeActor.plural}(where: { name: $name }) {
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
                                ... on ${typeMovie.name} {
                                    runtime
                                }
                                ... on ${typeSeries.name} {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: {
                    name: actorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect((result as any).data[typeActor.plural]).toEqual([
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: {
                    name: actorName,
                    after: (result as any).data[typeActor.plural][0].actedInConnection.pageInfo.endCursor,
                },
            });

            expect(nextResult.errors).toBeFalsy();

            expect((nextResult as any).data[typeActor.plural]).toEqual([
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
        query Actors($name: String, $title: String) {
            ${typeActor.plural}(where: { name: $name }) {
                name
                actedInConnection(where: { node: { title: $title } }) {
                    edges {
                        screenTime
                        node {
                            title
                            ... on ${typeMovie.name} {
                                runtime
                            }
                            ... on ${typeSeries.name} {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: {
                    name: actorName,
                    title: movie1Title,
                },
            });

            expect(result.errors).toBeFalsy();

            expect((result as any).data[typeActor.plural]).toEqual([
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
