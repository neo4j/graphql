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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1783", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Series {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
                nameDetails: NameDetails @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }

            type NameDetails @exclude(operations: [CREATE, UPDATE, DELETE, READ]) {
                fullName: String!
            }

            interface RelationProps {
                current: Boolean!
            }

            type MasterData {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should add parameters with implicit and", async () => {
        const query = gql`
            query ($where: SeriesWhere, $connectionWhere: RelationPropsWhere) {
                series(where: $where) {
                    id
                    nameDetailsConnection(where: { edge: $connectionWhere }) {
                        edges {
                            node {
                                fullName
                            }
                        }
                    }
                    architectureConnection(where: { edge: $connectionWhere }) {
                        edges {
                            node {
                                nameDetailsConnection(where: { edge: $connectionWhere }) {
                                    edges {
                                        node {
                                            fullName
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const variableValues = {
            where: {
                current: true,
                nameDetailsConnection: {
                    edge: {
                        current: true,
                    },
                    node: {
                        fullName_CONTAINS: "1",
                    },
                },
                architectureConnection_SINGLE: {
                    edge: {
                        current: true,
                    },
                    node: {
                        nameDetailsConnection: {
                            edge: {
                                current: true,
                            },
                            node: {
                                fullName: "MHA",
                            },
                        },
                    },
                },
            },
            connectionWhere: {
                current: true,
            },
        };

        const result = await translateQuery(neoSchema, query, { variableValues });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Series\`)
            WHERE (this.current = $param0 AND size([(this)-[this0:ARCHITECTURE]->(this1:\`MasterData\`) WHERE (this0.current = $param1 AND size([(this1)-[this2:HAS_NAME]->(this3:\`NameDetails\`) WHERE (this2.current = $param2 AND this3.fullName = $param3) | 1]) = 1) | 1]) = 1 AND size([(this)-[this4:HAS_NAME]->(this5:\`NameDetails\`) WHERE (this4.current = $param4 AND this5.fullName CONTAINS $param5) | 1]) = 1)
            CALL {
                WITH this
                MATCH (this)-[this_connection_nameDetailsConnectionthis0:HAS_NAME]->(this_NameDetails:\`NameDetails\`)
                WHERE this_connection_nameDetailsConnectionthis0.current = $this_connection_nameDetailsConnectionparam0
                WITH { node: { fullName: this_NameDetails.fullName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS nameDetailsConnection
            }
            CALL {
                WITH this
                MATCH (this)-[this_connection_architectureConnectionthis0:ARCHITECTURE]->(this_MasterData:\`MasterData\`)
                WHERE this_connection_architectureConnectionthis0.current = $this_connection_architectureConnectionparam0
                CALL {
                    WITH this_MasterData
                    MATCH (this_MasterData)-[this_MasterData_connection_nameDetailsConnectionthis0:HAS_NAME]->(this_MasterData_NameDetails:\`NameDetails\`)
                    WHERE this_MasterData_connection_nameDetailsConnectionthis0.current = $this_MasterData_connection_nameDetailsConnectionparam0
                    WITH { node: { fullName: this_MasterData_NameDetails.fullName } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS nameDetailsConnection
                }
                WITH { node: { nameDetailsConnection: nameDetailsConnection } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS architectureConnection
            }
            RETURN this { .id, nameDetailsConnection: nameDetailsConnection, architectureConnection: architectureConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": true,
                \\"param2\\": true,
                \\"param3\\": \\"MHA\\",
                \\"param4\\": true,
                \\"param5\\": \\"1\\",
                \\"this_connection_nameDetailsConnectionparam0\\": true,
                \\"this_connection_architectureConnectionparam0\\": true,
                \\"this_MasterData_connection_nameDetailsConnectionparam0\\": true
            }"
        `);
    });
});
