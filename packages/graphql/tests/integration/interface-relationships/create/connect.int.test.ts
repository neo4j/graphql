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
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";

describe("interface relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let typeDefs: string;
    let episodeType: UniqueType;
    let movieType: UniqueType;
    let seriesType: UniqueType;
    let actorType: UniqueType;
    let actedInInterface: UniqueType;
    let productionInterface: UniqueType;

    const actorName1 = "ActorName";
    const actorName2 = "SecondActorName";
    const movieTitle = "MovieTitle";
    const movieRuntime = 1947;
    const movieScreenTime = 91247;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(() => {
        episodeType = generateUniqueType("Episode");
        movieType = generateUniqueType("Movie");
        seriesType = generateUniqueType("Series");
        actorType = generateUniqueType("Actor");
        actedInInterface = generateUniqueType("ActedIn");
        productionInterface = generateUniqueType("Production");

        typeDefs = `
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

    test("should nested create connect using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!, $name2: String) {
                ${actorType.operations.create}(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: {
                                    edge: { screenTime: $screenTime }
                                    where: { node: { title: $title } }
                                    connect: {
                                        actors: { edge: { screenTime: $screenTime }, where: { node: { name: $name2 } } }
                                    }
                                }
                            }
                        }
                    ]
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
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:${actorType.name} { name: $name })
            `,
                { movieTitle, movieRuntime, name: actorName2 }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                    name2: actorName2,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [actorType.operations.create]: {
                    [actorType.plural]: [
                        {
                            actedIn: [
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: expect.toIncludeSameMembers([{ name: actorName2 }, { name: actorName1 }]),
                                },
                            ],
                            name: actorName1,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should nested create connect using interface relationship fields and only connect from one type", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!, $name2: String) {
                ${actorType.operations.create}(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: {
                                    edge: { screenTime: $screenTime }
                                    where: { node: { title: $title } }
                                    connect: {
                                        _on: {
                                            ${movieType.name}: {
                                                actors: {
                                                    edge: { screenTime: $screenTime }
                                                    where: { node: { name: $name2 } }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
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
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:${seriesType.name} { title: $movieTitle, episodes:$movieRuntime })
                CREATE (:${actorType.name} { name: $name })
            `,
                { movieTitle, movieRuntime, name: actorName2 }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                    name2: actorName2,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [actorType.operations.create]: {
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
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should only connect to one type when only _on used", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!) {
                ${actorType.operations.create}(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: {
                                    edge: { screenTime: $screenTime }
                                    where: { node: { _on: { ${movieType.name}: { title: $title } } } }
                                }
                            }
                        }
                    ]
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
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:${seriesType.name} { title: $movieTitle, episodes:$movieRuntime })
            `,
                { movieTitle, movieRuntime }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [actorType.operations.create]: {
                    [actorType.plural]: [
                        {
                            actedIn: [
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                    actors: [{ name: actorName1 }],
                                },
                            ],
                            name: actorName1,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should not create duplicate connections when asDuplicates false", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!) {
                ${actorType.operations.create}(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: [
                                    {
                                        asDuplicate: true
                                        edge: { screenTime: $screenTime }
                                        where: { node: { _on: { ${movieType.name}: { title: $title } } } }
                                    },
                                    {
                                        asDuplicate: false
                                        edge: { screenTime: $screenTime }
                                        where: { node: { _on: { ${movieType.name}: { title: $title } } } }
                                    }
                                ]
                            }
                        }
                    ]
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
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:${seriesType.name} { title: $movieTitle, episodes:$movieRuntime })
            `,
                { movieTitle, movieRuntime }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [actorType.operations.create]: {
                    [actorType.plural]: [
                        {
                            actedIn: [
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                },
                            ],
                            name: actorName1,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should create duplicate connections when asDuplicates true", async () => {
        const session = await neo4j.getSession();

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!) {
                ${actorType.operations.create}(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: [
                                    {
                                        asDuplicate: true
                                        edge: { screenTime: $screenTime }
                                        where: { node: { _on: { ${movieType.name}: { title: $title } } } }
                                    },
                                    {
                                        asDuplicate: true
                                        edge: { screenTime: $screenTime }
                                        where: { node: { _on: { ${movieType.name}: { title: $title } } } }
                                    }
                                ]
                            }
                        }
                    ]
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
                CREATE (:${movieType.name} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:${seriesType.name} { title: $movieTitle, episodes:$movieRuntime })
            `,
                { movieTitle, movieRuntime }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data).toEqual({
                [actorType.operations.create]: {
                    [actorType.plural]: [
                        {
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                },
                                {
                                    runtime: movieRuntime,
                                    title: movieTitle,
                                },
                            ]),
                            name: actorName1,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });
});
