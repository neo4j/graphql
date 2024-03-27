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

import type { DocumentNode } from "graphql";
import { offsetToCursor } from "graphql-relay";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Relationship properties - read", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typeDefs: DocumentNode;

    const movieTitle = generate({ charset: "alphabetic" });
    const actorA = `a${generate({ charset: "alphabetic" })}`;
    const actorB = `b${generate({ charset: "alphabetic" })}`;
    const actorC = `c${generate({ charset: "alphabetic" })}`;
    const actorD = `d${generate({ charset: "alphabetic" })}`;

    beforeEach(async () => {
        typeMovie = new UniqueType("Movie");
        typeActor = new UniqueType("Actor");

        await testHelper.executeCypher(
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

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    actorsConnection {
                        totalCount
                        edges {
                            properties {
                                screenTime
                            }
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)?.[typeMovie.plural]).toHaveLength(1);

        expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.totalCount).toBe(3);
        expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.pageInfo).toEqual({
            hasNextPage: false,
        });

        expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toHaveLength(3);
        expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 5 },
            node: {
                name: actorC,
            },
        });
        expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 105 },
            node: {
                name: actorB,
            },
        });
        expect((result?.data as any)?.[typeMovie.plural][0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 105 },
            node: {
                name: actorA,
            },
        });
    });

    test("With `where` argument", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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
                            properties {
                                screenTime
                            }
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)?.[typeMovie.plural]).toEqual([
            {
                title: movieTitle,
                actorsConnection: {
                    totalCount: 1,
                    edges: [
                        {
                            cursor: offsetToCursor(0),
                            properties: { screenTime: 105 },
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
    });

    test("With `sort` argument", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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
                            properties {
                                screenTime
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const ascResult = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: 105 },
                            node: {
                                name: actorA,
                            },
                        },
                        {
                            cursor: offsetToCursor(1),
                            properties: { screenTime: 105 },
                            node: {
                                name: actorB,
                            },
                        },
                        {
                            cursor: offsetToCursor(2),
                            properties: { screenTime: 5 },
                            node: {
                                name: actorC,
                            },
                        },
                    ],
                },
            },
        ]);

        const descResult = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: 105 },
                            node: {
                                name: actorB,
                            },
                        },
                        {
                            cursor: offsetToCursor(1),
                            properties: { screenTime: 105 },
                            node: {
                                name: actorA,
                            },
                        },
                        {
                            cursor: offsetToCursor(2),
                            properties: { screenTime: 5 },
                            node: {
                                name: actorC,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("With `sort` argument ordered", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${typeMovie.plural} {
                    actorsConnection(
                        sort: [{ edge: { screenTime: DESC } }, { node: { name: ASC } }]
                    ) {
                        edges {
                            properties {
                                screenTime
                            }
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
                            properties {
                                screenTime
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        await testHelper.executeCypher(
            `
                    MATCH (m:${typeMovie.name} { title: '${movieTitle}'})
                    CREATE (m)<-[:ACTED_IN { screenTime: 106 }]-(:${typeActor.name} { name: '${actorD}' })
                `
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)?.[typeMovie.plural]).toEqual([
            {
                actorsConnection: {
                    edges: [
                        {
                            properties: { screenTime: 106 },
                            node: {
                                name: actorD,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
                            node: {
                                name: actorA,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
                            node: {
                                name: actorB,
                            },
                        },
                        {
                            properties: { screenTime: 5 },
                            node: {
                                name: actorC,
                            },
                        },
                    ],
                },
            },
        ]);

        const reverseResult = await testHelper.executeGraphQL(queryReverse);

        expect(reverseResult.errors).toBeFalsy();

        expect(reverseResult?.data?.[typeMovie.plural]).toEqual([
            {
                actorsConnection: {
                    edges: [
                        {
                            properties: { screenTime: 105 },
                            node: {
                                name: actorA,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
                            node: {
                                name: actorB,
                            },
                        },
                        {
                            properties: { screenTime: 5 },
                            node: {
                                name: actorC,
                            },
                        },
                        {
                            properties: { screenTime: 106 },
                            node: {
                                name: actorD,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("With `where` and `sort` arguments", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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
                            properties {
                                screenTime
                            }
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

        await neoSchema.checkNeo4jCompat();

        const ascResult = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: 105 },
                            node: {
                                name: actorA,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
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

        const descResult = await testHelper.executeGraphQL(query, {
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
                            properties: { screenTime: 105 },
                            node: {
                                name: actorB,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
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
    });

    test("Projecting a connection from a relationship with no argument", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${typeActor.plural}(where: { name: "${actorA}" }) {
                    name
                    movies {
                        title
                        actorsConnection {
                            edges {
                               properties {
                                 screenTime
                               }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)?.[typeActor.plural]).toHaveLength(1);
        expect((result?.data as any)?.[typeActor.plural][0].name).toEqual(actorA);

        expect((result?.data as any)?.[typeActor.plural][0].movies).toHaveLength(1);

        expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toHaveLength(3);
        expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 5 },
            node: {
                name: actorC,
            },
        });
        expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 105 },
            node: {
                name: actorB,
            },
        });
        expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 105 },
            node: {
                name: actorA,
            },
        });
    });

    test("Projecting a connection from a relationship with `where` argument", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${typeActor.plural}(where: { name: "${actorA}" }) {
                    name
                    movies {
                        title
                        actorsConnection(where: { node: { name_NOT: "${actorA}" } }) {
                            edges {
                               properties {
                                 screenTime
                               }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)?.[typeActor.plural]).toHaveLength(1);
        expect((result?.data as any)?.[typeActor.plural][0].name).toEqual(actorA);

        expect((result?.data as any)?.[typeActor.plural][0].movies).toHaveLength(1);

        expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toHaveLength(2);
        expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 5 },
            node: {
                name: actorC,
            },
        });
        expect((result?.data as any)?.[typeActor.plural][0].movies[0].actorsConnection.edges).toContainEqual({
            properties: { screenTime: 105 },
            node: {
                name: actorB,
            },
        });
    });
});
