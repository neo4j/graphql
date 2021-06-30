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
    const actorA = `a${generate({ charset: "alphabetic" })}`;
    const actorB = `b${generate({ charset: "alphabetic" })}`;
    const actorC = `c${generate({ charset: "alphabetic" })}`;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `CREATE (:Actor { name: '${actorA}' })-[:ACTED_IN { screenTime: 105 }]->(:Movie { title: '${movieTitle}'})`
            );
            // Another couple of actors to test sorting and filtering
            await session.run(
                `MATCH (m:Movie) WHERE m.title = '${movieTitle}' CREATE (m)<-[:ACTED_IN { screenTime: 105 }]-(:Actor { name: '${actorB}' })`
            );
            await session.run(
                `MATCH (m:Movie) WHERE m.title = '${movieTitle}' CREATE (m)<-[:ACTED_IN { screenTime: 5 }]-(:Actor { name: '${actorC}' })`
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run(`MATCH (a:Actor) WHERE a.name = '${actorA}' DETACH DELETE a`);
            await session.run(`MATCH (a:Actor) WHERE a.name = '${actorB}' DETACH DELETE a`);
            await session.run(`MATCH (a:Actor) WHERE a.name = '${actorC}' DETACH DELETE a`);
            await session.run(`MATCH (m:Movie) WHERE m.title = '${movieTitle}' DETACH DELETE m`);
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                movies(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection {
                        totalCount
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                        pageInfo {
                            hasNextPage
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
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 3,
                        edges: [
                            {
                                screenTime: 5,
                                node: {
                                    name: actorC,
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: actorB,
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                        ],
                        pageInfo: {
                            hasNextPage: false,
                        },
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With `where` argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                movies(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(
                        where: { AND: [{ relationship: { screenTime_GT: 60 } }, { node: { name_STARTS_WITH: "a" } }] }
                    ) {
                        totalCount
                        edges {
                            cursor
                            screenTime
                            node {
                                name
                            }
                        }
                        pageInfo {
                            hasNextPage
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
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 1,
                        edges: [
                            {
                                cursor: "YXJyYXljb25uZWN0aW9uOjA=",
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                        ],
                        pageInfo: {
                            hasNextPage: false,
                        },
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With `sort` argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ConnectionWithSort($nameSort: SortDirection) {
                movies(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(
                        options: { sort: [{ relationship: { screenTime: DESC } }, { node: { name: $nameSort } }] }
                    ) {
                        totalCount
                        edges {
                            cursor
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const ascResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "ASC" },
            });

            expect(ascResult.errors).toBeFalsy();

            expect(ascResult?.data?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 3,
                        edges: [
                            {
                                cursor: "YXJyYXljb25uZWN0aW9uOjA=",
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                            {
                                cursor: "YXJyYXljb25uZWN0aW9uOjE=",
                                screenTime: 105,
                                node: {
                                    name: actorB,
                                },
                            },
                            {
                                cursor: "YXJyYXljb25uZWN0aW9uOjI=",
                                screenTime: 5,
                                node: {
                                    name: actorC,
                                },
                            },
                        ],
                    },
                },
            ]);

            const descResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "DESC" },
            });

            expect(descResult.errors).toBeFalsy();

            expect(descResult?.data?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 3,
                        edges: [
                            {
                                cursor: "YXJyYXljb25uZWN0aW9uOjA=",
                                screenTime: 105,
                                node: {
                                    name: actorB,
                                },
                            },
                            {
                                cursor: "YXJyYXljb25uZWN0aW9uOjE=",
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                            {
                                cursor: "YXJyYXljb25uZWN0aW9uOjI=",
                                screenTime: 5,
                                node: {
                                    name: actorC,
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

    test("With `where` and `sort` arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ConnectionWithSort($nameSort: SortDirection) {
                movies(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(
                        where: { relationship: { screenTime_GT: 60 } }
                        options: { sort: [{ node: { name: $nameSort } }] }
                    ) {
                        totalCount
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const ascResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "ASC" },
            });

            expect(ascResult.errors).toBeFalsy();

            expect(ascResult?.data?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 2,
                        edges: [
                            {
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: actorB,
                                },
                            },
                        ],
                        pageInfo: {
                            hasNextPage: false,
                        },
                    },
                },
            ]);

            const descResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "DESC" },
            });

            expect(descResult.errors).toBeFalsy();

            expect(descResult?.data?.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 2,
                        edges: [
                            {
                                screenTime: 105,
                                node: {
                                    name: actorB,
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                        ],
                        pageInfo: {
                            hasNextPage: false,
                        },
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting a connection from a relationship with no argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                actors(where: { name: "${actorA}" }) {
                    name
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
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorA,
                    movies: [
                        {
                            title: movieTitle,
                            actorsConnection: {
                                edges: [
                                    {
                                        screenTime: 5,
                                        node: {
                                            name: actorC,
                                        },
                                    },
                                    {
                                        screenTime: 105,
                                        node: {
                                            name: actorB,
                                        },
                                    },
                                    {
                                        screenTime: 105,
                                        node: {
                                            name: actorA,
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Projecting a connection from a relationship with `where` argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                actors(where: { name: "${actorA}" }) {
                    name
                    movies {
                        title
                        actorsConnection(where: { node: { name_NOT: "${actorA}" } }) {
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
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.actors).toEqual([
                {
                    name: actorA,
                    movies: [
                        {
                            title: movieTitle,
                            actorsConnection: {
                                edges: [
                                    {
                                        screenTime: 5,
                                        node: {
                                            name: actorC,
                                        },
                                    },
                                    {
                                        screenTime: 105,
                                        node: {
                                            name: actorB,
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
