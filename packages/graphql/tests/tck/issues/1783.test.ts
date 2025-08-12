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
                id: ID!
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
                nameDetails: [NameDetails!]!
                    @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }

            type NameDetails @mutation(operations: []) @query(read: false, aggregate: false) @node {
                fullName: String!
            }

            type RelationProps @relationshipProperties {
                current: Boolean!
            }

            type MasterData @node {
                id: ID!
                current: Boolean!
                nameDetails: [NameDetails!]!
                    @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
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
                current: { eq: true },
                nameDetailsConnection: {
                    some: {
                        edge: {
                            current: { eq: true },
                        },
                        node: {
                            fullName_CONTAINS: "1",
                        },
                    },
                },
                architectureConnection: {
                    single: {
                        edge: {
                            current: { eq: true },
                        },
                        node: {
                            nameDetailsConnection: {
                                some: {
                                    edge: {
                                        current: { eq: true },
                                    },
                                    node: {
                                        fullName: { eq: "MHA" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            connectionWhere: {
                current: { eq: true },
            },
        };

        const result = await translateQuery(neoSchema, query, { variableValues });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Series)
            WHERE (this.current = $param0 AND single(this0 IN [(this)-[this3:ARCHITECTURE]->(this0:MasterData) WHERE (EXISTS {
                MATCH (this0)-[this1:HAS_NAME]->(this2:NameDetails)
                WHERE (this2.fullName = $param1 AND this1.current = $param2)
            } AND this3.current = $param3) | 1] WHERE true) AND EXISTS {
                MATCH (this)-[this4:HAS_NAME]->(this5:NameDetails)
                WHERE (this5.fullName CONTAINS $param4 AND this4.current = $param5)
            })
            CALL (this) {
                MATCH (this)-[this6:HAS_NAME]->(this7:NameDetails)
                WHERE this6.current = $param6
                WITH collect({ node: this7, relationship: this6 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this7, edge.relationship AS this6
                    RETURN collect({ node: { fullName: this7.fullName, __resolveType: \\"NameDetails\\" } }) AS var8
                }
                RETURN { edges: var8 } AS var9
            }
            CALL (this) {
                MATCH (this)-[this10:ARCHITECTURE]->(this11:MasterData)
                WHERE this10.current = $param7
                WITH collect({ node: this11, relationship: this10 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this11, edge.relationship AS this10
                    CALL (this11) {
                        MATCH (this11)-[this12:HAS_NAME]->(this13:NameDetails)
                        WHERE this12.current = $param8
                        WITH collect({ node: this13, relationship: this12 }) AS edges
                        CALL (edges) {
                            UNWIND edges AS edge
                            WITH edge.node AS this13, edge.relationship AS this12
                            RETURN collect({ node: { fullName: this13.fullName, __resolveType: \\"NameDetails\\" } }) AS var14
                        }
                        RETURN { edges: var14 } AS var15
                    }
                    RETURN collect({ node: { nameDetailsConnection: var15, __resolveType: \\"MasterData\\" } }) AS var16
                }
                RETURN { edges: var16 } AS var17
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
