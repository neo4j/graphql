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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src";
import Neo4j from "./neo4j";

describe("delete union relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = gql`
            type Episode {
                runtime: Int!
                series: Series! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            union Production = Movie | Series

            type Movie {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series {
                title: String!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should delete one nested concrete entity", async () => {
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
        const seriesTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesTitle3 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.number.int({ max: 100000 });
        const seriesScreenTime2 = faker.number.int({ max: 100000 });
        const seriesScreenTime3 = faker.number.int({ max: 100000 });

        const query = `
            mutation DeleteActorAndMovie($name: String, $title: String) {
                deleteActors(where: { name: $name }, delete: { actedIn: { Movie: { where: { node: { title: $title } } } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime2 }]->(:Series { title: $seriesTitle2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime3 }]->(:Series { title: $seriesTitle3 })
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesTitle2,
                    seriesTitle3,
                    seriesScreenTime,
                    seriesScreenTime2,
                    seriesScreenTime3,
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
                deleteActors: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 4,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should delete one nested concrete entity using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieRuntime1 = faker.number.int({ max: 100000 });
        const movieRuntime2 = faker.number.int({ max: 100000 });
        const movieScreenTime1 = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });

        const seriesTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesTitle3 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime1 = faker.number.int({ max: 100000 });
        const seriesScreenTime2 = faker.number.int({ max: 100000 });
        const seriesScreenTime3 = faker.number.int({ max: 100000 });

        const query = `
            mutation DeleteActorAndMovie($name1: String, $movieScreenTime1: Int) {
                deleteActors(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            Movie: {
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

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName1 })
                CREATE (a2:Actor { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime1 }]->(:Movie { title: $movieTitle1, runtime:$movieRuntime1 })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(:Movie { title: $movieTitle2, runtime:$movieRuntime2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime1 }]->(:Series { title: $seriesTitle1 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime2 }]->(:Series { title: $seriesTitle2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime3 }]->(:Series { title: $seriesTitle3 })
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
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: { name1: actorName1, movieScreenTime1: movieScreenTime1 },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 5,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should delete two nested concrete entity using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieRuntime1 = faker.number.int({ max: 100000 });
        const movieRuntime2 = faker.number.int({ max: 100000 });
        const movieScreenTime1 = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });

        const seriesTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesTitle3 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime1 = faker.number.int({ max: 100000 });
        const seriesScreenTime2 = faker.number.int({ max: 100000 });
        const seriesScreenTime3 = faker.number.int({ max: 100000 });

        const query = `
            mutation DeleteActorAndMovie($name1: String, $movieScreenTime1: Int, $movieScreenTime2: Int) {
                deleteActors(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            Movie:  [ 
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

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName1 })
                CREATE (a2:Actor { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime1 }]->(:Movie { title: $movieTitle1, runtime:$movieRuntime1 })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(:Movie { title: $movieTitle2, runtime:$movieRuntime2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime1 }]->(:Series { title: $seriesTitle1 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime2 }]->(:Series { title: $seriesTitle2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime3 }]->(:Series { title: $seriesTitle3 })
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
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: { name1: actorName1, movieScreenTime1: movieScreenTime1, movieScreenTime2: movieScreenTime2 },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 3,
                    relationshipsDeleted: 5,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should be possible to double nested delete", async () => {
        const session = await neo4j.getSession();

        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieRuntime1 = faker.number.int({ max: 100000 });
        const movieRuntime2 = faker.number.int({ max: 100000 });
        const movieScreenTime1 = faker.number.int({ max: 100000 });
        const movieScreenTime2 = faker.number.int({ max: 100000 });
        const movieActorScreenTime = faker.number.int({ max: 100000 });

        const seriesTitle1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesTitle3 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime1 = faker.number.int({ max: 100000 });
        const seriesScreenTime2 = faker.number.int({ max: 100000 });
        const seriesScreenTime3 = faker.number.int({ max: 100000 });

        const query = `
            mutation DeleteActorAndMovie($name1: String, $movieRuntime1: Int, $name2: String) {
                deleteActors(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            Movie: {
                                where: { node: { runtime: $movieRuntime1 } }
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

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName1 })
                CREATE (a2:Actor { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime1 }]->(m1:Movie { title: $movieTitle1, runtime:$movieRuntime1 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieActorScreenTime }]->(m1)

                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime2 }]->(:Movie { title: $movieTitle2, runtime:$movieRuntime2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime1 }]->(:Series { title: $seriesTitle1 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime2 }]->(:Series { title: $seriesTitle2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime3 }]->(:Series { title: $seriesTitle3 })
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
                    movieActorScreenTime,
                    seriesTitle1,
                    seriesTitle2,
                    seriesTitle3,
                    seriesScreenTime1,
                    seriesScreenTime2,
                    seriesScreenTime3,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
                variableValues: { name1: actorName1, movieRuntime1: movieRuntime1, name2: actorName2 },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 3,
                    relationshipsDeleted: 6,
                },
            });
        } finally {
            await session.close();
        }
    });
});
