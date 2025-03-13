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
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Field Level Aggregations Edge Filters", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screentime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Aggregate int with edge filters", async () => {
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE (this1.title = $param0 AND this0.screentime = $param1)
                    WITH DISTINCT this1
                    ORDER BY size(this1.title) DESC
                    WITH collect(this1.title) AS list
                    RETURN { longest: head(list) } AS var2
                }
                CALL {
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Movie)
                    WHERE (this4.title = $param2 AND this3.screentime = $param3)
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ node: { __id: id(this4), __resolveType: \\"Movie\\" } }) AS var5
                    }
                    RETURN var5, totalCount
                }
                RETURN { edges: var5, totalCount: totalCount, aggregate: { node: { title: var2 } } } AS var6
            }
            RETURN this { moviesConnection: var6 } AS this"
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
                }
            }"
        `);
    });
});
