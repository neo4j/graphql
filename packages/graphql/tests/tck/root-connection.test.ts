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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Root Connection Query tests", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple selection, Movie by title", async () => {
        const query = gql`
            {
                moviesConnection(where: { title: "River Runs Through It, A" }) {
                    totalCount
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE this0.title = $param0
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var1
            }
            RETURN { edges: var1, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"River Runs Through It, A\\"
            }"
        `);
    });

    test("should apply limit and sort before return", async () => {
        const query = gql`
            {
                moviesConnection(first: 20, sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                ORDER BY this0.title ASC
                LIMIT $param0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var1
            }
            RETURN { edges: var1, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });
    test("should apply limit, sort, and filter correctly when all three are used", async () => {
        const query = gql`
            {
                moviesConnection(first: 20, where: { title_CONTAINS: "Matrix" }, sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WHERE this0.title CONTAINS $param0
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                ORDER BY this0.title ASC
                LIMIT $param1
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var1
            }
            RETURN { edges: var1, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Matrix\\",
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });
    test("should correctly place any connection strings", async () => {
        const query = gql`
            {
                moviesConnection(first: 20, sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                            actorsConnection {
                                totalCount
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                ORDER BY this0.title ASC
                LIMIT $param0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        RETURN collect({ node: { name: this2.name, __resolveType: \\"Actor\\" } }) AS var3
                    }
                    RETURN { edges: var3, totalCount: totalCount } AS var4
                }
                RETURN collect({ node: { title: this0.title, actorsConnection: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
