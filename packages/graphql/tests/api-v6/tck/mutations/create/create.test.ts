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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../../tck/utils/tck-test-utils";

describe("Top-Level Create", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                released: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should create two movies", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        { node: { title: "The Matrix" } }
                        { node: { title: "The Matrix Reloaded", released: 2001 } }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, mutation, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $param0 AS var0
            CALL {
                WITH var0
                CREATE (this1:Movie)
                SET
                    this1.title = var0.title,
                    this1.released = var0.released
                RETURN this1
            }
            WITH *
            WITH collect({ node: this1 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this1
                RETURN collect({ node: { __id: id(this1), __resolveType: \\"Movie\\" } }) AS var2
            }
            RETURN { connection: { edges: var2, totalCount: totalCount } } AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"title\\": \\"The Matrix\\"
                    },
                    {
                        \\"title\\": \\"The Matrix Reloaded\\",
                        \\"released\\": {
                            \\"low\\": 2001,
                            \\"high\\": 0
                        }
                    }
                ]
            }"
        `);
    });
});
