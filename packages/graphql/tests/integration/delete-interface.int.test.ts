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
import { TestHelper } from "../utils/tests-helper";

describe("delete interface relationships", () => {
    const testHelper = new TestHelper();

    const episodeType = testHelper.createUniqueType("Episode");
    const movieType = testHelper.createUniqueType("Movie");
    const seriesType = testHelper.createUniqueType("Series");
    const actorType = testHelper.createUniqueType("Actor");

    let actorName1: string;
    let actorName2: string;
    let movieTitle1: string;
    let movieTitle2: string;
    let movieRuntime1: number;
    let movieRuntime2: number;
    let movieScreenTime1: number;
    let movieScreenTime2: number;
    let seriesTitle1: string;
    let seriesTitle2: string;
    let seriesTitle3: string;
    let seriesScreenTime1: number;
    let seriesScreenTime2: number;
    let seriesScreenTime3: number;

    let nestedMovieActorScreenTime: number;

    beforeEach(async () => {
        const typeDefs = gql`
            type ${episodeType.name} {
                runtime: Int!
                series: ${seriesType.name} ! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [${actorType.name}!]! @declareRelationship
            }

            type ${movieType.name} implements Production {
                title: String!
                runtime: Int!
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${seriesType.name} implements Production {
                title: String!
                episodes: [${episodeType.name}!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${actorType.name} {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        actorName1 = "Arthur Dent";
        actorName2 = "Ford Prefect";

        movieTitle1 = "The Hitchhiker's Guide to the Galaxy";

        movieTitle2 = "The Restaurant at the End of the Universe";

        movieRuntime1 = 121;
        movieRuntime2 = 321;
        movieScreenTime1 = 455;
        movieScreenTime2 = 4325;

        seriesTitle1 = "Life, the Universe and Everything";
        seriesTitle2 = "So Long, and Thanks for All the Fish";
        seriesTitle3 = "Mostly Harmless";
        seriesScreenTime1 = 111;
        seriesScreenTime2 = 3232;
        seriesScreenTime3 = 5556;
        nestedMovieActorScreenTime = 2496;

        await testHelper.executeCypher(
            `
            CREATE (a:${actorType.name} { name: $actorName1 })
            CREATE (a2:${actorType.name} { name: $actorName2 })
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime1 }]->(:${movieType.name} { title: $movieTitle1, runtime:$movieRuntime1 })
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(m2:${movieType.name} { title: $movieTitle2, runtime:$movieRuntime2 })
            CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime1 }]->(:${seriesType.name} { title: $seriesTitle1 })
            CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime2 }]->(:${seriesType.name} { title: $seriesTitle2 })
            CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime3 }]->(:${seriesType.name} { title: $seriesTitle3 })
            CREATE (a2)-[:ACTED_IN { screenTime: $nestedMovieActorScreenTime }]->(m2)
        `,
            {
                actorName1,
                actorName2,
                movieTitle1,
                movieTitle2,
                movieRuntime1,
                movieRuntime2,
                movieScreenTime1,
                movieScreenTime2,
                seriesTitle1,
                seriesTitle2,
                seriesTitle3,
                seriesScreenTime1,
                seriesScreenTime2,
                seriesScreenTime3,
                nestedMovieActorScreenTime,
            }
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should delete one nested concrete entity", async () => {
        const query = `
            mutation DeleteActorAndMovie($name: String, $title: String) {
                ${actorType.operations.delete}(where: { name: $name }, delete: { actedIn:  { where: { node: { typename_IN: [${movieType}], title: $title } } } } ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name: actorName1, title: movieTitle1 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [actorType.operations.delete]: {
                nodesDeleted: 2,
                relationshipsDeleted: 5,
            },
        });
    });

    test("should delete one nested concrete entity using interface relationship fields", async () => {
        const query = `
            mutation DeleteActorAndMovie($name1: String, $movieScreenTime1: Int) {
                ${actorType.operations.delete}(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            where: { edge: { screenTime: $movieScreenTime1 } }
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name1: actorName1, movieScreenTime1: movieScreenTime1 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [actorType.operations.delete]: {
                nodesDeleted: 2,
                relationshipsDeleted: 5,
            },
        });
    });

    test("should delete two nested concrete entity using interface relationship fields", async () => {
        const query = `
            mutation DeleteActorAndMovie($name1: String, $movieScreenTime1: Int, $movieScreenTime2: Int) {
                ${actorType.operations.delete}(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            where: { edge: { OR: [ {screenTime: $movieScreenTime1 }, { screenTime: $movieScreenTime2 } ]} } 
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                name1: actorName1,
                movieScreenTime1: movieScreenTime1,
                movieScreenTime2: movieScreenTime2,
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [actorType.operations.delete]: {
                nodesDeleted: 3,
                relationshipsDeleted: 6,
            },
        });
    });

    test("should be possible to double nested delete", async () => {
        const query = `
            mutation DeleteActorAndMovie($name1: String, $movieTitle2: String, $name2: String) {
                ${actorType.operations.delete}(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            where: { node: { title: $movieTitle2 } }
                            delete: {
                                actors: {
                                    where: { node: { name: $name2 } }
                                }
                            }
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name1: actorName1, movieTitle2: movieTitle2, name2: actorName2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [actorType.operations.delete]: {
                nodesDeleted: 3,
                relationshipsDeleted: 6,
            },
        });
    });
});
