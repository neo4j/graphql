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

describe("Field Level Aggregations Where", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                released: DateTime
            }

            type Person @node {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Count aggregation with number filter", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age: { gt: 40 } } }) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WHERE this1.age > $param0
                    RETURN { nodes: count(DISTINCT this1) } AS var2
                }
                CALL {
                    WITH *
                    MATCH (this)<-[this3:ACTED_IN]-(this4:Person)
                    WHERE this4.age > $param1
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ node: { __id: id(this4), __resolveType: \\"Person\\" } }) AS var5
                    }
                    RETURN var5, totalCount
                }
                RETURN { edges: var5, totalCount: totalCount, aggregate: { count: var2 } } AS var6
            }
            RETURN this { .title, actorsConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 40,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 40,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Count aggregation with colliding filter", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_CONTAINS: "abc" } }) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                    directorsConnection(where: { node: { name_CONTAINS: "abcdefg" } }) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WHERE this1.name CONTAINS $param0
                    RETURN { nodes: count(DISTINCT this1) } AS var2
                }
                CALL {
                    WITH *
                    MATCH (this)<-[this3:ACTED_IN]-(this4:Person)
                    WHERE this4.name CONTAINS $param1
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ node: { __id: id(this4), __resolveType: \\"Person\\" } }) AS var5
                    }
                    RETURN var5, totalCount
                }
                RETURN { edges: var5, totalCount: totalCount, aggregate: { count: var2 } } AS var6
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)<-[this7:DIRECTED]-(this8:Person)
                    WHERE this8.name CONTAINS $param2
                    RETURN { nodes: count(DISTINCT this8) } AS var9
                }
                CALL {
                    WITH *
                    MATCH (this)<-[this10:DIRECTED]-(this11:Person)
                    WHERE this11.name CONTAINS $param3
                    WITH collect({ node: this11, relationship: this10 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this11, edge.relationship AS this10
                        RETURN collect({ node: { __id: id(this11), __resolveType: \\"Person\\" } }) AS var12
                    }
                    RETURN var12, totalCount
                }
                RETURN { edges: var12, totalCount: totalCount, aggregate: { count: var9 } } AS var13
            }
            RETURN this { .title, actorsConnection: var6, directorsConnection: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"abc\\",
                \\"param1\\": \\"abc\\",
                \\"param2\\": \\"abcdefg\\",
                \\"param3\\": \\"abcdefg\\"
            }"
        `);
    });
});
