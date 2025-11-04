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

describe("https://github.com/neo4j/graphql/issues/2713", () => {
    const testHelper = new TestHelper();

    let movieType: UniqueType;
    let genreType: UniqueType;
    let inGenreInterface: UniqueType;

    const movieTitle1 = "A title";
    const movieTitle2 = "Exciting new film!";
    const movieTitle3 = "short";
    const movieTitle4 = "a fourth title";
    const genreName1 = "Action";
    const genreName2 = "Horror";
    const intValue1 = 1;
    const intValue2 = 101;
    const intValue3 = 983;
    const intValue4 = 0;
    const intValue5 = 42;

    beforeEach(async () => {
        movieType = testHelper.createUniqueType("Movie");
        genreType = testHelper.createUniqueType("Genre");
        inGenreInterface = testHelper.createUniqueType("InGenre");

        const typeDefs = `
            type ${movieType.name} {
                title: String
                genres: [${genreType.name}!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "${inGenreInterface.name}")
            }
            type ${genreType.name} {
                name: String
                movies: [${movieType.name}!]! @relationship(type: "IN_GENRE", direction: IN, properties: "${inGenreInterface.name}")
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
            CREATE (m4 :${movieType.name} { title: "${movieTitle4}" })-[:IN_GENRE { intValue: ${intValue5} }]->(g2)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not find genresConnection_ALL where NONE true", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection_ALL: { node: { moviesAggregate: { count: 0 } } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.plural]: [],
        });
    });
});
