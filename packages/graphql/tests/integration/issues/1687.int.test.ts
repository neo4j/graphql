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

describe("https://github.com/neo4j/graphql/issues/1687", () => {
    let productionType: UniqueType;
    let movieType: UniqueType;
    let genreType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        productionType = testHelper.createUniqueType("Production");
        movieType = testHelper.createUniqueType("Movie");
        genreType = testHelper.createUniqueType("Genre");

        const typeDefs = `
            interface ${productionType.name} {
                id: ID
                title: String
            }

            type ${movieType.name} implements ${productionType.name} {
                id: ID
                title: String
                ${genreType.plural}: [${genreType.name}!]! @relationship(type: "HAS_GENRE", direction: OUT)
            }
            
            type ${genreType.name} {
                name: String
                ${movieType.plural}: [${productionType.name}!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be able to return all the genres related the Matrix movie using connection fields", async () => {
        const query = `
            query Genres {
                ${genreType.plural}(where: {
                    ${movieType.operations.connection}_SOME: {
                        node: {
                            title: "Matrix"
                        }
                    }
                }) {
                    name
                }
            }
        `;

        const cypher = `
            CREATE (c:${movieType.name} { id: "1", title: "Matrix" })-[:HAS_GENRE]->(:${genreType.name} { id: "10", name: "Sci-fi" })
            CREATE (c)-[:HAS_GENRE]->(g2:${genreType.name} { id: "11", name: "Action" })
            CREATE (h:${movieType.name} { id: "2", title: "The Hobbit" })-[:HAS_GENRE]->(g3:${genreType.name} { id: "12", name: "Fantasy" })
        `;

        await testHelper.executeCypher(cypher);

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [genreType.plural]: expect.toIncludeSameMembers([
                {
                    name: "Sci-fi",
                },
                {
                    name: "Action",
                },
            ]),
        });
    });
});
