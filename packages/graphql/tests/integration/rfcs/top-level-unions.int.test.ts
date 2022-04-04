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
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";

describe("integration/rfc/top-level-unions", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query simple top level unions", async () => {
        const session = driver.session();
        const testMovie = generateUniqueType("Movie");
        const testSeries = generateUniqueType("Series");

        const typeDefs = gql`
            type ${testMovie.name} {
                id: ID!
            }

            type ${testSeries.name} {
                id: ID!
            }

            union Production = ${testMovie.name} | ${testSeries.name}
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const movieId = generate({
            charset: "alphabetic",
        });
        const seriesId = generate({
            charset: "alphabetic",
        });

        const source = `
            query {
                productions {
                    ... on ${testMovie.name} {
                        __typename
                        id
                    }
                    ... on ${testSeries.name} {
                        __typename
                        id
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:${testMovie.name} { id: "${movieId}" })
                CREATE (:${testSeries.name} { id: "${seriesId}" })
            `);
        } finally {
            session.close();
        }

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source,
            contextValue: { driver },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toMatchObject({
            productions: [
                {
                    __typename: testMovie.name,
                    id: movieId,
                },
                {
                    __typename: testSeries.name,
                    id: seriesId,
                },
            ],
        });
    });

    test("should query nested top level unions", async () => {
        const session = driver.session();
        const testMovie = generateUniqueType("Movie");
        const testActor = generateUniqueType("Actor");
        const testEpisode = generateUniqueType("Episode");
        const testSeries = generateUniqueType("Series");

        const typeDefs = gql`
            type ${testMovie.name} {
                id: ID!
                actors: [${testActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${testSeries.name} {
                id: ID!
                episodes: [${testEpisode.name}!]! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            type ${testActor.name} {
                id: ID!
            }

            type ${testEpisode.name} {
                id: ID!
            }

            union Production = ${testMovie.name} | ${testSeries.name}
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const movieId = generate({
            charset: "alphabetic",
        });
        const actorId = generate({
            charset: "alphabetic",
        });
        const seriesId = generate({
            charset: "alphabetic",
        });
        const episodeId = generate({
            charset: "alphabetic",
        });

        const source = `
            query {
                productions {
                    ... on ${testMovie.name} {
                        __typename
                        id
                        actors {
                            id
                        }
                    }
                    ... on ${testSeries.name} {
                        __typename
                        id
                        episodes {
                            id
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:${testMovie.name} { id: "${movieId}" })<-[:ACTED_IN]-(:${testActor.name} { id: "${actorId}" })
                CREATE (:${testSeries.name} { id: "${seriesId}" })<-[:HAS_EPISODE]-(:${testEpisode.name} { id: "${episodeId}" })
            `);
        } finally {
            session.close();
        }

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source,
            contextValue: { driver },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toMatchObject({
            productions: [
                {
                    __typename: testMovie.name,
                    id: movieId,
                    actors: [{ id: actorId }],
                },
                {
                    __typename: testSeries.name,
                    id: seriesId,
                    episodes: [{ id: episodeId }],
                },
            ],
        });
    });

    test("should query simple top level unions with where", async () => {
        const session = driver.session();
        const testMovie = generateUniqueType("Movie");
        const testSeries = generateUniqueType("Series");

        const typeDefs = gql`
            type ${testMovie.name} {
                id: ID!
            }

            type ${testSeries.name} {
                id: ID!
            }

            union Production = ${testMovie.name} | ${testSeries.name}
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const movieId = generate({
            charset: "alphabetic",
        });
        const seriesId = generate({
            charset: "alphabetic",
        });

        const source = `
            query {
                productions(where: { ${testMovie.name}: { id: "${movieId}" }, ${testSeries.name}: { id: "${seriesId}" } }) {
                    ... on ${testMovie.name} {
                        __typename
                        id
                    }
                    ... on ${testSeries.name} {
                        __typename
                        id
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:${testMovie.name} { id: "${movieId}" })
                CREATE (:${testMovie.name} { id: randomUUID() })
                CREATE (:${testSeries.name} { id: "${seriesId}" })
                CREATE (:${testSeries.name} { id: randomUUID() })
            `);
        } finally {
            session.close();
        }

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source,
            contextValue: { driver },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toMatchObject({
            productions: [
                {
                    __typename: testMovie.name,
                    id: movieId,
                },
                {
                    __typename: testSeries.name,
                    id: seriesId,
                },
            ],
        });
    });
});
