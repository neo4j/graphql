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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2670", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let movieType: UniqueType;
    let genreType: UniqueType;
    let seriesType: UniqueType;
    let inGenreInterface: UniqueType;

    const movieTitle1 = "A title";
    const movieTitle2 = "Exciting new film!";
    const movieTitle3 = "short";
    const movieTitle4 = "a fourth title";
    const movieTitle5 = "an unconnected movie";
    const seriesName1 = "series 1";
    const seriesName2 = "second series";
    const genreName1 = "Action";
    const genreName2 = "Horror";
    const intValue1 = 1;
    const intValue2 = 101;
    const intValue3 = 983;
    const intValue4 = 0;
    const intValue5 = 42;
    const genre2AverageTitleLength = (movieTitle4.length + movieTitle2.length) / 2;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        movieType = new UniqueType("Movie");
        genreType = new UniqueType("Genre");
        seriesType = new UniqueType("Series");
        inGenreInterface = new UniqueType("InGenre");

        const typeDefs = `
            type ${movieType.name} {
                title: String
                genres: [${genreType.name}!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "${inGenreInterface.name}")
            }

            type ${genreType.name} {
                name: String
                movies: [${movieType.name}!]! @relationship(type: "IN_GENRE", direction: IN, properties: "${inGenreInterface.name}")
                series: [${seriesType.name}!]! @relationship(type: "IN_GENRE", direction: IN, properties: "${inGenreInterface.name}")
            }

            type ${seriesType} {
                name: String!
                genres: [${genreType.name}!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "${inGenreInterface.name}")
            }

            interface ${inGenreInterface.name} @relationshipProperties {
                intValue: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        await session.run(`
            CREATE (m1:${movieType.name} { title: "${movieTitle1}" })-[:IN_GENRE { intValue: ${intValue1} }]->(g1:${genreType.name} { name: "${genreName1}" })
            CREATE (m2:${movieType.name} { title: "${movieTitle2}" })-[:IN_GENRE { intValue: ${intValue2} }]->(g1)
            CREATE (m3:${movieType.name} { title: "${movieTitle3}" })-[:IN_GENRE { intValue: ${intValue3} }]->(g1)
            CREATE (m2)-[:IN_GENRE { intValue: ${intValue4} }]->(g2:${genreType.name} { name: "${genreName2}" })
            CREATE (m4:${movieType.name} { title: "${movieTitle4}" })-[:IN_GENRE { intValue: ${intValue5} }]->(g2)
            CREATE (m5:${movieType.name} { title: "${movieTitle5}" })
            CREATE (s1:${seriesType.name} { name: "${seriesName1}" })-[:IN_GENRE { intValue: ${intValue1} }]->(g2)
            CREATE (s2:${seriesType.name} { name: "${seriesName2}" })-[:IN_GENRE { intValue: ${intValue2} }]->(g2)
        `);
    });

    afterEach(async () => {
        await cleanNodes(session, [movieType, genreType, seriesType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should find where moviesAggregate count equal", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle4,
                },
                {
                    title: movieTitle2,
                },
            ]),
        });
    });

    test("should find where moviesAggregate count_LT", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { count_LT: 3 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle4,
                },
                {
                    title: movieTitle2,
                },
            ]),
        });
    });

    test("should find where moviesAggregate count_GT", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { count_GT: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle1,
                },
                {
                    title: movieTitle2,
                },
                {
                    title: movieTitle3,
                },
            ]),
        });
    });

    test("should find where moviesAggregate node property SHORTEST", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { node: { title_SHORTEST_EQUAL: ${movieTitle3.length} } } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle1,
                },
                {
                    title: movieTitle2,
                },
                {
                    title: movieTitle3,
                },
            ]),
        });
    });

    test("should find where moviesAggregate node property AVERAGE", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { node: { title_AVERAGE_EQUAL: ${genre2AverageTitleLength} } } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle4,
                },
                {
                    title: movieTitle2,
                },
            ]),
        });
    });

    test("should find where moviesAggregate edge property MAX_LT", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { edge: { intValue_MAX_LT: ${intValue3} } } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle4,
                },
                {
                    title: movieTitle2,
                },
            ]),
        });
    });

    test("should find where moviesAggregate edge property MIN_EQUAL", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { edge: { intValue_MIN_EQUAL: ${intValue1} } } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle1,
                },
                {
                    title: movieTitle2,
                },
                {
                    title: movieTitle3,
                },
            ]),
        });
    });

    test("should find where genresConnection_SOME and nested count", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection_SOME: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle4,
                },
                {
                    title: movieTitle2,
                },
            ]),
        });
    });

    test("should find where genresConnection_NONE", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection_NONE: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle1,
                },
                {
                    title: movieTitle3,
                },
                {
                    title: movieTitle5,
                },
            ]),
        });
    });

    test("should find where genresConnection_ALL", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection_ALL: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle4,
                },
            ]),
        });
    });

    test("should find where genresConnection_SINGLE", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection_SINGLE: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle2,
                },
                {
                    title: movieTitle4,
                },
            ]),
        });
    });

    test("should find where genresConnection_NOT", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection_NOT: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle1,
                },
                {
                    title: movieTitle3,
                },
                {
                    title: movieTitle5,
                },
            ]),
        });
    });

    test("should find genresConnection with multiple AND aggregates", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { AND: [{ node: { moviesAggregate: { count: 2 } } }, { node: { seriesAggregate: { node: { name_SHORTEST_EQUAL: ${seriesName1.length} } } } }] } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle2,
                },
                {
                    title: movieTitle4,
                },
            ]),
        });
    });

    test("should find genresConnection with multiple OR aggregates", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { OR: [{ node: { moviesAggregate: { count: 3 } } }, { node: { seriesAggregate: { node: { name_SHORTEST_EQUAL: ${seriesName1.length} } } } }] } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle1,
                },
                {
                    title: movieTitle2,
                },
                {
                    title: movieTitle3,
                },
                {
                    title: movieTitle4,
                },
            ]),
        });
    });

    test("should find genresConnection with multiple implicit AND aggregates", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { count: 2 }, seriesAggregate: { node: { name_SHORTEST_EQUAL: ${seriesName1.length} } } } } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle2,
                },
                {
                    title: movieTitle4,
                },
            ]),
        });
    });

    test("should find genresConnection with aggregation at the same level", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { count: 3 } } }, genresAggregate: { count: 1 } }) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: expect.toIncludeSameMembers([
                {
                    title: movieTitle1,
                },
                {
                    title: movieTitle3,
                },
            ]),
        });
    });
});
