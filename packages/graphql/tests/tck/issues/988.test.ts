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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/988", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Series {
                name: String
                current: Boolean!
                manufacturer: [Manufacturer!]!
                    @relationship(type: "MANUFACTURER", properties: "RelationProps", direction: OUT)
                brand: [Brand!]! @relationship(type: "BRAND", properties: "RelationProps", direction: OUT)
            }

            type Brand {
                name: String
                current: Boolean!
            }

            type Manufacturer {
                name: String
                current: Boolean!
            }

            interface RelationProps {
                current: Boolean!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("where with multiple filters and params", async () => {
        const query = gql`
            query getSeriesWithRelationFilters($where: SeriesWhere = { current: true }) {
                series(where: $where) {
                    name
                    current
                    manufacturerConnection {
                        edges {
                            current
                            node {
                                name
                            }
                        }
                    }
                    brandConnection {
                        edges {
                            current
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: {
                where: {
                    current: true,
                    AND: [
                        {
                            OR: [
                                {
                                    manufacturerConnection: {
                                        edge: {
                                            current: true,
                                        },
                                        node: {
                                            name: "C",
                                        },
                                    },
                                },
                                {
                                    manufacturerConnection: {
                                        edge: {
                                            current: false,
                                        },
                                        node: {
                                            name: "AM",
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            OR: [
                                {
                                    brandConnection: {
                                        edge: {
                                            current: true,
                                        },
                                        node: {
                                            name: "smart",
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
            "MATCH (this:\`Series\`)
            WHERE (((EXISTS {
                MATCH (this)-[this0:MANUFACTURER]->(this1:\`Manufacturer\`)
                WHERE (this0.current = $param0 AND this1.name = $param1)
            } OR EXISTS {
                MATCH (this)-[this2:MANUFACTURER]->(this3:\`Manufacturer\`)
                WHERE (this2.current = $param2 AND this3.name = $param3)
            }) AND EXISTS {
                MATCH (this)-[this4:BRAND]->(this5:\`Brand\`)
                WHERE (this4.current = $param4 AND this5.name = $param5)
            }) AND this.current = $param6)
            CALL {
                WITH this
                MATCH (this)-[this6:MANUFACTURER]->(this7:\`Manufacturer\`)
                WITH { current: this6.current, node: { name: this7.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var8
            }
            CALL {
                WITH this
                MATCH (this)-[this9:BRAND]->(this10:\`Brand\`)
                WITH { current: this9.current, node: { name: this10.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var11
            }
            RETURN this { .name, .current, manufacturerConnection: var8, brandConnection: var11 } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"C\\",
                \\"param2\\": false,
                \\"param3\\": \\"AM\\",
                \\"param4\\": true,
                \\"param5\\": \\"smart\\",
                \\"param6\\": true
            }"
        `);
    });
});
