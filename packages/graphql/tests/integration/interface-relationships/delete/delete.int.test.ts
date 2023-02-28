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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { faker } from "@faker-js/faker";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("interface relationships", () => {
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

            interface Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production {
                title: String!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should delete delete using interface relationship fields", async () => {
        const session = await neo4j.getSession();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation DeleteActorAndMovie($name: String, $title: String) {
                deleteActors(where: { name: $name }, delete: { actedIn: { where: { node: { title: $title } } } }) {
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
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                },
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name: actorName, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 2,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should nested delete delete using interface relationship fields", async () => {
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
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation DeleteActorAndMovie($name1: String, $name2: String, $title: String) {
                deleteActors(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            where: { node: { title: $title } }
                            delete: { actors: { where: { node: { name: $name2 } } } }
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
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })<-[:ACTED_IN]-(aa:Actor { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle })
            `,
                {
                    actorName1,
                    actorName2,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                },
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name1: actorName1, name2: actorName2, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 3,
                    relationshipsDeleted: 3,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should nested delete through interface relationship fields using _on to delete from particular type", async () => {
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
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation DeleteActorAndMovie($name1: String, $name2: String, $title: String) {
                deleteActors(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            where: { node: { title: $title } }
                            delete: { _on: { Movie: { actors: { where: { node: { name: $name2 } } } } } }
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
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })<-[:ACTED_IN]-(:Actor { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $movieTitle })<-[:ACTED_IN]-(:Actor { name: $actorName2 })
            `,
                {
                    actorName1,
                    actorName2,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesScreenTime,
                },
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name1: actorName1, name2: actorName2, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 4,
                    relationshipsDeleted: 4,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should nested delete through interface relationship fields using _on to only delete certain type", async () => {
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
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation DeleteActorAndMovie($name1: String, $name2: String, $title: String) {
                deleteActors(
                    where: { name: $name1 }
                    delete: {
                        actedIn: {
                            where: { node: { _on: { Movie: { title: $title } } } }
                            delete: { actors: { where: { node: { name: $name2 } } } }
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
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })<-[:ACTED_IN]-(:Actor { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $movieTitle })<-[:ACTED_IN]-(:Actor { name: $actorName2 })
            `,
                {
                    actorName1,
                    actorName2,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesScreenTime,
                },
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { name1: actorName1, name2: actorName2, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 3,
                    relationshipsDeleted: 3,
                },
            });
        } finally {
            await session.close();
        }
    });
});
