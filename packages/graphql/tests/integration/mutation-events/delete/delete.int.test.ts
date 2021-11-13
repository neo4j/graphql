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

import { gql } from "apollo-server";
import faker from "faker";
import { graphql } from "graphql";
import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import { localEventEmitter } from "../../../../src/utils/pubsub";
import neo4j from "../../neo4j";

describe("mutation events (delete)", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;
    const events: { event: string | symbol, payload: any }[] = [];
    function onEvent(event: string | symbol, payload) {
        events.push({ event, payload });
    }

    beforeAll(async () => {
        driver = await neo4j();

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
        localEventEmitter.addAnyListener(onEvent);
    });

    beforeEach(() => {
        events.splice(0);
    });

    afterAll(async () => {
        await driver.close();
        localEventEmitter.removeAnyListener(onEvent);
    });

    test("should delete delete using interface relationship fields and emit events", async () => {
        const session = driver.session();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.random.number();

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
                }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { bookmarks: session.lastBookmark() },
                },
                variableValues: { name: actorName, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 2,
                },
            });
            expect(events).toHaveLength(2);
            expect(events[0]).toMatchObject({
                event: 'Movie.Deleted',
                payload: { },
            });
            expect(events[1]).toMatchObject({
                event: 'Actor.Deleted',
                payload: { },
            });
        } finally {
            await session.close();
        }
    });

    test("should nested delete delete using interface relationship fields", async () => {
        const session = driver.session();

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
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.random.number();

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
                }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { bookmarks: session.lastBookmark() },
                },
                variableValues: { name1: actorName1, name2: actorName2, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 3,
                    relationshipsDeleted: 3,
                },
            });
            expect(events).toHaveLength(3);
            expect(events[0]).toMatchObject({
                event: 'Movie.Deleted',
            });
            expect(events[1]).toMatchObject({
                event: 'Actor.Deleted',
            });
            expect(events[2]).toMatchObject({
                event: 'Actor.Deleted',
            });
        } finally {
            await session.close();
        }
    });

    test("should nested delete through interface relationship fields using _on to delete from particular type", async () => {
        const session = driver.session();

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
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesScreenTime = faker.random.number();

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
                }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { bookmarks: session.lastBookmark() },
                },
                variableValues: { name1: actorName1, name2: actorName2, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 4,
                    relationshipsDeleted: 4,
                },
            });
            expect(events).toHaveLength(4);
            expect(events[0]).toMatchObject({
                event: 'Movie.Deleted',
            });
            expect(events[1]).toMatchObject({
                event: 'Actor.Deleted',
            });
            expect(events[2]).toMatchObject({
                event: 'Series.Deleted',
            });
            expect(events[3]).toMatchObject({
                event: 'Actor.Deleted',
            });
        } finally {
            await session.close();
        }
    });
});
