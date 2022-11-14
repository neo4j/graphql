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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("Relationship properties - connect", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    const movieTitle = "A movie title";
    const showTitle = "some-show";
    const actorName1 = "An Actor";
    const actorName2 = "Name";
    const screenTime1 = 321;
    const screenTime2 = 2;
    const nonExistantMovie = "Does not exist";
    const nonExistantActor = "Not an actor";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Regular Nodes", () => {
        let movieType: UniqueType;
        let actorType: UniqueType;
        let actedInInterface: UniqueType;
        let typeDefs: string;

        beforeEach(() => {
            movieType = generateUniqueType("Movie");
            actorType = generateUniqueType("Actor");
            actedInInterface = generateUniqueType("ActedIn");

            typeDefs = `
                type ${movieType.name} {
                    title: String!
                    actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", properties: "${actedInInterface.name}", direction: IN)
                }

                type ${actorType.name} {
                    name: String!
                    movies: [${movieType.name}!]! @relationship(type: "ACTED_IN", properties: "${actedInInterface.name}", direction: OUT)
                }

                interface ${actedInInterface.name} {
                    screenTime: Int!
                }
            `;
        });

        afterEach(async () => {
            const session = await neo4j.getSession();

            try {
                await session.run(`
                    MATCH (movies:${movieType.name})
                    MATCH (actors:${actorType.name})
                    DETACH DELETE movies, actors
                `);
            } finally {
                await session.close();
            }
        });

        describe("Create mutations", () => {
            test("should create a movie while connecting a relationship that has properties", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${movieType.operations.create}(
                            input: [
                                {
                                    title: $movieTitle
                                    actors: {
                                        connect: {
                                            where: { node: { name: $actorName } },
                                            edge: { screenTime: $screenTime },
                                        }
                                    }
                                }
                            ]
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${actorType.name} {name:$actorName})
                        `,
                        { actorName: actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime: screenTime1 },
                    });

                    const cypher = `
                        MATCH (m:${movieType.name} {title: $movieTitle})
                                <-[:ACTED_IN {screenTime: $screenTime}]-
                                    (:${actorType.name} {name: $actorName})
                        RETURN m
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect((gqlResult.data as any)?.[movieType.operations.create][movieType.plural]).toEqual([
                        {
                            title: movieTitle,
                            actorsConnection: { edges: [{ screenTime: screenTime1, node: { name: actorName1 } }] },
                        },
                    ]);

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should not create duplicate relationships when asDuplicate false", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime1: Int!, $screenTime2: Int!, $actorName: String!) {
                        ${movieType.operations.create}(
                            input: [
                                {
                                    title: $movieTitle
                                    actors: {
                                        connect: [
                                            {
                                                where: { node: { name: $actorName } },
                                                edge: { screenTime: $screenTime1 },
                                            },
                                            {
                                                asDuplicate: false,
                                                where: { node: { name: $actorName } },
                                                edge: { screenTime: $screenTime2 },
                                            }
                                        ]
                                    }
                                }
                            ]
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime1, screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.create]: {
                            [movieType.plural]: [
                                {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships when asDuplicate true", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime1: Int!, $screenTime2: Int!, $actorName: String!) {
                        ${movieType.operations.create}(
                            input: [
                                {
                                    title: $movieTitle
                                    actors: {
                                        connect: [
                                            {
                                                asDuplicate: false,
                                                where: { node: { name: $actorName } },
                                                edge: { screenTime: $screenTime1 },
                                            },
                                            {
                                                asDuplicate: true,
                                                where: { node: { name: $actorName } },
                                                edge: { screenTime: $screenTime2 },
                                            }
                                        ]
                                    }
                                }
                            ]
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime1, screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.create]: {
                            [movieType.plural]: [
                                {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(2);
                } finally {
                    await session.close();
                }
            });
        });

        describe("Update mutations", () => {
            test("should update a movie while connecting a relationship that has properties", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${movieType.operations.update}(
                            where: { title: $movieTitle }
                            connect: {
                                actors: {
                                    where: { node: { name: $actorName } }
                                    edge: { screenTime: $screenTime }
                                }
                            }
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${movieType.name} {title:$movieTitle})
                            CREATE (:${actorType.name} {name:$actorName})
                        `,
                        { movieTitle, actorName: actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime: screenTime1 },
                    });

                    const cypher = `
                        MATCH (m:${movieType.name} {title: $movieTitle})
                                <-[:ACTED_IN {screenTime: $screenTime}]-
                                    (:${actorType.name} {name: $actorName})
                        RETURN m
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect((gqlResult.data as any)?.[movieType.operations.update][movieType.plural]).toEqual([
                        {
                            title: movieTitle,
                            actorsConnection: { edges: [{ screenTime: screenTime1, node: { name: actorName1 } }] },
                        },
                    ]);

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships with a single connect when asDuplicate true", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${movieType.operations.update}(
                            where: { title: $movieTitle }
                            connect: {
                                actors: {
                                    asDuplicate: true
                                    where: { node: { name: $actorName } }
                                    edge: { screenTime: $screenTime }
                                }
                            }
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.update]: {
                            [movieType.plural]: [
                                {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(2);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships when asDuplicate true on one of multiple connects", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $actorName1: String!, $screenTime2: Int!, $actorName2: String!) {
                        ${movieType.operations.update}(
                            where: { title: $movieTitle }
                            connect: {
                                actors: [
                                    {
                                        asDuplicate: true
                                        where: { node: { name: $actorName1 } }
                                        edge: { screenTime: $screenTime2 }
                                    },
                                    {
                                        asDuplicate: false
                                        where: { node: { name: $actorName2 } }
                                        edge: { screenTime: $screenTime2 }
                                    }
                                ]
                            }
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(:${actorType.name} { name: $actorName1 })
                            CREATE (:${actorType.name} { name: $actorName2 })
                        `,
                        { movieTitle, screenTime1, actorName1, actorName2 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName1, actorName2, screenTime1, screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name})<-[r:ACTED_IN]-(:${actorType.name})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.update]: {
                            [movieType.plural]: [
                                {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName2,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(3);
                } finally {
                    await session.close();
                }
            });

            test("should create a single relationship with no existing relationships when asDuplicate true", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${movieType.operations.update}(
                            where: { title: $movieTitle }
                            connect: {
                                actors: {
                                    asDuplicate: true
                                    where: { node: { name: $actorName } }
                                    edge: { screenTime: $screenTime }
                                }
                            }
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })
                            CREATE (:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.update]: {
                            [movieType.plural]: [
                                {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships when asDuplicate true on all of multiple connects", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $actorName1: String!, $screenTime2: Int!, $actorName2: String!) {
                        ${movieType.operations.update}(
                            where: { title: $movieTitle }
                            connect: {
                                actors: [
                                    {
                                        asDuplicate: true
                                        where: { node: { name: $actorName1 } }
                                        edge: { screenTime: $screenTime2 }
                                    },
                                    {
                                        asDuplicate: true
                                        where: { node: { name: $actorName2 } }
                                        edge: { screenTime: $screenTime2 }
                                    },
                                    {
                                        asDuplicate: true
                                        where: { node: { name: $actorName2 } }
                                        edge: { screenTime: $screenTime2 }
                                    }
                                ]
                            }
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(:${actorType.name} { name: $actorName1 })
                            CREATE (:${actorType.name} { name: $actorName2 })
                        `,
                        { movieTitle, screenTime1, actorName1, actorName2 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName1, actorName2, screenTime1, screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name})<-[r:ACTED_IN]-(:${actorType.name})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.update]: {
                            [movieType.plural]: [
                                {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName1,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName2,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: actorName2,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(4);
                } finally {
                    await session.close();
                }
            });

            test("should not create connection if start node does not exist", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${movieType.operations.update}(
                            where: { title: $movieTitle }
                            connect: {
                                actors: {
                                    asDuplicate: true
                                    where: { node: { name: $actorName } }
                                    edge: { screenTime: $screenTime }
                                }
                            }
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })
                            CREATE (:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: {
                            movieTitle: nonExistantMovie,
                            actorName: actorName1,
                            screenTime: screenTime2,
                        },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.update]: {
                            [movieType.plural]: [],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(0);
                } finally {
                    await session.close();
                }
            });

            test("should not create connection if end node does not already exist", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${movieType.operations.update}(
                            where: { title: $movieTitle }
                            connect: {
                                actors: {
                                    asDuplicate: true
                                    where: { node: { name: $actorName } }
                                    edge: { screenTime: $screenTime }
                                }
                            }
                        ) {
                            ${movieType.plural} {
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
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })
                            CREATE (:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: nonExistantActor, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [movieType.operations.update]: {
                            [movieType.plural]: [
                                {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: [],
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(0);
                } finally {
                    await session.close();
                }
            });
        });
    });

    describe("Unions", () => {
        let movieType: UniqueType;
        let actorType: UniqueType;
        let showType: UniqueType;
        let actedInInterface: UniqueType;
        let actedInUnion: UniqueType;
        let typeDefs: string;

        beforeEach(() => {
            movieType = generateUniqueType("Movie");
            actorType = generateUniqueType("Actor");
            showType = generateUniqueType("Show");
            actedInInterface = generateUniqueType("ActedIn");
            actedInUnion = generateUniqueType("ActedInUnion");

            typeDefs = `
                type ${movieType.name} {
                    title: String!
                }

                type ${showType.name} {
                    name: String!
                }

                type ${actorType.name} {
                    name: String!
                    actedIn: [${actedInUnion.name}!]!
                        @relationship(type: "ACTED_IN", properties: "${actedInInterface.name}", direction: OUT)
                }

                union ${actedInUnion.name} = ${movieType.name} | ${showType.name}

                interface ${actedInInterface.name} {
                    screenTime: Int!
                }
            `;
        });

        afterEach(async () => {
            const session = await neo4j.getSession();

            try {
                await session.run(`
                    MATCH (movies:${movieType.name})
                    MATCH (shows:${showType.name})
                    MATCH (actors:${actorType.name})
                    DETACH DELETE movies, shows, actors
                `);
            } finally {
                await session.close();
            }
        });

        describe("Create mutations", () => {
            test("should create an actor while connecting a relationship that has properties", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.create}(input: [{
                            name: $actorName,
                            actedIn: {
                                ${movieType.name}: {
                                    connect: {
                                        where: {
                                            node: { title: $movieTitle }
                                        },
                                        edge: {
                                            screenTime: $screenTime
                                        }
                                    }
                                }
                            }
                        }]) {
                            ${actorType.plural} {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                        CREATE (:${movieType.name} {title:$movieTitle})
                    `,
                        { movieTitle }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime: screenTime1 },
                    });

                    const cypher = `
                        MATCH (a:${actorType.name} {name: $actorName})
                                -[:ACTED_IN {screenTime: $screenTime}]->
                                    (:${movieType.name} {title: $movieTitle})
                        RETURN a
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect((gqlResult.data as any)?.[actorType.operations.create][actorType.plural]).toEqual([
                        {
                            name: actorName1,
                        },
                    ]);

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should not create duplicate relationships when asDuplicate false", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime1: Int!, $screenTime2: Int!, $actorName: String!) {
                        ${actorType.operations.create}(input: [{
                            name: $actorName,
                            actedIn: {
                                ${movieType.name}: {
                                    connect: [
                                        {
                                            where: {
                                                node: { title: $movieTitle }
                                            },
                                            edge: {
                                                screenTime: $screenTime1
                                            }
                                        },
                                        {
                                            asDuplicate: false
                                            where: {
                                                node: { title: $movieTitle }
                                            },
                                            edge: {
                                                screenTime: $screenTime2
                                            }
                                        },
                                        {
                                            where: {
                                                node: { title: $movieTitle }
                                            },
                                            edge: {
                                                screenTime: $screenTime1
                                            }
                                        }
                                    ]
                                }
                            }
                        }]) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })
                        `,
                        { movieTitle }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime1, screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.create]: {
                            [actorType.plural]: [
                                {
                                    name: actorName1,
                                    actedInConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships when asDuplicate true", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime1: Int!, $screenTime2: Int!, $actorName: String!) {
                        ${actorType.operations.create}(input: [{
                            name: $actorName,
                            actedIn: {
                                ${movieType.name}: {
                                    connect: [
                                        {
                                            where: {
                                                node: { title: $movieTitle }
                                            },
                                            edge: {
                                                screenTime: $screenTime1
                                            }
                                        },
                                        {
                                            asDuplicate: true
                                            where: {
                                                node: { title: $movieTitle }
                                            },
                                            edge: {
                                                screenTime: $screenTime2
                                            }
                                        },
                                        {
                                            asDuplicate: true
                                            where: {
                                                node: { title: $movieTitle }
                                            },
                                            edge: {
                                                screenTime: $screenTime1
                                            }
                                        }
                                    ]
                                }
                            }
                        }]) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })
                        `,
                        { movieTitle }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime1, screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.create]: {
                            [actorType.plural]: [
                                {
                                    name: actorName1,
                                    actedInConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(3);
                } finally {
                    await session.close();
                }
            });
        });

        describe("Update mutations", () => {
            test("should update an actor while connecting a relationship that has properties", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.update}(
                            where: { name: $actorName }
                            connect: {
                                actedIn: {
                                    ${movieType.name}: {
                                        where: { node: { title: $movieTitle } }
                                        edge: { screenTime: $screenTime }
                                    }
                                }
                            }
                        ) {
                            ${actorType.plural} {
                                name
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} {title:$movieTitle})
                            CREATE (:${actorType.name} {name:$actorName})
                        `,
                        { movieTitle, actorName: actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime: screenTime1 },
                    });

                    const cypher = `
                        MATCH (a:${actorType.name} {name: $actorName})
                                -[:ACTED_IN {screenTime: $screenTime}]->
                                    (:${movieType.name} {title: $movieTitle})
                        RETURN a
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect((gqlResult.data as any)?.[actorType.operations.update][actorType.plural]).toEqual([
                        {
                            name: actorName1,
                        },
                    ]);

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships with a single connect when asDuplicate true", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.update}(
                            where: { name: $actorName }
                            connect: {
                                actedIn: {
                                    ${movieType.name}: {
                                        asDuplicate: true
                                        where: { node: { title: $movieTitle } }
                                        edge: { screenTime: $screenTime }
                                    }
                                }
                            }
                        ) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: actorName1, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH (:${movieType.name} {title: $movieTitle})<-[r:ACTED_IN]-(:${actorType.name} {name: $actorName})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher, {
                        movieTitle,
                        screenTime: screenTime1,
                        actorName: actorName1,
                    });

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.update]: {
                            [actorType.plural]: [
                                {
                                    name: actorName1,
                                    actedInConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(2);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships when asDuplicate true on one of multiple connects", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $showTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.update}(
                            where: { name: $actorName }
                            connect: {
                                actedIn: {
                                    ${movieType.name}: {
                                        asDuplicate: false
                                        where: { node: { title: $movieTitle } }
                                        edge: { screenTime: $screenTime }
                                    }
                                    ${showType.name}: {
                                        asDuplicate: true
                                        where: { node: { name: $showTitle } }
                                        edge: { screenTime: $screenTime }
                                    }
                                }
                            }
                        ) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                            ... on ${showType.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(a:${actorType.name} { name: $actorName1 })
                            CREATE (:${showType.name} { name: $showTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(a)
                        `,
                        { movieTitle, showTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, showTitle, actorName: actorName1, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH ()<-[r:ACTED_IN]-(:${actorType.name})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher);

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.update]: {
                            [actorType.plural]: [
                                {
                                    name: actorName1,
                                    actedInConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    name: showTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: showTitle,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(3);
                } finally {
                    await session.close();
                }
            });

            test("should create a single relationship with no existing relationships when asDuplicate true", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.update}(
                            where: { name: $actorName }
                            connect: {
                                actedIn: {
                                    ${movieType.name}: {
                                        asDuplicate: true
                                        where: { node: { title: $movieTitle } }
                                        edge: { screenTime: $screenTime }
                                    }
                                }
                            }
                        ) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })
                            CREATE (:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, showTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, showTitle, actorName: actorName1, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH ()<-[r:ACTED_IN]-(:${actorType.name})
                        RETURN r
                    `;
                    const neo4jResult = await session.run(cypher);

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.update]: {
                            [actorType.plural]: [
                                {
                                    name: actorName1,
                                    actedInConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });

            test("should create duplicate relationships when asDuplicate true on all of multiple connects", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $showTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.update}(
                            where: { name: $actorName }
                            connect: {
                                actedIn: {
                                    ${movieType.name}: [
                                        {
                                            asDuplicate: true
                                            where: { node: { title: $movieTitle } }
                                            edge: { screenTime: $screenTime }
                                        },
                                        {
                                            asDuplicate: true
                                            where: { node: { title: $movieTitle } }
                                            edge: { screenTime: $screenTime }
                                        }
                                    ]
                                    ${showType.name}: {
                                        asDuplicate: true
                                        where: { node: { name: $showTitle } }
                                        edge: { screenTime: $screenTime }
                                    }
                                }
                            }
                        ) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                            ... on ${showType.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(a:${actorType.name} { name: $actorName1 })
                            CREATE (:${showType.name} { name: $showTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(a)
                        `,
                        { movieTitle, showTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, showTitle, actorName: actorName1, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH ()<-[r:ACTED_IN]-(:${actorType.name})
                        RETURN r
                    `;

                    const neo4jResult = await session.run(cypher);

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.update]: {
                            [actorType.plural]: [
                                {
                                    name: actorName1,
                                    actedInConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    name: showTitle,
                                                },
                                            },
                                            {
                                                screenTime: screenTime2,
                                                node: {
                                                    name: showTitle,
                                                },
                                            },
                                        ]),
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(5);
                } finally {
                    await session.close();
                }
            });

            test("should not create connection if start node does not exist", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.update}(
                            where: { name: $actorName }
                            connect: {
                                actedIn: {
                                    ${movieType.name}: [
                                        {
                                            asDuplicate: true
                                            where: { node: { title: $movieTitle } }
                                            edge: { screenTime: $screenTime }
                                        },
                                    ]
                                }
                            }
                        ) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                            ... on ${showType.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })
                            CREATE (:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: { movieTitle, actorName: nonExistantActor, screenTime: screenTime2 },
                    });

                    const cypher = `
                        MATCH ()<-[r:ACTED_IN]-(:${actorType.name})
                        RETURN r
                    `;

                    const neo4jResult = await session.run(cypher);

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.update]: {
                            [actorType.plural]: [],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(0);
                } finally {
                    await session.close();
                }
            });

            test("should not create connection if end node does not exist", async () => {
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                const session = await neo4j.getSession();

                const source = `
                    mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                        ${actorType.operations.update}(
                            where: { name: $actorName }
                            connect: {
                                actedIn: {
                                    ${movieType.name}: [
                                        {
                                            asDuplicate: true
                                            where: { node: { title: $movieTitle } }
                                            edge: { screenTime: $screenTime }
                                        },
                                    ]
                                }
                            }
                        ) {
                            ${actorType.plural} {
                                name
                                actedInConnection {
                                    edges {
                                        screenTime
                                        node {
                                            ... on ${movieType.name} {
                                                title
                                            }
                                            ... on ${showType.name} {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                            CREATE (:${movieType.name} { title: $movieTitle })<-[:ACTED_IN { screenTime: $screenTime1 } ]-(:${actorType.name} { name: $actorName1 })
                        `,
                        { movieTitle, screenTime1, actorName1 }
                    );

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source,
                        contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                        variableValues: {
                            movieTitle: nonExistantMovie,
                            actorName: actorName1,
                            screenTime: screenTime2,
                        },
                    });

                    const cypher = `
                        MATCH ()<-[r:ACTED_IN]-(:${actorType.name})
                        RETURN r
                    `;

                    const neo4jResult = await session.run(cypher);

                    expect(gqlResult.errors).toBeFalsy();
                    expect(gqlResult.data).toEqual({
                        [actorType.operations.update]: {
                            [actorType.plural]: [
                                {
                                    name: actorName1,
                                    actedInConnection: {
                                        edges: [
                                            {
                                                screenTime: screenTime1,
                                                node: {
                                                    title: movieTitle,
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    });

                    expect(neo4jResult.records).toHaveLength(1);
                } finally {
                    await session.close();
                }
            });
        });
    });
});
