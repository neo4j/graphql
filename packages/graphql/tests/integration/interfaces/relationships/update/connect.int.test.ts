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

    beforeEach(async () => {
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

    afterEach(async () => {
        await testHelper.close();
    });

    test("should connect using interface relationship fields", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 68296;
        const movieScreenTime = 45708;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = 69129;

        const query = `
            mutation ConnectMovie($name: String, $title: String, $screenTime: Int!) {
                ${Actor.operations.update}(
                    where: { name: $name }
                    connect: { actedIn: { edge: { screenTime: $screenTime }, where: { node: { title: $title } } } }
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

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle })
            `,
            { actorName, movieTitle, movieRuntime, seriesTitle, seriesScreenTime }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name: actorName, title: movieTitle, screenTime: movieScreenTime },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.update]: {
                [Actor.plural]: [
                    {
                        actedIn: expect.toIncludeSameMembers([
                            {
                                runtime: movieRuntime,
                                title: movieTitle,
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
    });

    test("should nested connect using interface relationship fields", async () => {
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
        const movieRuntime = 67082;
        const movieScreenTime = 39674;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = 86317;

        const query = `
            mutation ConnectMovie($name1: String, $name2: String, $title: String, $screenTime: Int!) {
                ${Actor.operations.update}(
                    where: { name: $name1 }
                    connect: {
                        actedIn: {
                            edge: { screenTime: $screenTime }
                            where: { node: { title: $title } }
                            connect: {
                                actors: { edge: { ActedIn: { screenTime: $screenTime } }, where: { node: { name: $name2 } } }
                            }
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

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName1 })
                CREATE (:${Actor} { name: $actorName2 })
                CREATE (:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle })
            `,
            { actorName1, actorName2, movieTitle, movieRuntime, seriesTitle, seriesScreenTime }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                name1: actorName1,
                name2: actorName2,
                title: movieTitle,
                screenTime: movieScreenTime,
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
                                title: movieTitle,
                                actors: expect.toIncludeSameMembers([{ name: actorName2 }, { name: actorName1 }]),
                            },
                            {
                                title: seriesTitle,
                                actors: [{ name: actorName1 }],
                            },
                        ]),
                        name: actorName1,
                    },
                ],
            },
        });
    });
});
