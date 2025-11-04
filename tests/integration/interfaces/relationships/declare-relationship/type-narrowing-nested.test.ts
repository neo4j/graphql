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

describe("type narrowing nested connections", () => {
    const testHelper = new TestHelper();
    let gqlQuery: string;

    let Movie: UniqueType;
    let AmatureProduction: UniqueType;
    let Actor: UniqueType;
    let UntrainedPerson: UniqueType;

    let actorName: string;
    let untrainedPersonName: string;
    let movieTitle: string;
    let movieTitle2: string;
    let movieRuntime: number;
    let movieScreenTime: number;
    let amatureProductionTitle: string;
    let seriesEpisodes: number;
    let seriesScreenTime: number;
    let sceneNr: number;

    beforeEach(async () => {
        actorName = "actor1";
        untrainedPersonName = "anyone";
        movieTitle = "movie1";
        movieTitle2 = "movie2";
        movieRuntime = 99105;
        movieScreenTime = 87653;
        amatureProductionTitle = "amature";
        seriesEpisodes = 607;
        seriesScreenTime = 73385;
        sceneNr = 16220;

        Movie = testHelper.createUniqueType("Movie");
        AmatureProduction = testHelper.createUniqueType("AmatureProduction");
        Actor = testHelper.createUniqueType("Actor");
        UntrainedPerson = testHelper.createUniqueType("UntrainedPerson");

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

        gqlQuery = /* GraphQL */ `
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
                           
                        }
                    }
                }
            }
        }
    `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("connection field has relationship to one narrowed type only", async () => {
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
            actors: [${UntrainedPerson}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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

        const gqlResult = await testHelper.executeGraphQL(gqlQuery);

        expect(gqlResult.errors).toBeFalsy();
        expect(
            (gqlResult.data?.["productions"] as any).find((r) => r.title === amatureProductionTitle).actorsConnection
                .edges
        ).toIncludeSameMembers([
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
                    screenTime: seriesScreenTime,
                },
            },
        ]);
    });
    test("connection field has relationship to the other one narrowed type only", async () => {
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
            actors: [${UntrainedPerson}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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
            actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "AppearsIn")
        }
    `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const gqlResult = await testHelper.executeGraphQL(gqlQuery);

        expect(gqlResult.errors).toBeFalsy();
        expect(
            (gqlResult.data?.["productions"] as any).find((r) => r.title === amatureProductionTitle).actorsConnection
                .edges
        ).toIncludeSameMembers([
            {
                node: {
                    name: untrainedPersonName,
                    age: 20,
                    actedInConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: movieTitle2,
                                    runtime: movieRuntime,
                                },
                                properties: {
                                    sceneNr,
                                },
                            },
                        ]),
                    },
                },
                properties: {
                    screenTime: seriesScreenTime,
                },
            },
        ]);
    });
    test("connection field has relationship to interface directly", async () => {
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
            actors: [${UntrainedPerson}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "AppearsIn")
        }
    `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const gqlResult = await testHelper.executeGraphQL(gqlQuery);

        expect(gqlResult.errors).toBeFalsy();
        expect(
            (gqlResult.data?.["productions"] as any).find((r) => r.title === amatureProductionTitle).actorsConnection
                .edges
        ).toIncludeSameMembers([
            {
                node: {
                    name: untrainedPersonName,
                    age: 20,
                    actedInConnection: {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: movieTitle2,
                                    runtime: movieRuntime,
                                },
                                properties: {
                                    sceneNr,
                                },
                            },
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
                    screenTime: seriesScreenTime,
                },
            },
        ]);
    });
    test("concrete.interfaceConnection edge filter works for the correct propertiesTypeName", async () => {
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
            actors: [${UntrainedPerson}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "AppearsIn")
        }
    `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const filterQuery = /* GraphQL */ `
        query UntrainedPeople {
            ${UntrainedPerson.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(filterQuery);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[UntrainedPerson.plural]).toIncludeSameMembers([
            {
                name: untrainedPersonName,
                actedInConnection: {
                    edges: [],
                },
            },
        ]);
    });
    test("concrete.interfaceConnection edge filter ignores the incorrect propertiesTypeName (Person.actedIn can have ActedIn properties but UntrainedPerson.actedIn can only have AppearsIn)", async () => {
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
            actors: [${UntrainedPerson}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "AppearsIn")
        }
    `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const filterQuery = /* GraphQL */ `
        query UntrainedPeople {
            ${UntrainedPerson.plural} {
                name
                actedInConnection(where: { edge: { AppearsIn: { sceneNr: ${sceneNr} }, ActedIn: {screenTime: ${movieScreenTime}} } }) {
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

        const gqlResult = await testHelper.executeGraphQL(filterQuery);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[UntrainedPerson.plural]).toIncludeSameMembers([
            {
                name: untrainedPersonName,
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
                                sceneNr,
                            },
                        },
                    ]),
                },
            },
        ]);
    });
});
