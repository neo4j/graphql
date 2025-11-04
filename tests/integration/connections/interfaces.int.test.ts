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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Connections -> Interfaces", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeSeries: UniqueType;
    let typeActor: UniqueType;

    let typeDefs: string;

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

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeSeries = testHelper.createUniqueType("Series");
        typeActor = testHelper.createUniqueType("Actor");

        typeDefs = `
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

        type ActedIn @relationshipProperties {
            screenTime: Int!
        }

        type ${typeActor.name} {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
    `;

        await testHelper.executeCypher(
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
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedInConnection {
                        edges {
                            properties {
                                screenTime
                            }
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: movie1ScreenTime },
                            node: {
                                title: movie1Title,
                                runtime: movie1Runtime,
                            },
                        },
                        {
                            properties: { screenTime: movie2ScreenTime },
                            node: {
                                title: movie2Title,
                                runtime: movie2Runtime,
                            },
                        },
                        {
                            properties: { screenTime: seriesScreenTime },
                            node: {
                                title: seriesTitle,
                                episodes: seriesEpisodes,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("Projecting node and relationship properties with shared where argument", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedInConnection(where: { node: { title: "Game of Thrones" } }) {
                        edges {
                            properties {
                                screenTime
                            }
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: seriesScreenTime },
                            node: {
                                title: seriesTitle,
                                episodes: seriesEpisodes,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("Projecting node and relationship properties with sort argument", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedInConnection(sort: [{ edge: { screenTime: DESC } }]) {
                        edges {
                            properties {
                                screenTime
                            }
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: seriesScreenTime },
                            node: {
                                title: seriesTitle,
                                episodes: seriesEpisodes,
                            },
                        },
                        {
                            properties: { screenTime: movie2ScreenTime },
                            node: {
                                title: movie2Title,
                                runtime: movie2Runtime,
                            },
                        },
                        {
                            properties: { screenTime: movie1ScreenTime },
                            node: {
                                title: movie1Title,
                                runtime: movie1Runtime,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("Projecting node and relationship properties with pagination", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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
                            properties {
                                screenTime
                            }
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: seriesScreenTime },
                            node: {
                                title: seriesTitle,
                                episodes: seriesEpisodes,
                            },
                        },
                        {
                            properties: { screenTime: movie2ScreenTime },
                            node: {
                                title: movie2Title,
                                runtime: movie2Runtime,
                            },
                        },
                    ],
                },
            },
        ]);

        const nextResult = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: movie1ScreenTime },
                            node: {
                                title: movie1Title,
                                runtime: movie1Runtime,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("With where argument for shared field on node with node in database", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
        query Actors($name: String, $title: String) {
            ${typeActor.plural}(where: { name: $name }) {
                name
                actedInConnection(where: { node: { title: $title } }) {
                    edges {
                        properties {
                            screenTime
                        }
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: movie1ScreenTime },
                            node: {
                                title: movie1Title,
                                runtime: movie1Runtime,
                            },
                        },
                    ],
                },
            },
        ]);
    });
});
