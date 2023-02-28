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
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Relationship properties - update", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let bookmarks: string[];
    const typeDefs = gql`
        type Movie {
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
        }

        type Actor {
            name: String!
            movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
        }

        interface ActedIn @relationshipProperties {
            screenTime: Int!
        }
    `;
    const movieTitle = generate({ charset: "alphabetic" });
    const actor1 = generate({ charset: "alphabetic" });
    const actor2 = generate({ charset: "alphabetic" });
    const actor3 = generate({ charset: "alphabetic" });

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                    CREATE (:Actor { name: '${actor1}' })-[:ACTED_IN { screenTime: 105 }]->(m:Movie { title: '${movieTitle}'})
                    CREATE (m)<-[:ACTED_IN { screenTime: 100 }]-(:Actor { name: '${actor2}' })
                `
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(`MATCH (a:Actor) WHERE a.name = '${actor1}' DETACH DELETE a`);
            await session.run(`MATCH (a:Actor) WHERE a.name = '${actor2}' DETACH DELETE a`);
            await session.run(`MATCH (a:Actor) WHERE a.name = '${actor3}' DETACH DELETE a`);
            await session.run(`MATCH (m:Movie) WHERE m.title = '${movieTitle}' DETACH DELETE m`);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Update a relationship property on a relationship between two specified nodes (update -> update)", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    update: { actors: [{ where: { node: { name: "${actor1}" } }, update: { edge: { screenTime: 60 } } }] }
                ) {
                    movies {
                        title
                        actorsConnection(sort: { edge: { screenTime: DESC }}) {
                            edges {
                                screenTime
                                node {
                                    name
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
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.updateMovies?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 100,
                                node: {
                                    name: actor2,
                                },
                            },
                            {
                                screenTime: 60,
                                node: {
                                    name: actor1,
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

    test("Update properties on both the relationship and end node in a nested update (update -> update)", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    update: {
                        actors: [
                            {
                                where: { node: { name: "${actor2}" } }
                                update: {
                                    edge: { screenTime: 60 }
                                    node: { name: "${actor3}" }
                                }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
                        actorsConnection(sort: { edge: { screenTime: ASC }}) {
                            edges {
                                screenTime
                                node {
                                    name
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
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.updateMovies?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 60,
                                node: {
                                    name: actor3,
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: actor1,
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

    test("Create relationship node through update field on end node in a nested update (update -> update)", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    update: {
                        actors: [
                            {
                                create: {
                                    node: { name: "${actor3}" }
                                    edge: { screenTime: 60 }
                                }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
                        actorsConnection(sort: { edge: { screenTime: ASC }}) {
                            edges {
                                screenTime
                                node {
                                    name
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
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.updateMovies?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 60,
                                node: {
                                    name: actor3,
                                },
                            },
                            {
                                screenTime: 100,
                                node: {
                                    name: actor2,
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: actor1,
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

    test("Create a relationship node with relationship properties on end node in a nested update (update -> create)", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    create: {
                        actors: [
                            {
                                node: { name: "${actor3}" }
                                edge: { screenTime: 60 }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
                        actorsConnection(sort: { edge: { screenTime: ASC }}) {
                            edges {
                                screenTime
                                node {
                                    name
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
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.updateMovies?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 60,
                                node: {
                                    name: actor3,
                                },
                            },
                            {
                                screenTime: 100,
                                node: {
                                    name: actor2,
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: actor1,
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
