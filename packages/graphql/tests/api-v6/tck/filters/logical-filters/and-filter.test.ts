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

describe("AND filters", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                year: Int
                runtime: Float
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("AND logical filter in where", async () => {
        const query = /* GraphQL */ `
            query {
                movies(
                    where: {
                        AND: [
                            { edges: { node: { title: { equals: "The Matrix" } } } }
                            { edges: { node: { year: { equals: 100 } } } }
                        ]
                    }
                ) {
                    connection {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE (this0.title = $param0 AND this0.year = $param1)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 100,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AND logical filter on edges", async () => {
        const query = /* GraphQL */ `
            query {
                movies(
                    where: {
                        edges: {
                            AND: [{ node: { title: { equals: "The Matrix" } } }, { node: { year: { equals: 100 } } }]
                        }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE (this0.title = $param0 AND this0.year = $param1)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 100,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AND logical filter in nodes", async () => {
        const query = /* GraphQL */ `
            query {
                movies(
                    where: {
                        edges: { node: { AND: [{ title: { equals: "The Matrix" } }, { year: { equals: 100 } }] } }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE (this0.title = $param0 AND this0.year = $param1)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 100,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
