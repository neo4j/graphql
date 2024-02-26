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
import gql from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import Neo4jHelper from "../../integration/neo4j";
import { UniqueType } from "../../utils/graphql-types";
import type { Driver, Session } from "neo4j-driver";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/4583", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Episode: UniqueType;

    let actorName;
    let actorName2;

    let movieTitle;
    let movieTitle2;
    let movieRuntime;
    let movieScreenTime;

    let seriesTitle;
    let seriesEpisodes;
    let seriesScreenTime;
    let episodeNr;
    let sameTitle;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Movie = new UniqueType("Movie");
        Series = new UniqueType("Series");
        Actor = new UniqueType("Actor");
        Episode = new UniqueType("Episode");
        session = await neo4j.getSession();

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        actorName = "actor1";
        actorName2 = "actor2";

        movieTitle = "movie1";
        movieTitle2 = "movie2";
        movieRuntime = faker.number.int({ max: 100000 });
        movieScreenTime = faker.number.int({ max: 100000 });

        seriesTitle = "series1";
        seriesEpisodes = faker.number.int({ max: 100000 });
        seriesScreenTime = faker.number.int({ max: 100000 });
        episodeNr = faker.number.int({ max: 100000 });
        sameTitle = "sameTitle";

        await session.run(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a2:${Actor} { name: $actorName2 })
                CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
                CREATE (m3:${Movie} { title: $sameTitle, runtime:100 })
                CREATE (s3:${Series} { title: $sameTitle, episodeCount: 20})
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
                sameTitle,
            }
        );
    });

    afterEach(async () => {
        await cleanNodesUsingSession(session, [Movie, Series, Actor, Episode]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("typename should work for connect operation", async () => {
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
                actedIn {
                    ... on ${Movie.name} {
                        title
                    }
                }
              }
            }
          }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.create]: {
                [Actor.plural]: expect.toIncludeSameMembers([
                    {
                        name: "My Actor",
                        actedIn: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("typename should work for nested connect operation", async () => {
        const query = /* GraphQL */ `
        mutation CreateActors {
            ${Movie.operations.create}(
              input: {
                title: "My Movie"
                runtime: 120
                actors: {
                  connect: {
                    edge: { screenTime: 10 }
                    where: { node: { name: "${actorName2}" } }
                    connect: {
                        actedIn: {
                            edge: { screenTime: 25 }
                            where: { node: { title: "${sameTitle}", typename_IN: [${Movie.name}]} }
                        }
                    }
                  }
                }
              }
            ) {
              ${Movie.plural} {
                title
                actors {
                    name
                    actedIn {
                        ... on ${Movie.name} {
                            title
                        }
                    }
                }
              }
            }
          }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    {
                        title: "My Movie",
                        actors: [
                            {
                                name: actorName2,
                                actedIn: expect.toIncludeSameMembers([
                                    {
                                        title: "My Movie",
                                    },
                                    {
                                        title: sameTitle,
                                    },
                                    {
                                        title: movieTitle2,
                                    },
                                ]),
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("typename should work for connect operation, with logical operators", async () => {
        const query = /* GraphQL */ `
        mutation CreateActors {
            ${Actor.operations.create}(
              input: {
                name: "My Actor"
                actedIn: {
                  connect: {
                    edge: { screenTime: 10 }
                    where: { node: { OR: [
                        { title: "${movieTitle}", typename_IN: [${Movie.name}]},
                        { AND: [ {typename_IN: [${Series.name}]}, { NOT: { title: "${sameTitle}"} }] }
                    ] } }
                  }
                }
              }
            ) {
              ${Actor.plural} {
                name
                actedIn {
                    ... on ${Movie.name} {
                        title
                    }
                    ... on ${Series.name} {
                        title
                    }
                }
              }
            }
          }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.create]: {
                [Actor.plural]: expect.toIncludeSameMembers([
                    {
                        name: "My Actor",
                        actedIn: [
                            {
                                title: movieTitle,
                            },
                            {
                                title: seriesTitle,
                            },
                        ],
                    },
                ]),
            },
        });
    });
});
