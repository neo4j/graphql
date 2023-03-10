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
            WHERE (this.current = $param0 AND single(this3 IN [(this)-[this0:ARCHITECTURE]->(this3:\`MasterData\`) WHERE (this0.current = $param1 AND single(this2 IN [(this3)-[this1:HAS_NAME]->(this2:\`NameDetails\`) WHERE (this1.current = $param2 AND this2.fullName = $param3) | 1] WHERE true)) | 1] WHERE true) AND single(this5 IN [(this)-[this4:HAS_NAME]->(this5:\`NameDetails\`) WHERE (this4.current = $param4 AND this5.fullName CONTAINS $param5) | 1] WHERE true))
            CALL {
                WITH this
                MATCH (this)-[this6:HAS_NAME]->(this7:\`NameDetails\`)
                WHERE this6.current = $param6
                WITH { node: { fullName: this7.fullName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var8
            }
            CALL {
                WITH this
                MATCH (this)-[this9:ARCHITECTURE]->(this10:\`MasterData\`)
                WHERE this9.current = $param7
                CALL {
                    WITH this10
                    MATCH (this10:\`MasterData\`)-[this11:HAS_NAME]->(this12:\`NameDetails\`)
                    WHERE this11.current = $param8
                    WITH { node: { fullName: this12.fullName } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var13
                }
                WITH { node: { nameDetailsConnection: var13 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var14
            }
            RETURN this { .id, nameDetailsConnection: var8, architectureConnection: var14 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": true,
                \\"param2\\": true,
                \\"param3\\": \\"MHA\\",
                \\"param4\\": true,
                \\"param5\\": \\"1\\",
                \\"param6\\": true,
                \\"param7\\": true,
                \\"param8\\": true
            }"
        `);
    });
});
