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
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("interface with declared relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Episode: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
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
    });

    afterEach(async () => {
        await session.run(
            `
                MATCH(a:${Movie})
                MATCH(b:${Series})
                MATCH(c:${Actor})

                DETACH DELETE a
                DETACH DELETE b
                DETACH DELETE c
            `
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });

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

        await session.run(
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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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
});

describe("interface implementing interface with declared relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Episode: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
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

            interface Show {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface Production implements Show {
                title: String!
                actors: [${Actor}!]! 
            }

            type ${Movie} implements Production & Show {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Production & Show {
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
    });

    afterEach(async () => {
        await session.run(
            `
                MATCH(a:${Movie})
                MATCH(b:${Series})
                MATCH(c:${Actor})

                DETACH DELETE a
                DETACH DELETE b
                DETACH DELETE c
            `
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("intermediate interface relationship field can still be traversed with simple query even though it's missing the @declareRelationship", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });

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

        await session.run(
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

    test("intermediate interface relationship field can NOT be traversed with the connection query because it's missing the  @declareRelationship", async () => {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors?.[0]?.message).toInclude(`Cannot query field "actorsConnection" on type "Production"`);
    });

    test("SHOW should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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

    test("SHOW CONNECTION should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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
                                            actorsConnection {
                                                edges {
                                                    node {
                                                        name
                                                    }
                                                }
                                            }
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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors?.[0]?.message).toInclude(`Cannot query field "actorsConnection" on type "Production"`);
    });

    test.skip("WHERE?", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });

        const query = `
            query Actors {
                ${Actor.plural}(where: { actedIn: { title: "${movieTitle}" } }) {
                    name
                    actedIn {
                        title
                    }
                }
            }
        `;
        const queryC = `
            query Actors {
                ${Actor.plural}(where: { actedInConnection: { node: { title: "${movieTitle}" } } }) {
                    name
                    actedIn {
                        title
                    }
                }
            }
        `;

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: queryC,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.[Actor.plural]).toIncludeSameMembers([
            {
                name: actorName,
                actedIn: expect.toIncludeSameMembers([
                    {
                        title: movieTitle,
                    },
                ]),
            },
        ]);
    });
});

