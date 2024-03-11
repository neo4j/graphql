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

import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";
import Neo4jHelper from "./neo4j";

describe("field-filtering", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should use connection filter on field", async () => {
        const session = await neo4j.getSession();
        const Movie = new UniqueType("Movie");
        const Series = new UniqueType("Series");
        const Genre = new UniqueType("Genre");

        const typeDefs = gql`
            type ${Movie} {
                title: String!
                genres: [${Genre}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }

            type ${Genre} {
                name: String!
                series: [${Series}!]! @relationship(type: "IN_SERIES", direction: OUT)
            }

            type ${Series} {
                name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const genreName1 = generate({
            charset: "alphabetic",
        });
        const genreName2 = generate({
            charset: "alphabetic",
        });

        const seriesName = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${Movie.plural}(where: { title: "${movieTitle}" }) {
                    title
                    genres(where: { seriesConnection: { node: { name: "${seriesName}" } } }) {
                        name
                        series {
                            name
                        }
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${Movie} {title:$movieTitle})-[:IN_GENRE]->(:${Genre} {name:$genreName1})-[:IN_SERIES]->(:${Series} {name:$seriesName})
            CREATE (m)-[:IN_GENRE]->(:${Genre} {name:$genreName2})
        `;

        try {
            await session.run(cypher, { movieTitle, genreName1, seriesName, genreName2 });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Movie.plural]).toEqual([
                { title: movieTitle, genres: [{ name: genreName1, series: [{ name: seriesName }] }] },
            ]);
        } finally {
            await session.close();
        }
    });
});
