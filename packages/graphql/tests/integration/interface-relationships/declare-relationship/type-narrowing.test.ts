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

import { faker } from "@faker-js/faker";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4j from "../../neo4j";

describe("type narrowing - simple case", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;
    let AmatureProduction: UniqueType;
    let Actor: UniqueType;
    let UntrainedPerson: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Movie = new UniqueType("Movie");
        AmatureProduction = new UniqueType("AmatureProduction");
        Actor = new UniqueType("Actor");
        UntrainedPerson = new UniqueType("UntrainedPerson");
        session = await neo4j.getSession();

        const typeDefs = gql`
            interface Production {
                title: String!
                actors: [Person!]! @declareRelationship
            }

            type ${Movie} implements Production {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${AmatureProduction} implements Production {
                title: String!
                episodeCount: Int!
                actors: [${UntrainedPerson}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "AppearsIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type AppearsIn @relationshipProperties {
                sceneNr: Int!
            }

            interface Person {
                name: String!
                actedIn: [Production!]! @declareRelationship
            }

            type ${Actor} implements Person {
                name: String!
                moviesCnt: Int!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ${UntrainedPerson} implements Person {
                name: String!
                age: Int!
                actedIn: [${AmatureProduction}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "AppearsIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await session.run(
            `
                MATCH(a:${Movie})
                MATCH(b:${AmatureProduction})
                MATCH(c:${Actor})
                MATCH(d:${UntrainedPerson})

                DETACH DELETE a
                DETACH DELETE b
                DETACH DELETE c
                DETACH DELETE d
            `
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("get narrowed connection field", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query Productions {
                productions {
                    title
                    actorsConnection {
                        edges {
                            node {
                                name
                                ... on ${Actor} {
                                    moviesCnt
                                }
                                ... on ${UntrainedPerson} {
                                    age
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["productions"]).toIncludeSameMembers([
            {
                title: movieTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName,
                                moviesCnt: 1,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                title: movieTitle2,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName,
                                moviesCnt: 1,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                title: amatureProductionTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: untrainedPersonName,
                                age: 20,
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("get narrowed connection field nested for one narrowed type", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query Productions {
                productions {
                    title
                    actorsConnection {
                        edges {
                            node {
                                name
                                ... on ${Actor} {
                                    moviesCnt
                                    actedInConnection {
                                        edges {
                                            node {
                                                title
                                                ... on ${Movie} {
                                                    runtime
                                                }
                                            }
                                            properties {
                                                ... on ActedIn {
                                                    screenTime
                                                }
                                            }
                                        }
                                    }
                                }
                                ... on ${UntrainedPerson} {
                                    age
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["productions"]).toIncludeSameMembers([
            {
                title: movieTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName,
                                moviesCnt: 1,
                                actedInConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                title: movieTitle,
                                                runtime: movieRuntime,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime,
                                            },
                                        },
                                        {
                                            node: {
                                                title: movieTitle2,
                                                runtime: movieRuntime,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                title: movieTitle2,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName,
                                moviesCnt: 1,
                                actedInConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                title: movieTitle,
                                                runtime: movieRuntime,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime,
                                            },
                                        },
                                        {
                                            node: {
                                                title: movieTitle2,
                                                runtime: movieRuntime,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                title: amatureProductionTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: untrainedPersonName,
                                age: 20,
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("get narrowed connection field nested for the other narrowed type", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query Productions {
                productions {
                    title
                    actorsConnection {
                        edges {
                            node {
                                name
                                ... on ${Actor} {
                                    moviesCnt
                                }
                                ... on ${UntrainedPerson} {
                                    age
                                    actedInConnection {
                                        edges {
                                            node {
                                                title
                                                ... on ${Movie} {
                                                    runtime
                                                }
                                                ... on ${AmatureProduction} {
                                                    episodeCount
                                                }
                                            }
                                            properties {
                                                ... on ActedIn {
                                                    screenTime
                                                }
                                                ... on AppearsIn {
                                                    sceneNr
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["productions"]).toIncludeSameMembers([
            {
                title: movieTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName,
                                moviesCnt: 1,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                title: movieTitle2,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName,
                                moviesCnt: 1,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                title: amatureProductionTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: untrainedPersonName,
                                age: 20,
                                actedInConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                title: amatureProductionTitle,
                                                episodeCount: seriesEpisodes,
                                            },
                                            properties: {
                                                sceneNr,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    // TODO: translation layer does not seem to support connection filters on interfaces
    /* eslint-disable-next-line jest/no-disabled-tests */
    test.skip("get narrowed connection field + filter on edge top level", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query People {
                people(where: { actedInConnection: { edge: { ActedIn: { screenTime: ${movieScreenTime} }, AppearsIn: { sceneNr: ${sceneNr} } } } }) {
                    name
                    actedInConnection {
                        edges {
                            node {
                                title
                                ... on ${Movie} {
                                    runtime
                                }
                                ... on ${AmatureProduction} {
                                    episodeCount
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["people"]).toIncludeSameMembers([
            {
                name: actorName,
                moviesCnt: 1,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: movieTitle,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                name: untrainedPersonName,
                age: 20,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: amatureProductionTitle,
                                episodeCount: seriesEpisodes,
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
        ]);
    });
    // TODO: translation layer does not seem to support connection filters on interfaces
    /* eslint-disable-next-line jest/no-disabled-tests */
    test.skip("get narrowed connection field + filter on node top level", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query People {
                people(where: { actedInConnection: { node: { title: "${movieTitle}" } } }) {
                    name
                    actedInConnection {
                        edges {
                            node {
                                title
                                ... on ${Movie} {
                                    runtime
                                }
                                ... on ${AmatureProduction} {
                                    episodeCount
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["people"]).toIncludeSameMembers([
            {
                name: actorName,
                moviesCnt: 1,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: movieTitle,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
            {
                name: untrainedPersonName,
                age: 20,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: amatureProductionTitle,
                                episodeCount: seriesEpisodes,
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("get narrowed connection field + filter on edge nested - only one possible propertiesTypeName", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query People {
                people {
                    name
                    actedInConnection {
                        edges {
                            node {
                                title
                                actorsConnection(where: { edge: { ActedIn: {screenTime: ${movieScreenTime2}}, AppearsIn: {} } }) {
                                    edges {
                                        node {
                                            name
                                            ... on ${Actor} {
                                                moviesCnt
                                            }
                                            ... on ${UntrainedPerson} {
                                                age
                                            }
                                        }
                                        properties {
                                            ... on ActedIn {
                                                screenTime
                                            }
                                           ... on AppearsIn {
                                                sceneNr
                                           }
                                        }
                                    }
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                movieScreenTime2,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["people"]).toIncludeSameMembers([
            {
                name: actorName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: movieTitle,
                                actorsConnection: {
                                    edges: [],
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                actorsConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                name: actorName,
                                                moviesCnt: 1,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime2,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime2,
                            },
                        },
                    ]),
                },
            },
            {
                name: untrainedPersonName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: amatureProductionTitle,
                                actorsConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                name: untrainedPersonName,
                                                age: 20,
                                            },
                                            properties: {
                                                sceneNr,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("get narrowed connection field + filter on edge nested - other possible propertiesTypeName", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query People {
                people {
                    name
                    actedInConnection {
                        edges {
                            node {
                                title
                                actorsConnection(where: { edge: {  AppearsIn: { sceneNr_NOT: ${sceneNr} } } }) {
                                    edges {
                                        node {
                                            name
                                            ... on ${Actor} {
                                                moviesCnt
                                            }
                                            ... on ${UntrainedPerson} {
                                                age
                                            }
                                        }
                                        properties {
                                            ... on ActedIn {
                                                screenTime
                                            }
                                           ... on AppearsIn {
                                                sceneNr
                                           }
                                        }
                                    }
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                movieScreenTime2,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["people"]).toIncludeSameMembers([
            {
                name: actorName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: movieTitle,
                                actorsConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                name: actorName,
                                                moviesCnt: 1,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                actorsConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                name: actorName,
                                                moviesCnt: 1,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime2,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime2,
                            },
                        },
                    ]),
                },
            },
            {
                name: untrainedPersonName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: amatureProductionTitle,
                                actorsConnection: {
                                    edges: [],
                                },
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("get narrowed connection field + filter on edge nested - all possible propertiesTypeName", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query People {
                people {
                    name
                    actedInConnection {
                        edges {
                            node {
                                title
                                actorsConnection(where: { edge: { ActedIn: { screenTime_NOT: ${movieScreenTime} }, AppearsIn: { sceneNr_NOT: ${sceneNr} } } }) {
                                    edges {
                                        node {
                                            name
                                            ... on ${Actor} {
                                                moviesCnt
                                            }
                                            ... on ${UntrainedPerson} {
                                                age
                                            }
                                        }
                                        properties {
                                            ... on ActedIn {
                                                screenTime
                                            }
                                           ... on AppearsIn {
                                                sceneNr
                                           }
                                        }
                                    }
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                movieScreenTime2,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["people"]).toIncludeSameMembers([
            {
                name: actorName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: movieTitle,
                                actorsConnection: {
                                    edges: [],
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                actorsConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: {
                                                name: actorName,
                                                moviesCnt: 1,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime2,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                screenTime: movieScreenTime2,
                            },
                        },
                    ]),
                },
            },
            {
                name: untrainedPersonName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: amatureProductionTitle,
                                actorsConnection: {
                                    edges: [],
                                },
                            },
                            properties: {
                                sceneNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("concrete.interfaceConnection edge filter works for the correct propertiesTypeName", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query Actors {
                ${Actor.plural} {
                    name
                    actedInConnection(where: { edge: { ActedIn: { screenTime: ${movieScreenTime} } } }) {
                        edges {
                            node {
                                title
                                ... on ${Movie} {
                                    runtime
                                }
                                ... on ${AmatureProduction} {
                                    episodeCount
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                               ... on AppearsIn {
                                    sceneNr
                               }
                            }
                        }
                    }
                }
            }
        `;

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                movieScreenTime2,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.[Actor.plural]).toIncludeSameMembers([
            {
                name: actorName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: movieTitle,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("concrete.interfaceConnection edge filter ignores the incorrect propertiesTypeName (Person.actedIn can have AppearsIn properties but Actor.actedIn can only have ActedIn)", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });

        const amatureProductionTitle = "amature";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
        query Actors {
            ${Actor.plural} {
                name
                actedInConnection(where: { edge: { AppearsIn: { sceneNr: 0 } } }) {
                    edges {
                        node {
                            title
                            ... on ${Movie} {
                                runtime
                            }
                            ... on ${AmatureProduction} {
                                episodeCount
                            }
                        }
                        properties {
                            ... on ActedIn {
                                screenTime
                            }
                           ... on AppearsIn {
                                sceneNr
                           }
                        }
                    }
                }
            }
        }
    `;

        await session.run(
            `
            CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
            CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
            CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
            CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2)
            CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(m2)
            CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
        `,
            {
                actorName,
                untrainedPersonName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                movieScreenTime2,
                seriesEpisodes,
                seriesScreenTime,
                amatureProductionTitle,
                sceneNr,
            }
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.[Actor.plural]).toIncludeSameMembers([
            {
                name: actorName,
                actedInConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: movieTitle,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            properties: {
                                screenTime: movieScreenTime2,
                            },
                        },
                    ]),
                },
            },
        ]);
    });
});
