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
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";

describe("interface relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let episodeType: UniqueType;
    let movieType: UniqueType;
    let seriesType: UniqueType;
    let actorType: UniqueType;
    let productionInterface: UniqueType;
    let actedInInterface: UniqueType;

    const actorName1 = "Some Actor";
    const actorName2 = "Another Name";
    const nonExistantActorName = "Doesn't exist";
    const movieTitle = "A Title";
    const nonExistantMovieTitle = "Not a move title";
    const movieRuntime = 123;
    const seriesTitle = "Another Title";
    const screenTime1 = 4019;
    const screenTime2 = 99;
    const screenTime3 = 3;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(() => {
        productionInterface = generateUniqueType("Production");
        episodeType = generateUniqueType("Episode");
        movieType = generateUniqueType("Movie");
        seriesType = generateUniqueType("Series");
        actedInInterface = generateUniqueType("ActedIn");
        actorType = generateUniqueType("Actor");

        const typeDefs = gql`
            type ${episodeType.name} {
                runtime: Int!
                series: ${seriesType.name}! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface ${productionInterface.name} {
                title: String!
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "${actedInInterface.name}")
            }

            type ${movieType.name} implements ${productionInterface.name} {
                title: String!
                runtime: Int!
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "${actedInInterface.name}")
            }

            type ${seriesType.name} implements ${productionInterface.name} {
                title: String!
                episodes: [${episodeType.name}!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "${actedInInterface.name}")
            }

            interface ${actedInInterface.name} @relationshipProperties {
                screenTime: Int!
            }

            type ${actorType.name} {
                name: String!
                actedIn: [${productionInterface.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "${actedInInterface.name}")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(`
                MATCH (episodes:${episodeType.name})
                MATCH (movies:${movieType.name})
                MATCH (series:${seriesType.name})
                MATCH (actors:${actorType.name})
                DETACH DELETE episodes, movies, series, actors
            `);
        } finally {
            await session.close();
        }
    });

    test("should connect using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name: String, $title: String, $screenTime: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name }
                    connect: { actedIn: { edge: { screenTime: $screenTime }, where: { node: { title: $title } } } }
                ) {
                    ${actorType.plural} {
                        name
                        actedIn {
                            title
                            ... on ${movieType.name} {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:${actorType.name} { name: $actorName })
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                {
                    actorName: actorName1,
                    movieTitle: movieTitle,
                    movieRuntime,
                    seriesTitle,
                    seriesScreenTime: screenTime2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: actorName1, title: movieTitle, screenTime: screenTime1 },
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
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                },
                                {
                                    title: seriesTitle,
                                },
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });

            expect(neo4jResult.records).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("should nested connect using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name1: String, $name2: String, $title: String, $screenTime: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name1 }
                    connect: {
                        actedIn: {
                            edge: { screenTime: $screenTime }
                            where: { node: { title: $title } }
                            connect: {
                                actors: { edge: { screenTime: $screenTime }, where: { node: { name: $name2 } } }
                            }
                        }
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedIn {
                            title
                            actors {
                                name
                            }
                            ... on ${movieType.name} {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:${actorType.name} { name: $actorName1 })
                CREATE (:${actorType.name} { name: $actorName2 })
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                {
                    actorName1,
                    actorName2,
                    movieTitle: movieTitle,
                    movieRuntime,
                    seriesTitle,
                    seriesScreenTime: screenTime2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    name2: actorName2,
                    title: movieTitle,
                    screenTime: screenTime1,
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
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.toIncludeSameMembers([{ name: actorName2 }, { name: actorName1 }]),
                                },
                                {
                                    title: seriesTitle,
                                    actors: [{ name: actorName1 }],
                                },
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });

            expect(neo4jResult.records).toHaveLength(3);
        } finally {
            await session.close();
        }
    });

    test("should nested connect using interface relationship fields using _on to only connect from certain nested type", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name1: String, $name2: String, $title: String, $screenTime: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name1 }
                    connect: {
                        actedIn: {
                            edge: { screenTime: $screenTime }
                            where: { node: { title: $title } }
                            connect: {
                                _on: {
                                    ${movieType.name}: {
                                        actors: { edge: { screenTime: $screenTime }, where: { node: { name: $name2 } } }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedIn {
                            __typename
                            title
                            actors {
                                name
                            }
                            ... on ${movieType.name} {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:${actorType.name} { name: $actorName1 })
                CREATE (:${actorType.name} { name: $actorName2 })
                CREATE (:${seriesType.name} { title: $movieTitle })
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                {
                    actorName1,
                    actorName2,
                    movieTitle: movieTitle,
                    movieRuntime,
                    seriesTitle,
                    seriesScreenTime: screenTime2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    name2: actorName2,
                    title: movieTitle,
                    screenTime: screenTime1,
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
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    __typename: movieType.name,
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.toIncludeSameMembers([{ name: actorName2 }, { name: actorName1 }]),
                                },
                                {
                                    __typename: seriesType.name,
                                    title: movieTitle,
                                    actors: [{ name: actorName1 }],
                                },
                                {
                                    __typename: seriesType.name,
                                    title: seriesTitle,
                                    actors: [{ name: actorName1 }],
                                },
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });

            expect(neo4jResult.records).toHaveLength(4);
        } finally {
            await session.close();
        }
    });

    test("should nested connect using interface relationship fields using where _on to only connect to certain type", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name1: String, $name2: String, $title: String, $screenTime: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name1 }
                    connect: {
                        actedIn: {
                            edge: { screenTime: $screenTime }
                            where: { node: { _on: { ${movieType.name}: { title: $title } } } }
                            connect: {
                                actors: { edge: { screenTime: $screenTime }, where: { node: { name: $name2 } } }
                            }
                        }
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedIn {
                            __typename
                            title
                            actors {
                                name
                            }
                            ... on ${movieType.name} {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:${actorType.name} { name: $actorName1 })
                CREATE (:${actorType.name} { name: $actorName2 })
                CREATE (:${seriesType.name} { title: $movieTitle })
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                {
                    actorName1,
                    actorName2,
                    movieTitle: movieTitle,
                    movieRuntime,
                    seriesTitle,
                    seriesScreenTime: screenTime2,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    name2: actorName2,
                    title: movieTitle,
                    screenTime: screenTime1,
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
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    __typename: movieType.name,
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.toIncludeSameMembers([{ name: actorName2 }, { name: actorName1 }]),
                                },
                                {
                                    __typename: seriesType.name,
                                    title: seriesTitle,
                                    actors: [{ name: actorName1 }],
                                },
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });

            expect(neo4jResult.records).toHaveLength(3);
        } finally {
            await session.close();
        }
    });

    test("should create duplicate relationships when using asDuplicate on a single connect value", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name: String, $title: String, $screenTime: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name }
                    connect: { 
                        actedIn: {
                            asDuplicate: true
                            edge: { screenTime: $screenTime }
                            where: { node: { title: $title } }
                        },
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedInConnection {
                            edges {
                                screenTime
                                node {
                                    title
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
                CREATE (a:${actorType.name} { name: $actorName })-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                { actorName: actorName1, seriesTitle, seriesScreenTime: screenTime2 }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: actorName1, title: seriesTitle, screenTime: screenTime1 },
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
                                            title: seriesTitle,
                                        },
                                    },
                                    {
                                        screenTime: screenTime1,
                                        node: {
                                            title: seriesTitle,
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

    test("should create duplicate relationships when asDuplicate true in all values in array of connect values", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name: String, $movieTitle: String, $seriesTitle: String, $screenTime2: Int!, $screenTime3: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name }
                    connect: {
                        actedIn: [
                            {
                                asDuplicate: true
                                edge: { screenTime: $screenTime3 }
                                where: { node: { title: $seriesTitle } }
                            },
                            {
                                asDuplicate: true
                                edge: { screenTime: $screenTime2 }
                                where: { node: { title: $movieTitle } }
                            },
                        ]
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedInConnection {
                            edges {
                                screenTime
                                node {
                                    title
                                    ... on ${movieType.name} {
                                        runtime
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
                CREATE (a:${actorType.name} { name: $actorName })-[:ACTED_IN { screenTime: $screenTime1 }]->(:${seriesType.name} { title: $seriesTitle })
                CREATE (:${movieType.name} { title: $movieTitle, runtime: $movieRuntime })
            `,
                { actorName: actorName1, seriesTitle, screenTime1, movieTitle: movieTitle, movieRuntime }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: actorName1, screenTime2, movieTitle, seriesTitle, screenTime3 },
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
                                            title: seriesTitle,
                                        },
                                    },
                                    {
                                        screenTime: screenTime2,
                                        node: {
                                            title: movieTitle,
                                            runtime: movieRuntime,
                                        },
                                    },
                                    {
                                        screenTime: screenTime3,
                                        node: {
                                            title: seriesTitle,
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

    test("should create duplicate relationships when asDuplicate true in some values in array of connect values", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name: String, $movieTitle: String, $seriesTitle: String, $screenTime2: Int!, $screenTime3: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name }
                    connect: {
                        actedIn: [
                            {
                                asDuplicate: true
                                edge: { screenTime: $screenTime3 }
                                where: { node: { title: $seriesTitle } }
                            },
                            {
                                asDuplicate: false
                                edge: { screenTime: $screenTime2 }
                                where: { node: { title: $movieTitle } }
                            },
                        ]
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedInConnection {
                            edges {
                                screenTime
                                node {
                                    title
                                    ... on ${movieType.name} {
                                        runtime
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
                CREATE (a:${actorType.name} { name: $actorName })-[:ACTED_IN { screenTime: $screenTime1 }]->(:${seriesType.name} { title: $seriesTitle })
                CREATE (a)-[:ACTED_IN { screenTime: $screenTime1 }]->(:${movieType.name} { title: $movieTitle, runtime: $movieRuntime })
            `,
                { actorName: actorName1, seriesTitle, screenTime1, movieTitle: movieTitle, movieRuntime }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: actorName1, screenTime2, movieTitle, seriesTitle, screenTime3 },
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
                                            title: seriesTitle,
                                        },
                                    },
                                    {
                                        screenTime: screenTime2,
                                        node: {
                                            title: movieTitle,
                                            runtime: movieRuntime,
                                        },
                                    },
                                    {
                                        screenTime: screenTime3,
                                        node: {
                                            title: seriesTitle,
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

    test("should not create duplicate relationships when asDuplicate false on multiple of the same connect values", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name: String, $title: String, $screenTime1: Int!, $screenTime2: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name }
                    connect: { 
                        actedIn: [
                            {
                                asDuplicate: false
                                edge: { screenTime: $screenTime2 }
                                where: { node: { title: $title } }
                            },
                            {
                                asDuplicate: false
                                edge: { screenTime: $screenTime1 }
                                where: { node: { title: $title } }
                            },
                        ]
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedInConnection {
                            edges {
                                screenTime
                                node {
                                    title
                                    ... on ${movieType.name} {
                                        runtime
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
                CREATE (a:${actorType.name} { name: $actorName })-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                { actorName: actorName1, seriesTitle, seriesScreenTime: screenTime1 }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: actorName1, title: seriesTitle, screenTime1, screenTime2 },
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
                                            title: seriesTitle,
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

    test("should not relationships when start node does not exist", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name: String, $title: String, $screenTime2: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name }
                    connect: { 
                        actedIn: [
                            {
                                asDuplicate: false
                                edge: { screenTime: $screenTime2 }
                                where: { node: { title: $title } }
                            },
                        ]
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedInConnection {
                            edges {
                                screenTime
                                node {
                                    title
                                    ... on ${movieType.name} {
                                        runtime
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
                CREATE (a:${actorType.name} { name: $actorName })-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                { actorName: actorName1, seriesTitle, seriesScreenTime: screenTime1 }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: nonExistantActorName, title: seriesTitle, screenTime2 },
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

            expect(neo4jResult.records).toHaveLength(1);
        } finally {
            await session.close();
        }
    });

    test("should not relationships when end node does not exist", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation ConnectMovie($name: String, $title: String, $screenTime2: Int!) {
                ${actorType.operations.update}(
                    where: { name: $name }
                    connect: { 
                        actedIn: {
                            asDuplicate: false
                            edge: { screenTime: $screenTime2 }
                            where: { node: { title: $title } }
                        }
                    }
                ) {
                    ${actorType.plural} {
                        name
                        actedInConnection {
                            edges {
                                screenTime
                                node {
                                    title
                                    ... on ${movieType.name} {
                                        runtime
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
                CREATE (a:${actorType.name} { name: $actorName })-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${seriesType.name} { title: $seriesTitle })
            `,
                { actorName: actorName1, seriesTitle, seriesScreenTime: screenTime1 }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: actorName1, title: nonExistantMovieTitle, screenTime2 },
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
                                            title: seriesTitle,
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
