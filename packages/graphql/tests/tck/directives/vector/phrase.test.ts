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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

const queryName = "moviesVectorQuery";

describe("phrase input - genAI plugin", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    let verifyTCK;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie
                @vector(indexes: [{ indexName: "movie_index", embeddingProperty: "movieVector", queryName: "${queryName}", provider: OPEN_AI }]) {
                title: String!
                released: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                vector: {
                    OpenAI: {
                        token: "my-token",
                        model: "my-model",
                        dimensions: 256,
                    },
                },
            },
        });

        // NOTE: tck verification is skipped for vector tests as vector is not supported on Neo4j 4.x
        if (process.env.VERIFY_TCK) {
            verifyTCK = process.env.VERIFY_TCK;
            delete process.env.VERIFY_TCK;
        }
    });

    afterAll(() => {
        if (verifyTCK) {
            process.env.VERIFY_TCK = verifyTCK;
        }
    });

    test("simple match with single vector property", async () => {
        const query = /* GraphQL */ `
            query MovieVectorQuery($phrase: String!) {
                ${queryName}(phrase: $phrase) {
                    moviesConnection {
                        edges {
                            cursor
                            score
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                phrase: "test phrase",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH genai.vector.encode($param0, \\"OpenAI\\", { token: \\"my-token\\", model: \\"my-model\\", dimensions: 256 }) AS var0
            CALL db.index.vector.queryNodes(\\"movie_index\\", 4, var0) YIELD node AS this1, score AS var2
            WHERE $param1 IN labels(this1)
            WITH collect({ node: this1, score: var2 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.score AS var2
                RETURN collect({ node: { title: this1.title, __resolveType: \\"Movie\\" }, score: var2 }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test phrase\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });
});
