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
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src";
import Neo4j from "./neo4j";
import { UniqueType } from "../utils/graphql-types";
import { cleanNodes } from "../utils/clean-nodes";

describe("delete union relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    const episodeType = new UniqueType("Episode");
    const movieType = new UniqueType("Movie");
    const seriesType = new UniqueType("Series");
    const actorType = new UniqueType("Actor");

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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = gql`
            type ${episodeType.name} {
                runtime: Int!
                series: ${seriesType.name} ! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            union Production = ${movieType.name} | ${seriesType.name}

            type ${movieType.name} {
                title: String!
                runtime: Int!
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${seriesType.name} {
                title: String!
                episodes: [${episodeType.name}!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${actorType.name} {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    beforeEach(async () => {
        actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        movieTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });

        movieTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        movieRuntime1 = faker.number.int({ max: 100000 });
        movieRuntime2 = faker.number.int({ max: 100000 });
        movieScreenTime1 = faker.number.int({ max: 100000 });
        movieScreenTime2 = faker.number.int({ max: 100000 });

        seriesTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        seriesTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        seriesTitle3 = generate({
            readable: true,
            charset: "alphabetic",
        });
        seriesScreenTime1 = faker.number.int({ max: 100000 });
        seriesScreenTime2 = faker.number.int({ max: 100000 });
        seriesScreenTime3 = faker.number.int({ max: 100000 });
        nestedMovieActorScreenTime = faker.number.int({ max: 100000 });

        session = await neo4j.getSession();
        await session.run(
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
        await cleanNodes(session, [episodeType, movieType, seriesType, actorType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should delete one nested concrete entity", async () => {
        const query = `
            mutation DeleteActorAndMovie($name: String, $title: String) {
                ${actorType.operations.delete}(where: { name: $name }, delete: { actedIn: { ${movieType.name}: { where: { node: { title: $title } } } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
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
                            ${movieType.name}: {
                                where: { edge: { screenTime: $movieScreenTime1 } }
                            }
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
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
                            ${movieType.name}:  [ 
                                { where: { edge: { screenTime: $movieScreenTime1 } } }
                                { where: { edge: { screenTime: $movieScreenTime2 } } }
                            ]
                        }
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
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
            mutation DeleteActorAndMovie($name1: String, $movieRuntime2: Int, $name2: String) {
                ${actorType.operations.delete}(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            ${movieType.name}: {
                                where: { node: { runtime: $movieRuntime2 } }
                                delete: {
                                    actors: {
                                        where: { node: { name: $name2 } }
                                    }
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { name1: actorName1, movieRuntime2: movieRuntime2, name2: actorName2 },
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
