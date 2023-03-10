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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1687", () => {
    const productionType = new UniqueType("Production");
    const movieType = new UniqueType("Movie");
    const genreType = new UniqueType("Genre");

    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to return all the genres related the Matrix movie using connection fields", async () => {
        const query = `
            query Genres {
                ${genreType.plural}(where: {
                    ${movieType.operations.connection}_SOME: {
                        node: {
                            _on: {
                                ${movieType.name}: {
                                    title: "Matrix"
                                }
                            }
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

        const session = await neo4j.getSession();

        try {
            await session.run(cypher);
        } finally {
            await session.close();
        }

        const result = await graphqlQuery(query);
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
