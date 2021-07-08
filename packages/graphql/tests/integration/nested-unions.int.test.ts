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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("Nested unions", () => {
    const typeDefs = gql`
        type Movie {
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
        }

        type Series {
            name: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
        }

        union Production = Movie | Series

        type LeadActor {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
        }

        type Extra {
            name: String
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
        }

        union Actor = LeadActor | Extra
    `;

    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("chain multiple connects, all for union relationships", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = driver.session();
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const seriesName = generate({ charset: "alphabetic" });

        const source = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    connect: {
                        actors: {
                            LeadActor: {
                                where: { node: { name: "${actorName}" } }
                                connect: { actedIn: { Series: { where: { node: { name: "${seriesName}" } } } } }
                            }
                        }
                    }
                ) {
                    movies {
                        title
                        actors {
                            ... on LeadActor {
                                name
                                actedIn {
                                    ... on Series {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:Movie {title:$movieTitle})
                    CREATE (:LeadActor {name:$actorName})
                    CREATE (:Series {name:$seriesName})
                `,
                { movieTitle, seriesName, actorName }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source,
                contextValue: { driver },
            });
            expect(gqlResult.errors).toBeFalsy();
            // expect(gqlResult.data?.updateMovies.movies).toEqual([
            //     {
            //         title: movieTitle,
            //         actors: [
            //             {
            //                 name: actorName,
            //                 actedIn: [
            //                     {},
            //                     {
            //                         name: seriesName,
            //                     },
            //                 ],
            //             },
            //         ],
            //     },
            // ]);
            expect(gqlResult.data?.updateMovies.movies[0].title).toEqual(movieTitle);
            expect(gqlResult.data?.updateMovies.movies[0].actors[0].name).toEqual(actorName);
            expect(gqlResult.data?.updateMovies.movies[0].actors[0].actedIn).toContainEqual({
                name: seriesName,
            });
        } finally {
            await session.close();
        }
    });

    test("chain multiple disconnects, all for union relationships", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = driver.session();
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const seriesName = generate({ charset: "alphabetic" });

        const source = `
            mutation {
                updateMovies(
                    where: { title: "${movieTitle}" }
                    disconnect: {
                        actors: {
                            LeadActor: {
                                where: { node: { name: "${actorName}" } }
                                disconnect: { actedIn: { Series: { where: { node: { name: "${seriesName}" } } } } }
                            }
                        }
                    }
                ) {
                    movies {
                        title
                        actors {
                            ... on LeadActor {
                                name
                                actedIn {
                                    ... on Series {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:Movie {title:$movieTitle})<-[:ACTED_IN]-(:LeadActor {name:$actorName})-[:ACTED_IN]->(:Series {name:$seriesName})
                `,
                { movieTitle, seriesName, actorName }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source,
                contextValue: { driver },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.updateMovies.movies).toEqual([
                {
                    title: movieTitle,
                    actors: [],
                },
            ]);

            const cypherMovie = `
                MATCH (:Movie {title: $movieTitle})
                        <-[actedIn:ACTED_IN]-
                            (:LeadActor {name: $actorName})
                RETURN actedIn
            `;

            const neo4jResultMovie = await session.run(cypherMovie, { movieTitle, actorName });
            expect(neo4jResultMovie.records).toHaveLength(0);

            const cypherSeries = `
                MATCH (:Series {name: $seriesName})
                        <-[actedIn:ACTED_IN]-
                            (:LeadActor {name: $actorName})
                RETURN actedIn
            `;

            const neo4jResultSeries = await session.run(cypherSeries, { seriesName, actorName });
            expect(neo4jResultSeries.records).toHaveLength(0);
        } finally {
            await session.close();
        }
    });
});
