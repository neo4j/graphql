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

import { offsetToCursor } from "graphql-relay";
import type { Driver } from "neo4j-driver";
import { DocumentNode, graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { runCypher } from "../../utils/run-cypher";
import { cleanNodes } from "../../utils/clean-nodes";

describe("Relationship properties - read", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let bookmarks: string[];

    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typeDefs: DocumentNode;

    const movieTitle = generate({ charset: "alphabetic" });
    const actorA = `a${generate({ charset: "alphabetic" })}`;
    const actorB = `b${generate({ charset: "alphabetic" })}`;
    const actorC = `c${generate({ charset: "alphabetic" })}`;
    const actorD = `d${generate({ charset: "alphabetic" })}`;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        typeMovie = new UniqueType("Movie");
        typeActor = new UniqueType("Actor");

        const session = await neo4j.getSession();
        await runCypher(
            session,
            `
                CREATE (:${typeActor.name} { name: '${actorA}' })-[:ACTED_IN { screenTime: 105 }]->(m:${typeMovie.name} { title: '${movieTitle}'})
                CREATE (m)<-[:ACTED_IN { screenTime: 105 }]-(:${typeActor.name} { name: '${actorB}' })
                CREATE (m)<-[:ACTED_IN { screenTime: 5 }]-(:${typeActor.name} { name: '${actorC}' })
           `
        );

        typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
    });

    afterEach(async () => {
        const session = await neo4j.getSession();
        await cleanNodes(session, [typeMovie, typeActor]);
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.[typeMovie.plural]).toHaveLength(1);

            expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.totalCount).toBe(3);
            expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.pageInfo).toEqual({
                hasNextPage: false,
            });

            expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toHaveLength(3);
            expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toContainEqual({
                screenTime: 5,
                node: {
                    name: actorC,
                },
            });
            expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toContainEqual({
                screenTime: 105,
                node: {
                    name: actorB,
                },
            });
            expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toContainEqual({
                screenTime: 105,
                node: {
                    name: actorA,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("With `where` argument", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(
                        where: { AND: [{ edge: { screenTime_GT: 60 } }, { node: { name_STARTS_WITH: "a" } }] }
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.[typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 1,
                        edges: [
                            {
                                cursor: offsetToCursor(0),
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ConnectionWithSort($nameSort: SortDirection) {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(
                        sort: [{ edge: { screenTime: DESC } }, { node: { name: $nameSort } }]
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: { nameSort: "ASC" },
            });

            expect(ascResult.errors).toBeFalsy();

            expect(ascResult?.data?.[typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 3,
                        edges: [
                            {
                                cursor: offsetToCursor(0),
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                            {
                                cursor: offsetToCursor(1),
                                screenTime: 105,
                                node: {
                                    name: actorB,
                                },
                            },
                            {
                                cursor: offsetToCursor(2),
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: { nameSort: "DESC" },
            });

            expect(descResult.errors).toBeFalsy();

            expect(descResult?.data?.[typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        totalCount: 3,
                        edges: [
                            {
                                cursor: offsetToCursor(0),
                                screenTime: 105,
                                node: {
                                    name: actorB,
                                },
                            },
                            {
                                cursor: offsetToCursor(1),
                                screenTime: 105,
                                node: {
                                    name: actorA,
                                },
                            },
                            {
                                cursor: offsetToCursor(2),
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

    test("With `sort` argument ordered", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${typeMovie.plural} {
                    actorsConnection(
                        sort: [{ edge: { screenTime: DESC } }, { node: { name: ASC } }]
                    ) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const queryReverse = `
            query {
                ${typeMovie.plural} {
                    actorsConnection(
                        sort: [{ node: { name: ASC } }, { edge: { screenTime: DESC } }]
                    ) {
                        edges {
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

            await session.run(
                `
                    MATCH (m:${typeMovie.name} { title: '${movieTitle}'})
                    CREATE (m)<-[:ACTED_IN { screenTime: 106 }]-(:${typeActor.name} { name: '${actorD}' })
                `
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.[typeMovie.plural]).toEqual([
                {
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 106,
                                node: {
                                    name: actorD,
                                },
                            },
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
                            {
                                screenTime: 5,
                                node: {
                                    name: actorC,
                                },
                            },
                        ],
                    },
                },
            ]);

            const reverseResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: queryReverse,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(reverseResult.errors).toBeFalsy();

            expect(reverseResult?.data?.[typeMovie.plural]).toEqual([
                {
                    actorsConnection: {
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
                            {
                                screenTime: 5,
                                node: {
                                    name: actorC,
                                },
                            },
                            {
                                screenTime: 106,
                                node: {
                                    name: actorD,
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ConnectionWithSort($nameSort: SortDirection) {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection(
                        where: { edge: { screenTime_GT: 60 } }
                        sort: [{ node: { name: $nameSort } }]
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: { nameSort: "ASC" },
            });

            expect(ascResult.errors).toBeFalsy();

            expect(ascResult?.data?.[typeMovie.plural]).toEqual([
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                variableValues: { nameSort: "DESC" },
            });

            expect(descResult.errors).toBeFalsy();

            expect(descResult?.data?.[typeMovie.plural]).toEqual([
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
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${typeActor.plural}(where: { name: "${actorA}" }) {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.[typeActor.plural]).toHaveLength(1);
            expect((result?.data as any)?.[typeActor.plural][0].name).toEqual(actorA);

            expect((result?.data as any)?.[typeActor.plural][0].movies).toHaveLength(1);

            expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toHaveLength(3);
            expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
                screenTime: 5,
                node: {
                    name: actorC,
                },
            });
            expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
                screenTime: 105,
                node: {
                    name: actorB,
                },
            });
            expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
                screenTime: 105,
                node: {
                    name: actorA,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("Projecting a connection from a relationship with `where` argument", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${typeActor.plural}(where: { name: "${actorA}" }) {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
            });

            expect(result.errors).toBeFalsy();

            expect((result?.data as any)?.[typeActor.plural]).toHaveLength(1);
            expect((result?.data as any)?.[typeActor.plural][0].name).toEqual(actorA);

            expect((result?.data as any)?.[typeActor.plural][0].movies).toHaveLength(1);

            expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toHaveLength(2);
            expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
                screenTime: 5,
                node: {
                    name: actorC,
                },
            });
            expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
                screenTime: 105,
                node: {
                    name: actorB,
                },
            });
        } finally {
            await session.close();
        }
    });
});
