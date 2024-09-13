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
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("interface relationships aliased fields", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let typeMovie: UniqueType;
    let typeSeries: UniqueType;
    let typeActor: UniqueType;
    let ProtectedActor: UniqueType;

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeSeries = testHelper.createUniqueType("Series");
        typeActor = testHelper.createUniqueType("Actor");
        ProtectedActor = testHelper.createUniqueType("ProtectedActor");

        const typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type ${typeMovie} implements Production {
                title: String! @alias(property: "movieTitle")
                runtime: Int!
            }

            type ${typeSeries} implements Production {
                title: String! @alias(property: "seriesTitle")
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

            type ${ProtectedActor} @authorization(validate: [{ where: { node: { actedInConnection: { node: { title: "$jwt.title"  } } } } }]) {
                name: String! @alias(property: "dbName")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });
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
        const movieRuntime = 123;
        const movieScreenTime = 23;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 234;
        const seriesScreenTime = 45;

        const query = /* GraphQL */ `
            query Actors($title: String) {
                 ${typeActor.plural}(where: { actedInConnection_SOME: { node: { title: $title } } }) {
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
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { movieTitle: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { seriesTitle: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { movieTitle: $movieTitle2, runtime:$movieRuntime })
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

    test("delete", async () => {
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
        const movieRuntime = 123;
        const movieScreenTime = 23;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 234;
        const seriesScreenTime = 45;

        const query = /* GraphQL */ `
            mutation deleteActors($title: String) {
                 ${typeActor.operations.delete}(where: { actedInConnection_SOME: { node: { title: $title } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${typeActor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { movieTitle: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { seriesTitle: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { movieTitle: $movieTitle2, runtime:$movieRuntime })
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

        expect(gqlResult.data?.[typeActor.operations.delete]).toEqual({
            nodesDeleted: 1,
            relationshipsDeleted: 1,
        });
    });

    test("auth", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const protectedActorName = generate({
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
        const movieRuntime = 123;
        const movieScreenTime = 23;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesEpisodes = 234;
        const seriesScreenTime = 45;
        const query = /* GraphQL */ `
            query ProtectedActors {
                 ${ProtectedActor.plural} {
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
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${typeMovie} { movieTitle: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${typeSeries} { seriesTitle: $seriesTitle, episodes: $seriesEpisodes })
                CREATE (a2:${typeActor} { name: $actorName2 })
                CREATE (m:${typeMovie} { movieTitle: $movieTitle2, runtime:$movieRuntime })
                CREATE (a2)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
                CREATE (pa:${ProtectedActor} { dbName: $protectedActorName })
                CREATE (pa)-[:ACTED_IN { screenTime: $movieScreenTime }]->(m)
            `,
            {
                actorName,
                actorName2,
                protectedActorName,
                movieTitle,
                movieTitle2,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesEpisodes,
                seriesScreenTime,
            }
        );

        const tokenTitle = movieTitle2;
        const token = createBearerToken(secret, { roles: ["reader"], title: tokenTitle });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [ProtectedActor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            runtime: movieRuntime,
                            title: movieTitle2,
                        },
                    ]),
                    name: protectedActorName,
                },
            ],
        });
    });
});
