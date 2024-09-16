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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2670", () => {
    const testHelper = new TestHelper();

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

    beforeAll(async () => {});

    beforeEach(async () => {
        movieType = testHelper.createUniqueType("Movie");
        genreType = testHelper.createUniqueType("Genre");
        seriesType = testHelper.createUniqueType("Series");
        inGenreInterface = testHelper.createUniqueType("InGenre");

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

            type ${inGenreInterface.name} @relationshipProperties {
                intValue: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
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
        await testHelper.close();
    });

    test("should find where moviesAggregate count equal", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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
