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

import { generate } from "randomstring";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("interface relationships", () => {
    const testHelper = new TestHelper();
    let Episode: UniqueType;
    let Actor: UniqueType;
    let Movie: UniqueType;
    let Series: UniqueType;

    beforeAll(async () => {
        Episode = testHelper.createUniqueType("Episode");
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
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
                episodes: [${Episode}!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
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

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create create using interface relationship fields", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 73876;
        const movieScreenTime = 15855;

        const query = `
            mutation CreateActorConnectMovie($name: String!, $title: String!, $runtime: Int!, $screenTime: Int!) {
                ${Actor.operations.create}(
                    input: [
                        {
                            name: $name
                            actedIn: {
                                create: {
                                    edge: { screenTime: $screenTime }
                                    node: { ${Movie}: { title: $title, runtime: $runtime } }
                                }
                            }
                        }
                    ]
                ) {
                    ${Actor.plural} {
                        name
                        actedIn {
                            title
                            ... on ${Movie} {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                name: actorName,
                title: movieTitle,
                runtime: movieRuntime,
                screenTime: movieScreenTime,
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.create]: {
                [Actor.plural]: [
                    {
                        actedIn: [
                            {
                                runtime: movieRuntime,
                                title: movieTitle,
                            },
                        ],
                        name: actorName,
                    },
                ],
            },
        });
    });

    test("should create create nested nodes using interface relationship fields", async () => {
        const name1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const name2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 81094;
        const screenTime = 79933;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const episodeRuntime = 13437;

        const query = `
            mutation CreateActorConnectMovie(
                $name1: String!
                $name2: String!
                $movieTitle: String!
                $movieRuntime: Int!
                $screenTime: Int!
                $seriesTitle: String!
                $episodeRuntime: Int!
            ) {
                ${Actor.operations.create}(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                create: [
                                    {
                                        edge: { screenTime: $screenTime }
                                        node: {
                                            ${Movie}: {
                                                title: $movieTitle
                                                runtime: $movieRuntime
                                                actors: {
                                                    create: {
                                                        edge: { screenTime: $screenTime }
                                                        node: { name: $name2 }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    {
                                        edge: { screenTime: $screenTime }
                                        node: {
                                            ${Series}: {
                                                title: $seriesTitle
                                                episodes: { create: { node: { runtime: $episodeRuntime } } }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    ${Actor.plural} {
                        name
                        actedIn {
                            title
                            actors {
                                name
                            }
                            ... on ${Movie} {
                                runtime
                            }
                            ... on ${Series} {
                                episodes {
                                    runtime
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                name1,
                name2,
                movieTitle,
                movieRuntime,
                screenTime,
                seriesTitle,
                episodeRuntime,
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.create]: {
                [Actor.plural]: [
                    {
                        actedIn: expect.toIncludeSameMembers([
                            {
                                runtime: movieRuntime,
                                title: movieTitle,
                                actors: expect.toIncludeSameMembers([{ name: name2 }, { name: name1 }]),
                            },
                            {
                                title: seriesTitle,
                                actors: [{ name: name1 }],
                                episodes: [{ runtime: episodeRuntime }],
                            },
                        ]),
                        name: name1,
                    },
                ],
            },
        });
    });
});