describe("interface implementing interface with declared relationships on two interfaces", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Episode: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await session.run(
            `
                MATCH(a:${Movie})
                MATCH(b:${Series})
                MATCH(c:${Actor})

                DETACH DELETE a
                DETACH DELETE b
                DETACH DELETE c
            `
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("THING should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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

describe("interface implementing interface with declared relationships on three interfaces", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Episode: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
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

            interface Thing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface WatchableThing implements Thing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface Show implements Thing & WatchableThing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface Production implements WatchableThing & Thing & Show {
                title: String!
                actors: [${Actor}!]! 
            }

            type ${Movie} implements WatchableThing & Production & Show & Thing {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements WatchableThing & Production & Show & Thing {
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
    });

    afterEach(async () => {
        await session.run(
            `
                MATCH(a:${Movie})
                MATCH(b:${Series})
                MATCH(c:${Actor})

                DETACH DELETE a
                DETACH DELETE b
                DETACH DELETE c
            `
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("WATCHABLE THING should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query WatchableThings {
                watchableThings {
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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["watchableThings"]).toIncludeSameMembers([
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

    test("WATCHABLE THING MOVIE CONNECTION should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query WatchableThings {
                watchableThings {
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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["watchableThings"]).toIncludeSameMembers([
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

    test("THING should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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

// TODO: add validation rule
describe.skip("interface implementing interface with declared relationships on three interfaces that do not implement eachother", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Episode: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Movie = new UniqueType("Movie");
        Series = new UniqueType("Series");
        Actor = new UniqueType("Actor");
        Episode = new UniqueType("Episode");
        session = await neo4j.getSession();

        // TODO: add validation rule such that this is not possible
        // interface Production implements Thing & Show & WatchableThing
        // breaks everything,
        // eg. actorConnection result would be ThingActorsConnection or WatchableThingActorsConnection? technically needs to be both bc interface implements both Thing and WatchableThing
        const typeDefs = gql`
            type ${Episode} {
                runtime: Int!
                series: ${Series}! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Thing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface WatchableThing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface Show implements Thing {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            interface Production implements Thing & Show & WatchableThing {
                title: String!
                actors: [${Actor}!]! 
            }

            type ${Movie} implements WatchableThing & Production & Show & Thing {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements WatchableThing & Production & Show & Thing {
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
    });

    afterEach(async () => {
        await session.run(
            `
                MATCH(a:${Movie})
                MATCH(b:${Series})
                MATCH(c:${Actor})

                DETACH DELETE a
                DETACH DELETE b
                DETACH DELETE c
            `
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test.only("WATCHABLE THING should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query WatchableThings {
                watchableThings {
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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["watchableThings"]).toIncludeSameMembers([
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

    test("WATCHABLE THING MOVIE CONNECTION should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

        const query = /* GraphQL */ `
            query WatchableThings {
                watchableThings {
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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data?.["watchableThings"]).toIncludeSameMembers([
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

    test("THING should read connection and return interface relationship fields", async () => {
        const actorName = "actor1";
        const actorName2 = "actor2";

        const movieTitle = "movie1";
        const movieTitle2 = "movie2";
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = "series1";
        const seriesEpisodes = faker.number.int({ max: 100000 });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const episodeNr = faker.number.int({ max: 100000 });

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

        await session.run(
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {},
        });

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
            }

            type ${Actor} implements Person {
                name: String!
                moviesCnt: Int!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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

    test("THING should read connection and return interface relationship fields", async () => {
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
                CREATE (up)-[:ACTED_IN { episodeNr: $sceneNr, screenTime: $seriesScreenTime }]->(:${AmatureProduction} { title: $amatureProductionTitle, episodeCount: $seriesEpisodes })
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
                                screenTime: seriesScreenTime,
                            },
                        },
                    ]),
                },
            },
        ]);
    });

    // test("THING MOVIE CONNECTION should read connection and return interface relationship fields", async () => {
    //     const actorName = "actor1";
    //     const actorName2 = "actor2";

    //     const movieTitle = "movie1";
    //     const movieTitle2 = "movie2";
    //     const movieRuntime = faker.number.int({ max: 100000 });
    //     const movieScreenTime = faker.number.int({ max: 100000 });

    //     const seriesTitle = "series1";
    //     const seriesEpisodes = faker.number.int({ max: 100000 });
    //     const seriesScreenTime = faker.number.int({ max: 100000 });
    //     const episodeNr = faker.number.int({ max: 100000 });

    //     const query = /* GraphQL */ `
    //         query Things {
    //             things {
    //                 title
    //                 actorsConnection {
    //                     edges {
    //                         node {
    //                             name
    //                             actedInConnection {
    //                                 edges {
    //                                     node {
    //                                         title
    //                                         ... on ${Movie} {
    //                                             runtime
    //                                             actorsConnection {
    //                                                 edges {
    //                                                     node {
    //                                                         name
    //                                                     }
    //                                                 }
    //                                             }
    //                                         }
    //                                         ... on ${Series} {
    //                                             episodeCount
    //                                         }
    //                                     }
    //                                     properties {
    //                                         screenTime
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                         properties {
    //                             ... on ActedIn {
    //                                 screenTime
    //                             }
    //                             ... on StarredIn {
    //                                 episodeNr
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     await session.run(
    //         `
    //             CREATE (a:${Actor} { name: $actorName })
    //             CREATE (a2:${Actor} { name: $actorName2 })
    //             CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
    //             CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
    //             CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
    //             CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
    //             CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
    //             CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
    //         `,
    //         {
    //             actorName,
    //             actorName2,
    //             movieTitle,
    //             movieTitle2,
    //             movieRuntime,
    //             movieScreenTime,
    //             seriesTitle,
    //             seriesEpisodes,
    //             seriesScreenTime,
    //             episodeNr,
    //         }
    //     );

    //     const gqlResult = await graphql({
    //         schema: await neoSchema.getSchema(),
    //         source: query,
    //         contextValue: neo4j.getContextValues(),
    //         variableValues: {},
    //     });

    //     expect(gqlResult.errors).toBeFalsy();

    //     expect(gqlResult.data?.["things"]).toIncludeSameMembers([
    //         {
    //             title: movieTitle,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //         {
    //             title: movieTitle2,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                     {
    //                         node: {
    //                             name: actorName2,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //         {
    //             title: seriesTitle,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             episodeNr,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //     ]);
    // });

    // test("SHOW should read connection and return interface relationship fields", async () => {
    //     const actorName = "actor1";
    //     const actorName2 = "actor2";

    //     const movieTitle = "movie1";
    //     const movieTitle2 = "movie2";
    //     const movieRuntime = faker.number.int({ max: 100000 });
    //     const movieScreenTime = faker.number.int({ max: 100000 });

    //     const seriesTitle = "series1";
    //     const seriesEpisodes = faker.number.int({ max: 100000 });
    //     const seriesScreenTime = faker.number.int({ max: 100000 });
    //     const episodeNr = faker.number.int({ max: 100000 });

    //     const query = /* GraphQL */ `
    //         query Shows {
    //             shows {
    //                 title
    //                 actorsConnection {
    //                     edges {
    //                         node {
    //                             name
    //                             actedInConnection {
    //                                 edges {
    //                                     node {
    //                                         title
    //                                         ... on ${Movie} {
    //                                             runtime
    //                                         }
    //                                         ... on ${Series} {
    //                                             episodeCount
    //                                         }
    //                                     }
    //                                     properties {
    //                                         screenTime
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                         properties {
    //                             ... on ActedIn {
    //                                 screenTime
    //                             }
    //                             ... on StarredIn {
    //                                 episodeNr
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     await session.run(
    //         `
    //             CREATE (a:${Actor} { name: $actorName })
    //             CREATE (a2:${Actor} { name: $actorName2 })
    //             CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
    //             CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
    //             CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
    //             CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
    //             CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
    //             CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
    //         `,
    //         {
    //             actorName,
    //             actorName2,
    //             movieTitle,
    //             movieTitle2,
    //             movieRuntime,
    //             movieScreenTime,
    //             seriesTitle,
    //             seriesEpisodes,
    //             seriesScreenTime,
    //             episodeNr,
    //         }
    //     );

    //     const gqlResult = await graphql({
    //         schema: await neoSchema.getSchema(),
    //         source: query,
    //         contextValue: neo4j.getContextValues(),
    //         variableValues: {},
    //     });

    //     expect(gqlResult.errors).toBeFalsy();

    //     expect(gqlResult.data?.["shows"]).toIncludeSameMembers([
    //         {
    //             title: movieTitle,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //         {
    //             title: movieTitle2,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                     {
    //                         node: {
    //                             name: actorName2,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: { title: movieTitle2, runtime: movieRuntime },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //         {
    //             title: seriesTitle,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             episodeNr,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //     ]);
    // });

    // test("SHOW MOVIE CONNECTION should read connection and return interface relationship fields", async () => {
    //     const actorName = "actor1";
    //     const actorName2 = "actor2";

    //     const movieTitle = "movie1";
    //     const movieTitle2 = "movie2";
    //     const movieRuntime = faker.number.int({ max: 100000 });
    //     const movieScreenTime = faker.number.int({ max: 100000 });

    //     const seriesTitle = "series1";
    //     const seriesEpisodes = faker.number.int({ max: 100000 });
    //     const seriesScreenTime = faker.number.int({ max: 100000 });
    //     const episodeNr = faker.number.int({ max: 100000 });

    //     const query = /* GraphQL */ `
    //         query Shows {
    //             shows {
    //                 title
    //                 actorsConnection {
    //                     edges {
    //                         node {
    //                             name
    //                             actedInConnection {
    //                                 edges {
    //                                     node {
    //                                         title
    //                                         ... on ${Movie} {
    //                                             runtime
    //                                             actorsConnection {
    //                                                 edges {
    //                                                     node {
    //                                                         name
    //                                                     }
    //                                                 }
    //                                             }
    //                                         }
    //                                         ... on ${Series} {
    //                                             episodeCount
    //                                         }
    //                                     }
    //                                     properties {
    //                                         screenTime
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                         properties {
    //                             ... on ActedIn {
    //                                 screenTime
    //                             }
    //                             ... on StarredIn {
    //                                 episodeNr
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     `;

    //     await session.run(
    //         `
    //             CREATE (a:${Actor} { name: $actorName })
    //             CREATE (a2:${Actor} { name: $actorName2 })
    //             CREATE (m:${Movie} { title: $movieTitle, runtime:$movieRuntime })
    //             CREATE (m2:${Movie} { title: $movieTitle2, runtime:$movieRuntime })
    //             CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
    //             CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
    //             CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m2)
    //             CREATE (a)-[:ACTED_IN { episodeNr: $episodeNr, screenTime: $movieScreenTime }]->(:${Series} { title: $seriesTitle, episodeCount: $seriesEpisodes })
    //         `,
    //         {
    //             actorName,
    //             actorName2,
    //             movieTitle,
    //             movieTitle2,
    //             movieRuntime,
    //             movieScreenTime,
    //             seriesTitle,
    //             seriesEpisodes,
    //             seriesScreenTime,
    //             episodeNr,
    //         }
    //     );

    //     const gqlResult = await graphql({
    //         schema: await neoSchema.getSchema(),
    //         source: query,
    //         contextValue: neo4j.getContextValues(),
    //         variableValues: {},
    //     });

    //     expect(gqlResult.errors).toBeFalsy();

    //     expect(gqlResult.data?.["shows"]).toIncludeSameMembers([
    //         {
    //             title: movieTitle,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //         {
    //             title: movieTitle2,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                     {
    //                         node: {
    //                             name: actorName2,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             screenTime: movieScreenTime,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //         {
    //             title: seriesTitle,
    //             actorsConnection: {
    //                 edges: expect.toIncludeSameMembers([
    //                     {
    //                         node: {
    //                             name: actorName,
    //                             actedInConnection: {
    //                                 edges: expect.toIncludeSameMembers([
    //                                     {
    //                                         node: {
    //                                             title: movieTitle,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: movieTitle2,
    //                                             runtime: movieRuntime,
    //                                             actorsConnection: {
    //                                                 edges: expect.toIncludeSameMembers([
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName,
    //                                                         },
    //                                                     },
    //                                                     {
    //                                                         node: {
    //                                                             name: actorName2,
    //                                                         },
    //                                                     },
    //                                                 ]),
    //                                             },
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                     {
    //                                         node: {
    //                                             title: seriesTitle,
    //                                             episodeCount: seriesEpisodes,
    //                                         },
    //                                         properties: {
    //                                             screenTime: movieScreenTime,
    //                                         },
    //                                     },
    //                                 ]),
    //                             },
    //                         },
    //                         properties: {
    //                             episodeNr,
    //                         },
    //                     },
    //                 ]),
    //             },
    //         },
    //     ]);
    // });
});

// TODO: type narrowing
// TODO: mutations
