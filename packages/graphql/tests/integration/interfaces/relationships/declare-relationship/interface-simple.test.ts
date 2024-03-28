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

describe("interface with declared relationships", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Episode: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        Actor = testHelper.createUniqueType("Actor");
        Episode = testHelper.createUniqueType("Episode");

        const typeDefs = gql`
            type ${Episode} {
                runtime: Int!
                series: ${Series}! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            type ${Movie} implements Production {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Production {
                title: String!
                episodeCount: Int!
                episodes: [${Episode}!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "StarredIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }


            type StarredIn @relationshipProperties {
                episodeNr: Int!
            }

            type ${Actor} {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should read and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 73595;
        const movieScreenTime = 41211;

        const seriesTitle = "series1";
        const seriesEpisodes = 36220;
        const seriesScreenTime = 15272;

        const query = `
            query Productions {
                productions {
                    title
                    actors {
                        name
                        actedIn {
                            title
                            ... on ${Movie} {
                                runtime
                            }
                            ... on ${Series} {
                                episodeCount
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["productions"]).toIncludeSameMembers([
            {
                title: movieTitle,
                actors: expect.toIncludeSameMembers([
                    {
                        name: actorName,
                        actedIn: expect.toIncludeSameMembers([
                            {
                                title: movieTitle,
                                runtime: movieRuntime,
                            },
                            {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            {
                                title: seriesTitle,
                                episodeCount: seriesEpisodes,
                            },
                        ]),
                    },
                ]),
            },
            {
                title: movieTitle2,
                actors: expect.toIncludeSameMembers([
                    {
                        name: actorName,
                        actedIn: expect.toIncludeSameMembers([
                            {
                                title: movieTitle,
                                runtime: movieRuntime,
                            },
                            {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            {
                                title: seriesTitle,
                                episodeCount: seriesEpisodes,
                            },
                        ]),
                    },
                    {
                        name: actorName2,
                        actedIn: [
                            {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                        ],
                    },
                ]),
            },
            {
                title: seriesTitle,
                actors: expect.toIncludeSameMembers([
                    {
                        name: actorName,
                        actedIn: expect.toIncludeSameMembers([
                            {
                                title: movieTitle,
                                runtime: movieRuntime,
                            },
                            {
                                title: movieTitle2,
                                runtime: movieRuntime,
                            },
                            {
                                title: seriesTitle,
                                episodeCount: seriesEpisodes,
                            },
                        ]),
                    },
                ]),
            },
        ]);
    });

    test("should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 97371;
        const movieScreenTime = 75427;

        const seriesTitle = "series1";
        const seriesEpisodes = 78598;
        const seriesScreenTime = 17239;
        const episodeNr = 50222;

        const query = /* GraphQL */ `
            query Productions {
                productions {
                    title
                    actorsConnection {
                        edges {
                            node {
                                name
                                actedInConnection {
                                    edges {
                                        node {
                                            title
                                            ... on ${Movie} {
                                                runtime
                                            }
                                            ... on ${Series} {
                                                episodeCount
                                            }
                                        }
                                        properties {
                                            screenTime
                                        }
                                    }
                                }
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                                ... on StarredIn {
                                    episodeNr
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                episodeNr,
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
                                        {
                                            node: {
                                                title: seriesTitle,
                                                episodeCount: seriesEpisodes,
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
                                        {
                                            node: {
                                                title: seriesTitle,
                                                episodeCount: seriesEpisodes,
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
                                name: actorName2,
                                actedInConnection: {
                                    edges: expect.toIncludeSameMembers([
                                        {
                                            node: { title: movieTitle2, runtime: movieRuntime },
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
                title: seriesTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
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
                                                screenTime: movieScreenTime,
                                            },
                                        },
                                        {
                                            node: {
                                                title: seriesTitle,
                                                episodeCount: seriesEpisodes,
                                            },
                                            properties: {
                                                screenTime: movieScreenTime,
                                            },
                                        },
                                    ]),
                                },
                            },
                            properties: {
                                episodeNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    // actorsConnection -> sort -> edge
    test("should read connection and return interface relationship fields sorted", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 12532;
        const movieScreenTime = 1;
        const movieScreenTime2 = 2;
        const movieScreenTime3 = 3;

        const seriesTitle = "series1";
        const seriesEpisodes = 23359;
        const seriesScreenTime = 33984;
        const episodeNr = 10;
        const episodeNr2 = 11;

        const query = /* GraphQL */ `
            query Productions {
                productions {
                    title
                    actorsConnection(
                        sort: [{ edge: { ActedIn: { screenTime: ASC }, StarredIn: { episodeNr: DESC } } }]
                    ) {
                        edges {
                            node {
                                name
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                                ... on StarredIn {
                                    episodeNr
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (s:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
                CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime3 }]->(s)
                CREATE (a2)-[:ACTED_IN { episodeNr: $episodeNr2, screenTime: $movieScreenTime2 }]->(s)
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                movieScreenTime2,
                movieScreenTime3,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                episodeNr,
                episodeNr2,
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
                                name: actorName2,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                name: actorName,
                            },
                            properties: {
                                screenTime: movieScreenTime2,
                            },
                        },
                    ]),
                },
            },
            {
                title: seriesTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName2,
                            },
                            properties: {
                                episodeNr: episodeNr2,
                            },
                        },
                        {
                            node: {
                                name: actorName,
                            },
                            properties: {
                                episodeNr: episodeNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    test("should read connection and return interface relationship fields sorted - only one edge specified in sort", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 97692;
        const movieScreenTime = 1;
        const movieScreenTime2 = 2;
        const movieScreenTime3 = 3;

        const seriesTitle = "series1";
        const seriesEpisodes = 54091;
        const seriesScreenTime = 52819;
        const episodeNr = 10;
        const episodeNr2 = 11;

        const query = /* GraphQL */ `
            query Productions {
                productions {
                    title
                    actorsConnection(sort: [{ edge: { StarredIn: { episodeNr: DESC } } }]) {
                        edges {
                            node {
                                name
                            }
                            properties {
                                ... on ActedIn {
                                    screenTime
                                }
                                ... on StarredIn {
                                    episodeNr
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (s:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
                CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime3 }]->(s)
                CREATE (a2)-[:ACTED_IN { episodeNr: $episodeNr2, screenTime: $movieScreenTime2 }]->(s)
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                movieScreenTime2,
                movieScreenTime3,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                episodeNr,
                episodeNr2,
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
                                name: actorName2,
                            },
                            properties: {
                                screenTime: movieScreenTime,
                            },
                        },
                        {
                            node: {
                                name: actorName,
                            },
                            properties: {
                                screenTime: movieScreenTime2,
                            },
                        },
                    ]),
                },
            },
            {
                title: seriesTitle,
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: actorName2,
                            },
                            properties: {
                                episodeNr: episodeNr2,
                            },
                        },
                        {
                            node: {
                                name: actorName,
                            },
                            properties: {
                                episodeNr: episodeNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    // update -> update -> edge
    test("update interface relationship, update edge", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 99338;
        const movieScreenTime = 59670;

        const seriesTitle = "series1";
        const seriesEpisodes = 95731;
        const seriesScreenTime = 75877;
        const episodeNr = 49452;

        const query = /* GraphQL */ `
            mutation {
                ${Actor.operations.update}(update: { actedIn: [{ update: { node: { actors: [{ update: { edge: { ActedIn: { screenTime: 0 } } } }] } } }] }) {
                    ${Actor.plural} {
                        name
                        actedInConnection {
                            edges {
                                node {
                                    title
                                    actorsConnection {
                                        edges {
                                            node {
                                                name
                                                actedInConnection {
                                                    edges {
                                                        node {
                                                            title
                                                            ... on ${Movie} {
                                                                runtime
                                                            }
                                                            ... on ${Series} {
                                                                episodeCount
                                                            }
                                                        }
                                                        properties {
                                                            screenTime
                                                        }
                                                    }
                                                }
                                            }
                                            properties {
                                                ... on ActedIn {
                                                    screenTime
                                                }
                                                ... on StarredIn {
                                                    episodeNr
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                episodeNr,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data?.[Actor.operations.update] as Record<string, any>)?.[Actor.plural]).toIncludeSameMembers(
            [
                {
                    name: actorName,
                    actedInConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: movieTitle2,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                node: {
                                                    name: actorName2,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: 0 },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: 0 },
                                            },
                                        ]),
                                    },
                                },
                            },
                            {
                                node: {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: 0 },
                                            },
                                        ],
                                    },
                                },
                            },
                            {
                                node: {
                                    title: seriesTitle,
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { episodeNr },
                                            },
                                        ],
                                    },
                                },
                            },
                        ]),
                    },
                },
                {
                    name: actorName2,
                    actedInConnection: {
                        edges: [
                            {
                                node: {
                                    title: movieTitle2,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                node: {
                                                    name: actorName2,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: 0 },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 0 },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: 0 },
                                            },
                                        ]),
                                    },
                                },
                            },
                        ],
                    },
                },
            ]
        );
    });

    // update -> create -> edge
    test("update interface relationship, create edge", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 9152;
        const movieScreenTime = 85537;

        const seriesTitle = "series1";
        const seriesEpisodes = 5492;
        const seriesScreenTime = 37374;
        const episodeNr = 86743;

        const query = /* GraphQL */ `
            mutation {
                ${Actor.operations.update}(update: { 
                    actedIn: [{ 
                        where: { OR: [{ node: { title: "${movieTitle}" } }] }, 
                        update: { 
                            node: { 
                                actors: [{ 
                                    #where: { OR: [{ node: { name: "${actorName}" } }, { edge: { StarredIn: { episodeNr: ${episodeNr} } } }] }, 
                                    create: { node: { name: "custom actor" }, edge: { ActedIn: { screenTime: 101 }, StarredIn: { episodeNr: 101 } } } 
                                }] 
                            } 
                        } 
                    }] 
                }) {
                    ${Actor.plural} {
                        name
                        actedInConnection {
                            edges {
                                node {
                                    title
                                    actorsConnection {
                                        edges {
                                            node {
                                                name
                                                actedInConnection {
                                                    edges {
                                                        node {
                                                            title
                                                            ... on ${Movie} {
                                                                runtime
                                                            }
                                                            ... on ${Series} {
                                                                episodeCount
                                                            }
                                                        }
                                                        properties {
                                                            screenTime
                                                        }
                                                    }
                                                }
                                            }
                                            properties {
                                                ... on ActedIn {
                                                    screenTime
                                                }
                                                ... on StarredIn {
                                                    episodeNr
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                episodeNr,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data?.[Actor.operations.update] as Record<string, any>)?.[Actor.plural]).toIncludeSameMembers(
            [
                {
                    name: actorName,
                    actedInConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: movieTitle2,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                node: {
                                                    name: actorName2,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                        ]),
                                    },
                                },
                            },
                            {
                                node: {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: "custom actor",
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: {
                                                                    title: movieTitle,
                                                                    runtime: movieRuntime,
                                                                },
                                                                properties: {
                                                                    screenTime: 101,
                                                                },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: 101 },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                        ],
                                    },
                                },
                            },
                            {
                                node: {
                                    title: seriesTitle,
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { episodeNr },
                                            },
                                        ],
                                    },
                                },
                            },
                        ]),
                    },
                },
                {
                    name: actorName2,
                    actedInConnection: {
                        edges: [
                            {
                                node: {
                                    title: movieTitle2,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                node: {
                                                    name: actorName2,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                        ]),
                                    },
                                },
                            },
                        ],
                    },
                },
            ]
        );
    });

    // update -> connect -> edge
    test("update interface relationship, connect edge", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";
        const actorName3 = "another actor";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 3730;
        const movieScreenTime = 94414;

        const seriesTitle = "series1";
        const seriesEpisodes = 3616;
        const seriesScreenTime = 66797;
        const episodeNr = 57531;

        const query = /* GraphQL */ `
            mutation {
                ${Actor.operations.update}(update: { 
                    actedIn: [{ # ActorActedInUpdateFieldInput
                        where: { node: { title: "${movieTitle}" } } # ActorActedInConnectionWhere
                        update: { # ActorActedInUpdateConnectionInput
                            node: { # ProductionUpdateInput
                                actors: [{  # ProductionActorsUpdateFieldInput                          
                                    connect: {  # ProductionActorsConnectFieldInput
                                        where: { node: { name: "${actorName3}" } }, 
                                        edge: { ActedIn: { screenTime: 111 }, StarredIn: { episodeNr: 111 } }, 
                                    } 
                                }] 
                            } 
                        } 
                    }] 
                }) {
                    ${Actor.plural} {
                        name
                        actedInConnection {
                            edges {
                                node {
                                    title
                                    actorsConnection {
                                        edges {
                                            node {
                                                name
                                                actedInConnection {
                                                    edges {
                                                        node {
                                                            title
                                                            ... on ${Movie} {
                                                                runtime
                                                            }
                                                            ... on ${Series} {
                                                                episodeCount
                                                            }
                                                        }
                                                        properties {
                                                            screenTime
                                                        }
                                                    }
                                                }
                                            }
                                            properties {
                                                ... on ActedIn {
                                                    screenTime
                                                }
                                                ... on StarredIn {
                                                    episodeNr
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (:${Actor} { name: $actorName3 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                actorName2,
                actorName3,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                episodeNr,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data?.[Actor.operations.update] as Record<string, any>)?.[Actor.plural]).toIncludeSameMembers(
            [
                {
                    name: actorName,
                    actedInConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: movieTitle2,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                node: {
                                                    name: actorName2,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                        ]),
                                    },
                                },
                            },
                            {
                                node: {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: actorName3,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 111 },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: 111 },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                        ],
                                    },
                                },
                            },
                            {
                                node: {
                                    title: seriesTitle,
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { episodeNr },
                                            },
                                        ],
                                    },
                                },
                            },
                        ]),
                    },
                },
                {
                    name: actorName2,
                    actedInConnection: {
                        edges: [
                            {
                                node: {
                                    title: movieTitle2,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                node: {
                                                    name: actorName2,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                        ]),
                                    },
                                },
                            },
                        ],
                    },
                },
                {
                    name: actorName3,
                    actedInConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: [
                                            {
                                                node: {
                                                    name: actorName3,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 111 },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: 111 },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: expect.toIncludeSameMembers([
                                                            {
                                                                node: { title: movieTitle2, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { screenTime: movieScreenTime },
                                                            },
                                                        ]),
                                                    },
                                                },
                                                properties: { screenTime: movieScreenTime },
                                            },
                                        ],
                                    },
                                },
                            },
                        ]),
                    },
                },
            ]
        );
    });

    test("create interface relationship, connect edge", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieRuntime = 57523;

        const query = /* GraphQL */ `
            mutation {
                ${Actor.operations.create}(input: [{ 
                    name: "${actorName2}"
                    actedIn: { 
                        connect: [{ 
                            edge: { screenTime: 112 }
                            where: { node: { title: "${movieTitle}" } } 
                            connect: { 
                                actors: [{  
                                    edge: { ActedIn: { screenTime: 111 }, StarredIn: { episodeNr: 111 } }, 
                                    
                                }] 
                            } 
                        }] 
                    }
                }]) {
                    ${Actor.plural} {
                        name
                        actedInConnection {
                            edges {
                                node {
                                    title
                                    actorsConnection {
                                        edges {
                                            node {
                                                name
                                                actedInConnection {
                                                    edges {
                                                        node {
                                                            title
                                                            ... on ${Movie} {
                                                                runtime
                                                            }
                                                            ... on ${Series} {
                                                                episodeCount
                                                            }
                                                        }
                                                        properties {
                                                            screenTime
                                                        }
                                                    }
                                                }
                                            }
                                            properties {
                                                ... on ActedIn {
                                                    screenTime
                                                }
                                                ... on StarredIn {
                                                    episodeNr
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
           `,
            {
                actorName,
                movieTitle,
                movieRuntime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data?.[Actor.operations.create] as Record<string, any>)?.[Actor.plural]).toIncludeSameMembers(
            [
                {
                    name: actorName2,
                    actedInConnection: {
                        edges: [
                            {
                                node: {
                                    title: movieTitle,
                                    actorsConnection: {
                                        edges: expect.toIncludeSameMembers([
                                            {
                                                node: {
                                                    name: actorName2,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 111 },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: 111 },
                                            },
                                            {
                                                node: {
                                                    name: actorName,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: { title: movieTitle, runtime: movieRuntime },
                                                                properties: { screenTime: 111 },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { screenTime: 111 },
                                            },
                                        ]),
                                    },
                                },
                            },
                        ],
                    },
                },
            ]
        );
    });

    test("should create a relationship only to one of the implementing entities", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 26229;
        const movieScreenTime = 47701;

        const seriesTitle = "series1";
        const seriesEpisodes = 10004;
        const seriesScreenTime = 94676;
        const episodeNr = 2552;

        const query = /* GraphQL */ `
        mutation CreateActors {
            ${Actor.operations.create}(
              input: {
                name: "My Actor"
                actedIn: {
                  connect: {
                    edge: { screenTime: 10 }
                    where: { node: { title: "${movieTitle}", typename_IN: [${Movie.name}] } }
                  }
                }
              }
            ) {
              ${Actor.plural} {
                name
              }
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                episodeNr,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.create]: {
                [Actor.plural]: expect.toIncludeSameMembers([
                    {
                        name: "My Actor",
                    },
                ]),
            },
        });
    });
});
