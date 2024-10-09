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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/988", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Series @node {
                name: String
                current: Boolean!
                manufacturer: [Manufacturer!]!
                    @relationship(type: "MANUFACTURER", properties: "RelationProps", direction: OUT)
                brand: [Brand!]! @relationship(type: "BRAND", properties: "RelationProps", direction: OUT)
            }

            type Brand @node {
                name: String
                current: Boolean!
            }

            type Manufacturer @node {
                name: String
                current: Boolean!
            }

            type RelationProps @relationshipProperties {
                current: Boolean!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("where with multiple filters and params", async () => {
        const query = /* GraphQL */ `
            query getSeriesWithRelationFilters($where: SeriesWhere = { current: true }) {
                series(where: $where) {
                    name
                    current
                    manufacturerConnection {
                        edges {
                            properties {
                                current
                            }
                            node {
                                name
                            }
                        }
                    }
                    brandConnection {
                        edges {
                            properties {
                                current
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    current_EQ: true,
                    AND: [
                        {
                            OR: [
                                {
                                    manufacturerConnection_SOME: {
                                        edge: {
                                            current_EQ: true,
                                        },
                                        node: {
                                            name_EQ: "C",
                                        },
                                    },
                                },
                                {
                                    manufacturerConnection_SOME: {
                                        edge: {
                                            current_EQ: false,
                                        },
                                        node: {
                                            name_EQ: "AM",
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            OR: [
                                {
                                    brandConnection_SOME: {
                                        edge: {
                                            current_EQ: true,
                                        },
                                        node: {
                                            name_EQ: "smart",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Series)
            WHERE (this.current = $param0 AND ((EXISTS {
                MATCH (this)-[this0:MANUFACTURER]->(this1:Manufacturer)
                WHERE (this1.name = $param1 AND this0.current = $param2)
            } OR EXISTS {
                MATCH (this)-[this2:MANUFACTURER]->(this3:Manufacturer)
                WHERE (this3.name = $param3 AND this2.current = $param4)
            }) AND EXISTS {
                MATCH (this)-[this4:BRAND]->(this5:Brand)
                WHERE (this5.name = $param5 AND this4.current = $param6)
            }))
            CALL {
                WITH this
                MATCH (this)-[this6:MANUFACTURER]->(this7:Manufacturer)
                WITH collect({ node: this7, relationship: this6 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this7, edge.relationship AS this6
                    RETURN collect({ properties: { current: this6.current, __resolveType: \\"RelationProps\\" }, node: { name: this7.name, __resolveType: \\"Manufacturer\\" } }) AS var8
                }
                RETURN { edges: var8, totalCount: totalCount } AS var9
            }
            CALL {
                WITH this
                MATCH (this)-[this10:BRAND]->(this11:Brand)
                WITH collect({ node: this11, relationship: this10 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this11, edge.relationship AS this10
                    RETURN collect({ properties: { current: this10.current, __resolveType: \\"RelationProps\\" }, node: { name: this11.name, __resolveType: \\"Brand\\" } }) AS var12
                }
                RETURN { edges: var12, totalCount: totalCount } AS var13
            }
            RETURN this { .name, .current, manufacturerConnection: var9, brandConnection: var13 } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"C\\",
                \\"param2\\": true,
                \\"param3\\": \\"AM\\",
                \\"param4\\": false,
                \\"param5\\": \\"smart\\",
                \\"param6\\": true
            }"
        `);
    });
});
