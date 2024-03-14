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

    test("update through relationship field", async () => {
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

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.number.int({ max: 100000 });

        const query = `
            mutation UpdateUpdate($name: String, $oldTitle: String, $newTitle: String) {
                ${Actor.operations.update}(
                    where: { name: $name }
                    update: {
                        actedIn: { where: { node: { title: $oldTitle } }, update: { node: { title: $newTitle } } }
                    }
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
                variableValues: {
                    name: actorName,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                [Actor.operations.update]: {
                    [Actor.plural]: [
                        {
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    runtime: movieRuntime,
                                    title: movieNewTitle,
                                },
                                {
                                    title: seriesTitle,
                                },
                            ]),
                            name: actorName,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("nested update through relationship field", async () => {
        const session = await neo4j.getSession();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorNewName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.number.int({ max: 100000 });
        const movieScreenTime = faker.number.int({ max: 100000 });

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.number.int({ max: 100000 });

        const query = `
            mutation UpdateUpdate($name: String, $newName: String, $oldTitle: String, $newTitle: String) {
                ${Actor.operations.update}(
                    where: { name: $name }
                    update: {
                        actedIn: {
                            where: { node: { title: $oldTitle } }
                            update: { node: { title: $newTitle, actors: { update: { node: { name: $newName } } } } }
                        }
                    }
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
                variableValues: {
                    name: actorName,
                    newName: actorNewName,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                [Actor.operations.update]: {
                    [Actor.plural]: [
                        {
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    runtime: movieRuntime,
                                    title: movieNewTitle,
                                },
                                {
                                    title: seriesTitle,
                                },
                            ]),
                            name: actorNewName,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });
});
