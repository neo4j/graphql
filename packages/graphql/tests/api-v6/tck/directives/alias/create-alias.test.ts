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

describe("Create with @alias", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String! @alias(property: "name")
                released: Int @alias(property: "year")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should create two movies and project them", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        { node: { title: "The Matrix" } }
                        { node: { title: "The Matrix Reloaded", released: 2001 } }
                    ]
                ) {
                    movies {
                        title
                        released
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
                    this1.name = var0.title,
                    this1.year = var0.released
                RETURN this1
            }
            WITH *
            WITH collect({ node: this1 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this1
                RETURN collect({ node: { title: this1.name, released: this1.year, __resolveType: \\"Movie\\" } }) AS var2
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
