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

describe("union relationships", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeSeries: UniqueType;
    let typeActor: UniqueType;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeSeries = testHelper.createUniqueType("Series");
        typeActor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
        type ${typeMovie}  {
            title: String!
            runtime: Int!
        }
        
        type ${typeSeries}  {
            title: String!
            episodes: Int!
        }

        union Production = ${typeMovie} | ${typeSeries}
        
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

    test("should read and return union relationship fields with union relationship filter SOME", async () => {
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
        const movieRuntime = 18723;
        const movieScreenTime = 83582;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 50148;
        const seriesScreenTime = 8697;

        const query = /* GraphQL */ `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_SOME: { ${typeMovie}: { title: $title } } }) {
                    name
                    actedIn {
                        ... on ${typeMovie} {
                            title
                            runtime
                        }
                        ... on ${typeSeries} {
                            title
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

    test("should read and return union relationship fields with union relationship filter ALL (one out of two implementations in the input and DB)", async () => {
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
        const movieRuntime = 61632;
        const movieScreenTime = 69036;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 61753;
        const seriesScreenTime = 51960;

        const query = /* GraphQL */ `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_ALL: { ${typeMovie}: { title: $title }} }) {
                    name
                    actedIn {
                        ... on ${typeMovie} {
                            title
                            runtime
                        }
                        ... on ${typeSeries} {
                            title
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
            [typeActor.plural]: expect.toIncludeSameMembers([
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
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: movieTitle,
                        },
                    ]),
                    name: actorName2,
                },
            ]),
        });
    });

    test("should read and return union relationship fields with union relationship filter ALL (both implementations in the input and DB)", async () => {
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
        const movieRuntime = 25423;
        const movieScreenTime = 26354;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 36248;
        const seriesScreenTime = 74985;

        const query = /* GraphQL */ `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_ALL: { ${typeMovie}: { title: $title }, ${typeSeries}: { title: $title } } }) {
                    name
                    actedIn {
                        ... on ${typeMovie} {
                            title
                            runtime
                        }
                        ... on ${typeSeries} {
                            title
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

    test("should read and return union relationship fields with union relationship filter ALL (both implementations in the input and one out of two in DB)", async () => {
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
        const movieRuntime = 24426;
        const movieScreenTime = 65872;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 84714;
        const seriesScreenTime = 26046;

        const query = /* GraphQL */ `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_ALL: { ${typeMovie}: { title: $title }, ${typeSeries}: { title: $title } } }) {
                    name
                    actedIn {
                        ... on ${typeMovie} {
                            title
                            runtime
                        }
                        ... on ${typeSeries} {
                            title
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
        const movieRuntime = 55815;
        const movieScreenTime = 86611;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 61405;
        const seriesScreenTime = 64097;

        const query = /* GraphQL */ `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_SINGLE: { ${typeMovie}: { title: $title } } }) {
                    name
                    actedIn {
                        ... on ${typeMovie} {
                            title
                            runtime
                        }
                        ... on ${typeSeries} {
                            title
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
        const movieRuntime = 9931;
        const movieScreenTime = 29383;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 15912;
        const seriesScreenTime = 72093;

        const query = /* GraphQL */ `
            query Actors($title: String) {
                ${typeActor.plural}(where: { actedIn_NONE: { ${typeMovie}:{ title: $title }, ${typeSeries}:{ title: $title } } }) {
                    name
                    actedIn {
                        ... on ${typeMovie} {
                            title
                            runtime
                        }
                        ... on ${typeSeries} {
                            title
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
