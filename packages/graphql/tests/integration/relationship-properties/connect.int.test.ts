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
    const actorName = "An Actor";
    const screenTime = 321;

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
                                    connect: [{
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }]
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
                    { actorName }
                );

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                    variableValues: { movieTitle, actorName, screenTime },
                });
                expect(gqlResult.errors).toBeFalsy();
                expect((gqlResult.data as any)?.[movieType.operations.create][movieType.plural]).toEqual([
                    {
                        title: movieTitle,
                        actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                    },
                ]);

                const cypher = `
                    MATCH (m:${movieType.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${actorType.name} {name: $actorName})
                    RETURN m
                `;

                const neo4jResult = await session.run(cypher, { movieTitle, screenTime, actorName });
                expect(neo4jResult.records).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

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
                    { movieTitle, actorName }
                );

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                    variableValues: { movieTitle, actorName, screenTime },
                });
                expect(gqlResult.errors).toBeFalsy();
                expect((gqlResult.data as any)?.[movieType.operations.update][movieType.plural]).toEqual([
                    {
                        title: movieTitle,
                        actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                    },
                ]);

                const cypher = `
                    MATCH (m:${movieType.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${actorType.name} {name: $actorName})
                    RETURN m
                `;

                const neo4jResult = await session.run(cypher, { movieTitle, screenTime, actorName });
                expect(neo4jResult.records).toHaveLength(1);
            } finally {
                await session.close();
            }
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
        test("should create an actor while connecting a relationship that has properties", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: typeDefs,
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
                    variableValues: { movieTitle, actorName, screenTime },
                });
                expect(gqlResult.errors).toBeFalsy();
                expect((gqlResult.data as any)?.[actorType.operations.create][actorType.plural]).toEqual([
                    {
                        name: actorName,
                    },
                ]);

                const cypher = `
                    MATCH (a:${actorType.name} {name: $actorName})
                            -[:ACTED_IN {screenTime: $screenTime}]->
                                (:${movieType.name} {title: $movieTitle})
                    RETURN a
                `;

                const neo4jResult = await session.run(cypher, { movieTitle, screenTime, actorName });
                expect(neo4jResult.records).toHaveLength(1);
            } finally {
                await session.close();
            }
        });

        test("should update an actor while connecting a relationship that has properties", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: typeDefs,
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
                    { movieTitle, actorName }
                );

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                    variableValues: { movieTitle, actorName, screenTime },
                });
                expect(gqlResult.errors).toBeFalsy();
                expect((gqlResult.data as any)?.[actorType.operations.update][actorType.plural]).toEqual([
                    {
                        name: actorName,
                    },
                ]);

                const cypher = `
                    MATCH (a:${actorType.name} {name: $actorName})
                            -[:ACTED_IN {screenTime: $screenTime}]->
                                (:${movieType.name} {title: $movieTitle})
                    RETURN a
                `;

                const neo4jResult = await session.run(cypher, { movieTitle, screenTime, actorName });
                expect(neo4jResult.records).toHaveLength(1);
            } finally {
                await session.close();
            }
        });
    });
});
