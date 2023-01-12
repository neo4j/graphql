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

import { gql } from "apollo-server";
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
            config: { enableRegex: true },
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
            CALL {
                WITH this
                MATCH (this)-[this0:MANUFACTURER]->(this1:\`Manufacturer\`)
                WHERE (this0.current = $param0 AND this1.name = $param1)
                RETURN count(this0) AS var2
            }
            CALL {
                WITH this
                MATCH (this)-[this3:MANUFACTURER]->(this4:\`Manufacturer\`)
                WHERE (this3.current = $param2 AND this4.name = $param3)
                RETURN count(this3) AS var5
            }
            CALL {
                WITH this
                MATCH (this)-[this6:BRAND]->(this7:\`Brand\`)
                WHERE (this6.current = $param4 AND this7.name = $param5)
                RETURN count(this6) AS var8
            }
            WITH *
            WHERE (((var2 > 0 OR var5 > 0) AND var8 > 0) AND this.current = $param6)
            CALL {
                WITH this
                MATCH (this)-[this_connection_manufacturerConnectionthis0:MANUFACTURER]->(this_Manufacturer:\`Manufacturer\`)
                WITH { current: this_connection_manufacturerConnectionthis0.current, node: { name: this_Manufacturer.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_manufacturerConnection
            }
            CALL {
                WITH this
                MATCH (this)-[this_connection_brandConnectionthis0:BRAND]->(this_Brand:\`Brand\`)
                WITH { current: this_connection_brandConnectionthis0.current, node: { name: this_Brand.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_brandConnection
            }
            RETURN this { .name, .current, manufacturerConnection: this_manufacturerConnection, brandConnection: this_brandConnection } AS this"
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
