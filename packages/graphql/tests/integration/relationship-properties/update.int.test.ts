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
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Relationship properties - read", () => {
    let driver: Driver;
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
    const movieTitle = generate({ charset: "alphabetic" });
    const actor1 = generate({ charset: "alphabetic" });
    const actor2 = generate({ charset: "alphabetic" });
    const actor3 = generate({ charset: "alphabetic" });

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(async () => {
        const session = driver.session();

        try {
            await session.run(
                `CREATE (:Actor { name: '${actor1}' })-[:ACTED_IN { screenTime: 105 }]->(:Movie { title: '${movieTitle}'})`
            );
            await session.run(
                `MATCH (m:Movie) WHERE m.title = '${movieTitle}' CREATE (m)<-[:ACTED_IN { screenTime: 105 }]-(:Actor { name: '${actor2}' })`
            );
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        const session = driver.session();

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
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    update: { actors: [{ where: { node: { name: "${actor1}" } }, update: { relationship: { screenTime: 60 } } }] }
                ) {
                    movies {
                        title
                        actorsConnection {
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
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.updateMovies?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 105,
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
        const session = driver.session();

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
                                    relationship: { screenTime: 60 }
                                    node: { name: "${actor3}" }
                                }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
                        actorsConnection {
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
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.updateMovies?.movies).toEqual([
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
        const session = driver.session();

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
                                    relationship: { screenTime: 60 }
                                }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
                        actorsConnection {
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
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.updateMovies?.movies).toEqual([
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
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const mutation = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    create: {
                        actors: [
                            {
                                node: { name: "${actor3}" }
                                relationship: { screenTime: 60 }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
                        actorsConnection {
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
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.updateMovies?.movies).toEqual([
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
