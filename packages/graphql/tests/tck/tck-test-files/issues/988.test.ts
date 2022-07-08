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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

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
            WHERE (this.current = $param0
            AND ((size([(this)-[this2:\`MANUFACTURER\`]->(this1:\`Manufacturer\`) WHERE this2.current = $nestedParam1.edge.current AND this1.name = $nestedParam1.node.name | 1]) > 0
            OR size([(this)-[this4:\`MANUFACTURER\`]->(this3:\`Manufacturer\`) WHERE this4.current = $nestedParam2.edge.current AND this3.name = $nestedParam2.node.name | 1]) > 0)
            AND size([(this)-[this6:\`BRAND\`]->(this5:\`Brand\`) WHERE this6.current = $nestedParam3.edge.current AND this5.name = $nestedParam3.node.name | 1]) > 0))
            CALL {
            WITH this
            MATCH (this)-[this_manufacturer_relationship:MANUFACTURER]->(this_manufacturer:Manufacturer)
            WITH collect({ current: this_manufacturer_relationship.current, node: { name: this_manufacturer.name } }) AS edges
            UNWIND edges as edge
            RETURN { edges: collect(edge), totalCount: size(edges) } AS manufacturerConnection
            }
            CALL {
            WITH this
            MATCH (this)-[this_brand_relationship:BRAND]->(this_brand:Brand)
            WITH collect({ current: this_brand_relationship.current, node: { name: this_brand.name } }) AS edges
            UNWIND edges as edge
            RETURN { edges: collect(edge), totalCount: size(edges) } AS brandConnection
            }
            RETURN this { .name, .current, manufacturerConnection, brandConnection } as this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"nestedParam1\\": {
                    \\"edge\\": {
                        \\"current\\": true
                    },
                    \\"node\\": {
                        \\"name\\": \\"C\\"
                    }
                },
                \\"nestedParam2\\": {
                    \\"edge\\": {
                        \\"current\\": false
                    },
                    \\"node\\": {
                        \\"name\\": \\"AM\\"
                    }
                },
                \\"nestedParam3\\": {
                    \\"edge\\": {
                        \\"current\\": true
                    },
                    \\"node\\": {
                        \\"name\\": \\"smart\\"
                    }
                }
            }"
        `);
    });
});
