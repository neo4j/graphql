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

// TODO: maybe use type-narrowing-connections
describe("type narrowing - mutations setup", () => {
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
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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

    // update -> update -> edge
    test("update interface relationship, update edge", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";
        const untrainedPersonName = "someone";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const sceneNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
