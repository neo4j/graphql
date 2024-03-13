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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import { cleanNodesUsingSession } from "../../../utils/clean-nodes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4jHelper from "../../neo4j";

describe("interface relationships", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let Episode: UniqueType;
    let Actor: UniqueType;
    let Movie: UniqueType;
    let Series: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        Episode = new UniqueType("Episode");
        Actor = new UniqueType("Actor");
        Movie = new UniqueType("Movie");
        Series = new UniqueType("Series");

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [Actor, Movie, Series, Episode]);
        await driver.close();
    });

    test("should disconnect using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.number.int({ max: 100000 });

        const query = `
            mutation DisconnectMovie($name: String, $title: String) {
                ${Actor.operations.update}(where: { name: $name }, disconnect: { actedIn: { where: { node: { title: $title } } } }) {
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

        try {
            await session.run(
                `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle })
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: { name: actorName, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                [Actor.operations.update]: {
                    [Actor.plural]: [
                        {
                            actedIn: [
                                {
                                    title: seriesTitle,
                                },
                            ],
                            name: actorName,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should nested disconnect using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.number.int({ max: 100000 });

        const query = `
            mutation DisconnectMovie($name1: String, $name2: String, $title: String) {
                ${Actor.operations.update}(
                    where: { name: $name1 }
                    disconnect: {
                        actedIn: {
                            where: { node: { title: $title } }
                            disconnect: { actors: { where: { node: { name: $name2 } } } }
                        }
                    }
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
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:${Actor} { name: $actorName1 })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${Movie} { title: $movieTitle, runtime:$movieRuntime })<-[:ACTED_IN]-(aa:${Actor} { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle })<-[:ACTED_IN]-(aa)
            `,
                {
                    actorName1,
                    actorName2,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: { name1: actorName1, name2: actorName2, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                [Actor.operations.update]: {
                    [Actor.plural]: [
                        {
                            actedIn: [
                                {
                                    title: seriesTitle,
                                    actors: expect.toIncludeSameMembers([{ name: actorName1 }, { name: actorName2 }]),
                                },
                            ],
                            name: actorName1,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });
});
