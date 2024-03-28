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

describe("interface implementing interface with declared relationships - two level interface chain", () => {
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

            interface Thing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface Show implements Thing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface Production implements Thing & Show {
                title: String!
                actors: [${Actor}!]! 
            }

            type ${Movie} implements Production & Show & Thing {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Production & Show & Thing {
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

    test("THING should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 89247;
        const movieScreenTime = 54804;

        const seriesTitle = "series1";
        const seriesEpisodes = 43471;
        const seriesScreenTime = 67186;
        const episodeNr = 82467;

        const query = /* GraphQL */ `
            query Things {
                things {
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

        expect(gqlResult.data?.["things"]).toIncludeSameMembers([
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

    test("THING MOVIE CONNECTION should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 67159;
        const movieScreenTime = 99602;

        const seriesTitle = "series1";
        const seriesEpisodes = 28043;
        const seriesScreenTime = 45240;
        const episodeNr = 18199;

        const query = /* GraphQL */ `
            query Things {
                things {
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
                                                actorsConnection {
                                                    edges {
                                                        node {
                                                            name
                                                        }
                                                    }
                                                }
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

        expect(gqlResult.data?.["things"]).toIncludeSameMembers([
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
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
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
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
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
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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
                                            node: {
                                                title: movieTitle2,
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
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
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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

    test("SHOW should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 21789;
        const movieScreenTime = 27695;

        const seriesTitle = "series1";
        const seriesEpisodes = 13078;
        const seriesScreenTime = 80574;
        const episodeNr = 69185;

        const query = /* GraphQL */ `
            query Shows {
                shows {
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

        expect(gqlResult.data?.["shows"]).toIncludeSameMembers([
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

    test("SHOW MOVIE CONNECTION should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 98454;
        const movieScreenTime = 67373;

        const seriesTitle = "series1";
        const seriesEpisodes = 28950;
        const seriesScreenTime = 32643;
        const episodeNr = 55960;

        const query = /* GraphQL */ `
            query Shows {
                shows {
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
                                                actorsConnection {
                                                    edges {
                                                        node {
                                                            name
                                                        }
                                                    }
                                                }
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

        expect(gqlResult.data?.["shows"]).toIncludeSameMembers([
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
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
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
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
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
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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
                                            node: {
                                                title: movieTitle2,
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
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
                                                runtime: movieRuntime,
                                                actorsConnection: {
                                                    edges: expect.toIncludeSameMembers([
                                                        {
                                                            node: {
                                                                name: actorName,
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: actorName2,
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
});
