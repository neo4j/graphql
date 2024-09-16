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

import { gql } from "graphql-tag";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("type narrowing - simple case", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let AmatureProduction: UniqueType;
    let Actor: UniqueType;
    let UntrainedPerson: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        AmatureProduction = testHelper.createUniqueType("AmatureProduction");
        Actor = testHelper.createUniqueType("Actor");
        UntrainedPerson = testHelper.createUniqueType("UntrainedPerson");

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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("get narrowed connection field", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 63563;
        const movieScreenTime = 42699;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 88310;
        const seriesScreenTime = 40968;
        const sceneNr = 92937;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
        const movieRuntime = 41886;
        const movieScreenTime = 72079;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 34992;
        const seriesScreenTime = 43724;
        const sceneNr = 96768;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
        const movieRuntime = 12527;
        const movieScreenTime = 41858;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 65818;
        const seriesScreenTime = 67600;
        const sceneNr = 88992;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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

    test("get narrowed connection field + filter on edge top level", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 17297;
        const movieScreenTime = 33241;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 1345;
        const seriesScreenTime = 17269;
        const sceneNr = 9176;

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

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (m3:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $seriesScreenTime }]->(m3)
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

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["people"]).toEqual(
            expect.arrayContaining([
                {
                    name: actorName,
                    actedInConnection: {
                        edges: expect.arrayContaining([
                            {
                                node: {
                                    title: movieTitle2,
                                    runtime: movieRuntime,
                                },
                                properties: {
                                    screenTime: movieScreenTime,
                                },
                            },
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
                {
                    name: untrainedPersonName,
                    actedInConnection: {
                        edges: expect.arrayContaining([
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
            ])
        );
    });

    test("get narrowed connection field + filter on node top level", async () => {
        const actorName = "actor1";
        const untrainedPersonName = "anyone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 69186;
        const movieScreenTime = 33869;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 88178;
        const seriesScreenTime = 41685;
        const sceneNr = 20583;

        const query = /* GraphQL */ `
            query People {
                people(where: { actedInConnection_SOME: { node: { OR: [ { title: "${movieTitle}" }, { title: "${amatureProductionTitle}" }] } } }) {
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

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName, moviesCnt: 1 })
                CREATE (up:${UntrainedPerson} { name: $untrainedPersonName, age: 20 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
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

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["people"]).toEqual([
            {
                name: actorName,
                actedInConnection: {
                    edges: expect.arrayContaining([
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
                actedInConnection: {
                    edges: expect.arrayContaining([
                        {
                            node: {
                                title: amatureProductionTitle,
                                episodeCount: seriesEpisodes,
                            },
                            properties: {
                                sceneNr: sceneNr,
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
        const movieRuntime = 80494;
        const movieScreenTime = 34409;
        const movieScreenTime2 = 12485;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 79217;
        const seriesScreenTime = 60447;
        const sceneNr = 85423;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
        const movieRuntime = 49337;
        const movieScreenTime = 80113;
        const movieScreenTime2 = 5407;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 189;
        const seriesScreenTime = 22550;
        const sceneNr = 40154;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
        const movieRuntime = 12169;
        const movieScreenTime = 33584;
        const movieScreenTime2 = 98332;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 80053;
        const seriesScreenTime = 98561;
        const sceneNr = 21219;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
        const movieRuntime = 39883;
        const movieScreenTime = 64889;
        const movieScreenTime2 = 82496;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 42968;
        const seriesScreenTime = 64469;
        const sceneNr = 2621;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
        const movieRuntime = 67705;
        const movieScreenTime = 88223;
        const movieScreenTime2 = 91931;

        const amatureProductionTitle = "amature";
        const seriesEpisodes = 16632;
        const seriesScreenTime = 39594;
        const sceneNr = 76405;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
