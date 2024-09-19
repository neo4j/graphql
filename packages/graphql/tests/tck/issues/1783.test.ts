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

describe("https://github.com/neo4j/graphql/issues/1783", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Series @node {
                id: ID! @unique
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
                nameDetails: NameDetails @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }

            type NameDetails @mutation(operations: []) @query(read: false, aggregate: false) @node {
                fullName: String!
            }

            type RelationProps @relationshipProperties {
                current: Boolean!
            }

            type MasterData @node {
                id: ID! @unique
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should add parameters with implicit and", async () => {
        const query = /* GraphQL */ `
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
                current_EQ: true,
                nameDetailsConnection: {
                    edge: {
                        current_EQ: true,
                    },
                    node: {
                        fullName_CONTAINS: "1",
                    },
                },
                architectureConnection_SINGLE: {
                    edge: {
                        current_EQ: true,
                    },
                    node: {
                        nameDetailsConnection: {
                            edge: {
                                current_EQ: true,
                            },
                            node: {
                                fullName_EQ: "MHA",
                            },
                        },
                    },
                },
            },
            connectionWhere: {
                current_EQ: true,
            },
        };

        const result = await translateQuery(neoSchema, query, { variableValues });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Series)
            WHERE (this.current = $param0 AND single(this2 IN [(this)-[this3:ARCHITECTURE]->(this2:MasterData) WHERE (single(this0 IN [(this2)-[this1:HAS_NAME]->(this0:NameDetails) WHERE (this0.fullName = $param1 AND this1.current = $param2) | 1] WHERE true) AND this3.current = $param3) | 1] WHERE true) AND single(this4 IN [(this)-[this5:HAS_NAME]->(this4:NameDetails) WHERE (this4.fullName CONTAINS $param4 AND this5.current = $param5) | 1] WHERE true))
            CALL {
                WITH this
                MATCH (this)-[this6:HAS_NAME]->(this7:NameDetails)
                WHERE this6.current = $param6
                WITH collect({ node: this7, relationship: this6 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this7, edge.relationship AS this6
                    RETURN collect({ node: { fullName: this7.fullName, __resolveType: \\"NameDetails\\" } }) AS var8
                }
                RETURN { edges: var8, totalCount: totalCount } AS var9
            }
            CALL {
                WITH this
                MATCH (this)-[this10:ARCHITECTURE]->(this11:MasterData)
                WHERE this10.current = $param7
                WITH collect({ node: this11, relationship: this10 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this11, edge.relationship AS this10
                    CALL {
                        WITH this11
                        MATCH (this11)-[this12:HAS_NAME]->(this13:NameDetails)
                        WHERE this12.current = $param8
                        WITH collect({ node: this13, relationship: this12 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this13, edge.relationship AS this12
                            RETURN collect({ node: { fullName: this13.fullName, __resolveType: \\"NameDetails\\" } }) AS var14
                        }
                        RETURN { edges: var14, totalCount: totalCount } AS var15
                    }
                    RETURN collect({ node: { nameDetailsConnection: var15, __resolveType: \\"MasterData\\" } }) AS var16
                }
                RETURN { edges: var16, totalCount: totalCount } AS var17
            }
            RETURN this { .id, nameDetailsConnection: var9, architectureConnection: var17 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"MHA\\",
                \\"param2\\": true,
                \\"param3\\": true,
                \\"param4\\": \\"1\\",
                \\"param5\\": true,
                \\"param6\\": true,
                \\"param7\\": true,
                \\"param8\\": true
            }"
        `);
    });
});
