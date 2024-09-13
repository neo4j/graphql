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
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Nested unions", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Series: UniqueType;
    let LeadActor: UniqueType;
    let Extra: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        LeadActor = testHelper.createUniqueType("LeadActor");
        Extra = testHelper.createUniqueType("Extra");
        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Series} {
                name: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Production = ${Movie} | ${Series}

            type ${LeadActor} {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Extra} {
                name: String
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Actor = ${LeadActor} | ${Extra}
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("chain multiple connects, all for union relationships", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const seriesName = generate({ charset: "alphabetic" });

        const source = `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    connect: {
                        actors: {
                            ${LeadActor} : {
                                where: { node: { name: "${actorName}" } }
                                connect: { actedIn: { ${Series}: { where: { node: { name: "${seriesName}" } } } } }
                            }
                        }
                    }
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            ... on ${LeadActor} {
                                name
                                actedIn {
                                    ... on ${Series} {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title:$movieTitle})
                    CREATE (:${LeadActor} {name:$actorName})
                    CREATE (:${Series} {name:$seriesName})
                `,
            { movieTitle, seriesName, actorName }
        );

        const gqlResult = await testHelper.executeGraphQL(source);
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural][0].title).toEqual(movieTitle);
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural][0].actors[0].name).toEqual(actorName);
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural][0].actors[0].actedIn).toContainEqual({
            name: seriesName,
        });
    });

    test("chain multiple disconnects, all for union relationships", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const seriesName = generate({ charset: "alphabetic" });

        const source = `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    disconnect: {
                        actors: {
                            ${LeadActor}: {
                                where: { node: { name: "${actorName}" } }
                                disconnect: { actedIn: { ${Series} : { where: { node: { name: "${seriesName}" } } } } }
                            }
                        }
                    }
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            ... on ${LeadActor} {
                                name
                                actedIn {
                                    ... on ${Series} {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title:$movieTitle})<-[:ACTED_IN]-(:${LeadActor} {name:$actorName})-[:ACTED_IN]->(:${Series} {name:$seriesName})
                `,
            { movieTitle, seriesName, actorName }
        );

        const gqlResult = await testHelper.executeGraphQL(source);
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actors: [],
            },
        ]);

        const cypherMovie = `
                MATCH (:${Movie} {title: $movieTitle})
                        <-[actedIn:ACTED_IN]-
                            (:${LeadActor} {name: $actorName})
                RETURN actedIn
            `;

        const neo4jResultMovie = await testHelper.executeCypher(cypherMovie, { movieTitle, actorName });
        expect(neo4jResultMovie.records).toHaveLength(0);

        const cypherSeries = `
                MATCH (:${Series} {name: $seriesName})
                        <-[actedIn:ACTED_IN]-
                            (:${LeadActor} {name: $actorName})
                RETURN actedIn
            `;

        const neo4jResultSeries = await testHelper.executeCypher(cypherSeries, { seriesName, actorName });
        expect(neo4jResultSeries.records).toHaveLength(0);
    });

    test("chain multiple deletes, all for union relationships", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const seriesName = generate({ charset: "alphabetic" });

        const source = `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    delete: {
                        actors: {
                            ${LeadActor}: {
                                where: { node: { name: "${actorName}" } }
                                delete: { actedIn: { ${Series}: { where: { node: { name: "${seriesName}" } } } } }
                            }
                        }
                    }
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            ... on ${LeadActor} {
                                name
                                actedIn {
                                    ... on ${Series} {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title:$movieTitle})<-[:ACTED_IN]-(:${LeadActor} {name:$actorName})-[:ACTED_IN]->(:${Series} {name:$seriesName})
                `,
            { movieTitle, seriesName, actorName }
        );

        const gqlResult = await testHelper.executeGraphQL(source);
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actors: [],
            },
        ]);

        const cypherMovie = `
                MATCH (m:${Movie} {title: $movieTitle})
                RETURN m
            `;

        const neo4jResultMovie = await testHelper.executeCypher(cypherMovie, { movieTitle });
        expect(neo4jResultMovie.records).toHaveLength(1);

        const cypherActor = `
                MATCH (a:${LeadActor} {name: $actorName})
                RETURN a
            `;

        const neo4jResultActor = await testHelper.executeCypher(cypherActor, { actorName });
        expect(neo4jResultActor.records).toHaveLength(0);

        const cypherSeries = `
                MATCH (s:${Series} {name: $seriesName})
                RETURN s
            `;

        const neo4jResultSeries = await testHelper.executeCypher(cypherSeries, { seriesName });
        expect(neo4jResultSeries.records).toHaveLength(0);
    });

    test("chain multiple creates under update, all for union relationships", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const seriesName = generate({ charset: "alphabetic" });

        const source = `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    create: {
                        actors: {
                            ${LeadActor}: {
                                node: {
                                    name: "${actorName}"
                                    actedIn: {
                                        ${Series}: {
                                            create: [
                                                {
                                                    node: {
                                                        name: "${seriesName}"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            ... on ${LeadActor} {
                                name
                                actedIn {
                                    ... on ${Series} {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title:$movieTitle})
                `,
            { movieTitle, seriesName, actorName }
        );

        const gqlResult = await testHelper.executeGraphQL(source);
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural][0].title).toEqual(movieTitle);
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural][0].actors[0].name).toEqual(actorName);
        expect((gqlResult.data as any)?.[Movie.operations.update][Movie.plural][0].actors[0].actedIn).toContainEqual({
            name: seriesName,
        });

        const cypherMovie = `
                MATCH (m:${Movie} {title: $movieTitle})
                RETURN m
            `;

        const neo4jResultMovie = await testHelper.executeCypher(cypherMovie, { movieTitle });
        expect(neo4jResultMovie.records).toHaveLength(1);

        const cypherActor = `
                MATCH (a:${LeadActor} {name: $actorName})
                RETURN a
            `;

        const neo4jResultActor = await testHelper.executeCypher(cypherActor, { actorName });
        expect(neo4jResultActor.records).toHaveLength(1);

        const cypherSeries = `
                MATCH (s:${Series} {name: $seriesName})
                RETURN s
            `;

        const neo4jResultSeries = await testHelper.executeCypher(cypherSeries, { seriesName });
        expect(neo4jResultSeries.records).toHaveLength(1);
    });

    test("chain multiple creates under create, all for union relationships", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const seriesName = generate({ charset: "alphabetic" });

        const source = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "${movieTitle}"
                            actors: {
                                ${LeadActor}: {
                                    create: [
                                        {
                                            node: {
                                                name: "${actorName}"
                                                actedIn: {
                                                    ${Series}: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    name: "${seriesName}"
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            ... on ${LeadActor} {
                                name
                                actedIn {
                                    ... on ${Series} {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source);
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0].title).toEqual(movieTitle);
        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0].actors[0].name).toEqual(actorName);
        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0].actors[0].actedIn).toContainEqual({
            name: seriesName,
        });

        const cypherMovie = `
                MATCH (m:${Movie} {title: $movieTitle})
                RETURN m
            `;

        const neo4jResultMovie = await testHelper.executeCypher(cypherMovie, { movieTitle });
        expect(neo4jResultMovie.records).toHaveLength(1);

        const cypherActor = `
                MATCH (a:${LeadActor} {name: $actorName})
                RETURN a
            `;

        const neo4jResultActor = await testHelper.executeCypher(cypherActor, { actorName });
        expect(neo4jResultActor.records).toHaveLength(1);

        const cypherSeries = `
                MATCH (s:${Series} {name: $seriesName})
                RETURN s
            `;

        const neo4jResultSeries = await testHelper.executeCypher(cypherSeries, { seriesName });
        expect(neo4jResultSeries.records).toHaveLength(1);
    });
});
