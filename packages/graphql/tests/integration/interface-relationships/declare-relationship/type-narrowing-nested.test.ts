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
import { graphql, type Source } from "graphql";
import { gql } from "graphql-tag";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4j from "../../neo4j";

describe("type narrowing nested connections", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    let gqlQuery: string | Source;

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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        actorName = "actor1";
        untrainedPersonName = "anyone";
        movieTitle = "movie1";
        movieTitle2 = "movie2";
        movieRuntime = faker.number.int({ max: 100000 });
        movieScreenTime = faker.number.int({ max: 100000 });
        amatureProductionTitle = "amature";
        seriesEpisodes = faker.number.int({ max: 100000 });
        seriesScreenTime = faker.number.int({ max: 100000 });
        sceneNr = faker.number.int({ max: 100000 });

        Movie = new UniqueType("Movie");
        AmatureProduction = new UniqueType("AmatureProduction");
        Actor = new UniqueType("Actor");
        UntrainedPerson = new UniqueType("UntrainedPerson");
        session = await neo4j.getSession();

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

    afterAll(async () => {
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
        await driver.close();
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: gqlQuery,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: gqlQuery,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: gqlQuery,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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

        neoSchema = new Neo4jGraphQL({
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: filterQuery,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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

        neoSchema = new Neo4jGraphQL({
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: filterQuery,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
