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

    test("should nested create connect using interface relationship fields", async () => {
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

        const query = `
            mutation CreateActorConnectMovie($name1: String!, $title: String, $screenTime: Int!, $name2: String) {
                ${Actor.operations.create}(
                    input: [
                        {
                            name: $name1
                            actedIn: {
                                connect: {
                                    edge: { screenTime: $screenTime }
                                    where: { node: { title: $title } }
                                    connect: {
                                        actors: { edge: { ActedIn: { screenTime: $screenTime } }, where: { node: { name: $name2 } } }
                                    }
                                }
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
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (:${Actor} { name: $name })
            `,
                { movieTitle, movieRuntime, name: actorName2 }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: {
                    name1: actorName1,
                    title: movieTitle,
                    screenTime: movieScreenTime,
                    name2: actorName2,
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
                                    actors: expect.toIncludeSameMembers([{ name: actorName2 }, { name: actorName1 }]),
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
