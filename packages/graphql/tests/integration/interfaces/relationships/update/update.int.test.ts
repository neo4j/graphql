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

    test("update through relationship field", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 76907;
        const movieScreenTime = 82739;

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = 53301;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query, {
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
    });

    test("nested update through relationship field", async () => {
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
        const movieRuntime = 44372;
        const movieScreenTime = 92046;

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = 38286;

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

        await testHelper.executeCypher(
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

        const gqlResult = await testHelper.executeGraphQL(query, {
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
    });
});
