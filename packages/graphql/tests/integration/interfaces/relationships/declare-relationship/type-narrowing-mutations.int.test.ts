/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

// TODO: maybe use type-narrowing-connections
describe("type narrowing - mutations setup", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let AmatureProduction: UniqueType;
    let Actor: UniqueType;
    let UntrainedPerson: UniqueType;

    beforeAll(async () => {});

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

            type ${Movie} implements Production @node {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${AmatureProduction} implements Production @node {
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

            type ${Actor} implements Person @node {
                name: String!
                moviesCnt: Int!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ${UntrainedPerson} implements Person @node {
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

    // update -> update -> edge
    test("update interface relationship, update edge", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";
        const untrainedPersonName = "someone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = 69423;
        const movieScreenTime = 1227;

        const seriesTitle = "series1";
        const seriesEpisodes = 65752;
        const seriesScreenTime = 64112;
        const sceneNr = 2291;

        const query = /* GraphQL */ `
        mutation {
            ${Actor.operations.update}(update: { actedIn: [{ update: { node: { actors: [{ update: { edge: { ActedIn: { screenTime_SET: 0 } } } }] } } }] }) {
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
                    }
                }
            }
        }
    `;

        await testHelper.executeCypher(
            `
            CREATE (a:${Actor} { name: $actorName })
            CREATE (a2:${Actor} { name: $actorName2 })
            CREATE (up:${UntrainedPerson} { name: $untrainedPersonName })
            CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
            CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
            CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
            CREATE (ap:${AmatureProduction} { title: $seriesTitle, episodeCount: $seriesEpisodes })
            CREATE (up)-[:ACTED_IN { sceneNr: $sceneNr }]->(ap)
            CREATE (a)-[:ACTED_IN { sceneNr: $sceneNr, screenTime: $movieScreenTime }]->(ap)
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
                sceneNr,
                untrainedPersonName,
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
                                                    name: untrainedPersonName,
                                                    actedInConnection: {
                                                        edges: [
                                                            {
                                                                node: {
                                                                    title: seriesTitle,
                                                                    episodeCount: seriesEpisodes,
                                                                },
                                                                properties: { sceneNr },
                                                            },
                                                        ],
                                                    },
                                                },
                                                properties: { sceneNr },
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
});
