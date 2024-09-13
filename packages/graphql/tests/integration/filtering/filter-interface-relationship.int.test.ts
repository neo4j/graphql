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
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

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

    test("should read and return interface relationship fields with interface relationship filter SOME", async () => {
        const actorName = generate({
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
        const movieTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 96406;
        const movieScreenTime = 9448;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 56834;
        const seriesScreenTime = 3167;

        const query = `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_SOME: { title: $title } }) {
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
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle2, runtime:$movieRuntime })
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { title: movieTitle2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: movieTitle2,
                        },
                    ]),
                    name: actorName2,
                },
            ],
        });
    });

    test("should read and return interface relationship fields with interface relationship filter ALL (both implementations in the input and DB)", async () => {
        const actorName = generate({
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
        const movieRuntime = 47026;
        const movieScreenTime = 85740;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 3093;
        const seriesScreenTime = 96705;

        const query = `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_ALL: { title: $title } }) {
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
                CREATE (m:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a2)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $movieTitle, episodes: $seriesEpisodes })
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { title: movieTitle },
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
                            title: movieTitle,
                        },
                    ]),
                    name: actorName2,
                },
            ],
        });
    });

    test("should read and return interface relationship fields with interface relationship filter ALL (both implementations in the input and one out of two in DB)", async () => {
        const actorName = generate({
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
        const movieRuntime = 46474;
        const movieScreenTime = 95753;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 8658;
        const seriesScreenTime = 76273;

        const query = `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_ALL: { title: $title } }) {
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
                CREATE (m:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { title: movieTitle },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [],
        });
    });

    test("should read and return interface relationship fields with interface relationship filter SINGLE", async () => {
        const actorName = generate({
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
        const movieTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 51686;
        const movieScreenTime = 60481;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 18888;
        const seriesScreenTime = 75798;

        const query = `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_SINGLE: { title: $title } }) {
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
                CREATE (m:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { title: movieTitle2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: movieTitle2,
                        },
                        {
                            runtime: movieRuntime,
                            title: movieTitle,
                        },
                    ]),
                    name: actorName2,
                },
            ],
        });
    });

    test("should read and return interface relationship fields with interface relationship filter NONE", async () => {
        const actorName = generate({
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
        const movieTitle2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 13985;
        const movieScreenTime = 20492;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 4471;
        const seriesScreenTime = 70112;

        const query = `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_NONE: { title: $title } }) {
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
                CREATE (m:${typeMovie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { title: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { title: $movieTitle2, runtime:$movieRuntime })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
            `,
            {
                actorName,
                actorName2,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { title: movieTitle2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [typeActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            episodes: seriesEpisodes,
                            title: seriesTitle,
                        },
                        {
                            runtime: movieRuntime,
                            title: movieTitle,
                        },
                    ]),
                    name: actorName,
                },
            ],
        });
    });
});
