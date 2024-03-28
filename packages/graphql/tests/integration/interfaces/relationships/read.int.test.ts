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
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("interface relationships", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeSeries: UniqueType;
    let typeActor: UniqueType;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeSeries = testHelper.createUniqueType("Series");
        typeActor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type ${typeMovie} implements Production {
                title: String!
                runtime: Int!
            }

            type ${typeSeries} implements Production {
                title: String!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type ${typeActor} {
                name: String!
                currentlyActingIn: Production @relationship(type: "CURRENTLY_ACTING_IN", direction: OUT)
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

    test("should read and return interface relationship fields", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 88052;
        const movieScreenTime = 47337;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 45953;
        const seriesScreenTime = 99847;

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
            `,
            { actorName, movieTitle, movieRuntime, movieScreenTime, seriesTitle, seriesEpisodes, seriesScreenTime }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name: actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: movieTitle,
                        },
                        {
                            episodes: seriesEpisodes,
                            title: seriesTitle,
                        },
                    ]),
                    name: actorName,
                },
            ],
        });
    });

    test("should read and return sorted interface relationship fields", async () => {
        const actor = {
            name: generate({
                readable: true,
                charset: "alphabetic",
            }),
        };

        const movie1 = {
            title: "A",
            runtime: 23408,
            screenTime: 40446,
        };

        const movie2 = {
            title: "B",
            runtime: 76130,
            screenTime: 89440,
        };

        const series1 = {
            title: "C",
            episodes: 64675,
            screenTime: 83928,
        };

        const series2 = {
            title: "D",
            episodes: 8135,
            screenTime: 83728,
        };

        const query = /* GraphQL */ `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn(options: { sort: [{ title: DESC }] }) {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${typeActor} { name: $actor.name })
                CREATE (:${typeMovie} { title: $movie1.title, runtime:$movie1.runtime })<-[:ACTED_IN { screenTime: $movie1.screenTime }]-(a)-[:ACTED_IN { screenTime: $movie2.screenTime }]->(:${typeMovie} { title: $movie2.title, runtime: $movie2.runtime })
                CREATE (:${typeSeries} { title: $series1.title, episodes: $series1.episodes })<-[:ACTED_IN { screenTime: $series1.screenTime }]-(a)-[:ACTED_IN { screenTime: $series2.screenTime }]->(:${typeSeries} { title: $series2.title, episodes: $series2.episodes })
            `,
            { actor, movie1, movie2, series1, series2 }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name: actor.name },
        });

        expect(gqlResult.errors).toBeFalsy();

        const [gqlActor] = (gqlResult.data as any)[typeActor.plural] as any[];

        expect(gqlActor.name).toEqual(actor.name);
        expect(gqlActor.actedIn).toHaveLength(4);
        expect(gqlActor.actedIn[0]).toEqual({ title: series2.title, episodes: series2.episodes });
        expect(gqlActor.actedIn[1]).toEqual({ title: series1.title, episodes: series1.episodes });
        expect(gqlActor.actedIn[2]).toEqual({ title: movie2.title, runtime: movie2.runtime });
        expect(gqlActor.actedIn[3]).toEqual({ title: movie1.title, runtime: movie1.runtime });
    });

    test("should read and return non-array interface relationship fields", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 85953;
        const movieScreenTime = 50667;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 85490;
        const seriesScreenTime = 1726;

        const newMovieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const newMovieRuntime = 6106;

        const query = `
            query Actors($name: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    currentlyActingIn {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a)-[:CURRENTLY_ACTING_IN]->(:${typeMovie} { title: $newMovieTitle, runtime: $newMovieRuntime })
            `,
            {
                actorName,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
                newMovieTitle,
                newMovieRuntime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name: actorName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    currentlyActingIn: {
                        title: newMovieTitle,
                        runtime: newMovieRuntime,
                    },
                    name: actorName,
                },
            ],
        });
    });

    test("should read and return interface relationship fields with shared where", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 76300;
        const movieScreenTime = 28270;

        const seriesEpisodes = 52388;
        const seriesScreenTime = 70458;

        const query = `
            query Actors($name: String, $title: String) {
                ${typeActor.plural}(where: { name: $name }) {
                    name
                    actedIn(where: { title: $title }) {
                        title
                        ... on ${typeMovie} {
                            runtime
                        }
                        ... on ${typeSeries} {
                            episodes
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: "Apple", runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: "Apple", episodes: $seriesEpisodes })
            `,
            { actorName, movieTitle, movieRuntime, movieScreenTime, seriesEpisodes, seriesScreenTime }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name: actorName, title: "Apple" },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: "Apple",
                        },
                        {
                            episodes: seriesEpisodes,
                            title: "Apple",
                        },
                    ]),
                    name: actorName,
                },
            ],
        });
    });
});
