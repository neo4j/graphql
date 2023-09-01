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

describe("https://github.com/neo4j/graphql/issues/2713", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        movieType = new UniqueType("Movie");
        genreType = new UniqueType("Genre");
        inGenreInterface = new UniqueType("InGenre");

        const typeDefs = `
            type ${movieType.name} {
                title: String
                genres: [${genreType.name}!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "${inGenreInterface.name}")
            }
            type ${genreType.name} {
                name: String
                movies: [${movieType.name}!]! @relationship(type: "IN_GENRE", direction: IN, properties: "${inGenreInterface.name}")
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
            CREATE (m4 :${movieType.name} { title: "${movieTitle4}" })-[:IN_GENRE { intValue: ${intValue5} }]->(g2)
        `);
    });

    afterEach(async () => {
        await cleanNodes(session, [movieType, genreType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not find genresConnection_ALL where NONE true", async () => {
        const query = `
            {
                ${movieType.plural}(where: { genresConnection_ALL: { node: { moviesAggregate: { count: 0 } } } }) {
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
            [movieType.plural]: [],
        });
    });
});
