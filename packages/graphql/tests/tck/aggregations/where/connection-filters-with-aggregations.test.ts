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

describe("Field Level Aggregations Edge Filters", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String
            }

            type Movie implements Production @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production @node {
                title: String!
            }

            type Actor @node {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screentime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("aggregate with edge filters in nested connection", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    moviesConnection(where: { edge: { screentime_EQ: 19 }, node: { title_EQ: "Tha Matrix" } }) {
                        aggregate {
                            node {
                                title {
                                    longest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL (this) {
                CALL (this) {
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE (this1.title = $param0 AND this0.screentime = $param1)
                    WITH DISTINCT this1
                    ORDER BY size(this1.title) DESC
                    WITH collect(this1.title) AS list
                    RETURN { longest: head(list) } AS var2
                }
                RETURN { aggregate: { node: { title: var2 } } } AS var3
            }
            RETURN this { moviesConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Tha Matrix\\",
                \\"param1\\": {
                    \\"low\\": 19,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Aggregate int with edge filters in nested connection to an interface", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    actedInConnection(where: { edge: { screentime_EQ: 19 }, node: { title_EQ: "Tha Matrix" } }) {
                        aggregate {
                            node {
                                title {
                                    longest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL (this) {
                CALL (this) {
                    CALL (this) {
                        WITH this
                        MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                        WHERE (this1.title = $param0 AND this0.screentime = $param1)
                        WITH { node: { __resolveType: \\"Movie\\", __id: id(this1) } } AS edge
                        RETURN edge
                        UNION
                        WITH this
                        MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                        WHERE (this3.title = $param2 AND this2.screentime = $param3)
                        WITH { node: { __resolveType: \\"Series\\", __id: id(this3) } } AS edge
                        RETURN edge
                    }
                    RETURN collect(edge) AS edges
                }
                CALL (this) {
                    CALL {
                        WITH this
                        MATCH (this)-[this4:ACTED_IN]->(this5:Movie)
                        RETURN this5 AS node, this4 AS edge
                        UNION
                        WITH this
                        MATCH (this)-[this6:ACTED_IN]->(this7:Series)
                        RETURN this7 AS node, this6 AS edge
                    }
                    WITH *
                    WHERE (node.title = $param4 AND edge.screentime = $param5)
                    WITH DISTINCT node
                    ORDER BY size(node.title) DESC
                    WITH collect(node.title) AS list
                    RETURN { longest: head(list) } AS this8
                }
                WITH edges, { node: { title: this8 } } AS var9
                WITH edges, size(edges) AS totalCount, var9
                RETURN { edges: edges, totalCount: totalCount, aggregate: var9 } AS var10
            }
            RETURN this { actedInConnection: var10 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Tha Matrix\\",
                \\"param1\\": {
                    \\"low\\": 19,
                    \\"high\\": 0
                },
                \\"param2\\": \\"Tha Matrix\\",
                \\"param3\\": {
                    \\"low\\": 19,
                    \\"high\\": 0
                },
                \\"param4\\": \\"Tha Matrix\\",
                \\"param5\\": {
                    \\"low\\": 19,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
