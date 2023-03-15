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
            CALL {
                WITH this
                MATCH (this)-[this0:ARCHITECTURE]->(this1:\`MasterData\`)
                OPTIONAL MATCH (this1)-[this2:HAS_NAME]->(this3:\`NameDetails\`)
                WITH *
                WHERE (this0.current = $param0 AND (this2.current = $param1 AND this3.fullName = $param2))
                RETURN count(this1) = 1 AS var4
            }
            OPTIONAL MATCH (this)-[this5:HAS_NAME]->(this6:\`NameDetails\`)
            WITH *
            WHERE (this.current = $param3 AND var4 = true AND (this5.current = $param4 AND this6.fullName CONTAINS $param5))
            CALL {
                WITH this
                MATCH (this)-[this7:HAS_NAME]->(this8:\`NameDetails\`)
                WHERE this7.current = $param6
                WITH { node: { fullName: this8.fullName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var9
            }
            CALL {
                WITH this
                MATCH (this)-[this10:ARCHITECTURE]->(this11:\`MasterData\`)
                WHERE this10.current = $param7
                CALL {
                    WITH this11
                    MATCH (this11:\`MasterData\`)-[this12:HAS_NAME]->(this13:\`NameDetails\`)
                    WHERE this12.current = $param8
                    WITH { node: { fullName: this13.fullName } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var14
                }
                WITH { node: { nameDetailsConnection: var14 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var15
            }
            RETURN this { .id, nameDetailsConnection: var9, architectureConnection: var15 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": true,
                \\"param2\\": \\"MHA\\",
                \\"param3\\": true,
                \\"param4\\": true,
                \\"param5\\": \\"1\\",
                \\"param6\\": true,
                \\"param7\\": true,
                \\"param8\\": true
            }"
        `);
    });
});
