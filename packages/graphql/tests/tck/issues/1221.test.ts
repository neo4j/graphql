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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1221", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    test("should apply where filter for deep relations, two relations deep", async () => {
        typeDefs = /* GraphQL */ `
            type Series {
                id: ID! @unique
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
            }

            type NameDetails @mutation(operations: []) @query(read: false, aggregate: false) {
                fullName: String!
            }

            type RelationProps @relationshipProperties {
                current: Boolean!
            }

            type MasterData {
                id: ID! @unique
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                series(
                    where: {
                        current: true
                        architectureConnection_SINGLE: {
                            node: { nameDetailsConnection: { node: { fullName: "MHA" } } }
                        }
                    }
                ) {
                    id
                    architectureConnection(where: { edge: { current: true } }) {
                        edges {
                            node {
                                nameDetailsConnection(where: { edge: { current: true } }) {
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Series)
            WHERE (this.current = $param0 AND single(this1 IN [(this)-[this3:ARCHITECTURE]->(this1:MasterData) WHERE single(this0 IN [(this1)-[this2:HAS_NAME]->(this0:NameDetails) WHERE this0.fullName = $param1 | 1] WHERE true) | 1] WHERE true))
            CALL {
                WITH this
                MATCH (this)-[this4:ARCHITECTURE]->(this5:MasterData)
                WHERE this4.current = $param2
                WITH collect({ node: this5, relationship: this4 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this5, edge.relationship AS this4
                    CALL {
                        WITH this5
                        MATCH (this5)-[this6:HAS_NAME]->(this7:NameDetails)
                        WHERE this6.current = $param3
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
                    RETURN collect({ node: { nameDetailsConnection: var9, __resolveType: \\"MasterData\\" } }) AS var10
                }
                RETURN { edges: var10, totalCount: totalCount } AS var11
            }
            RETURN this { .id, architectureConnection: var11 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"MHA\\",
                \\"param2\\": true,
                \\"param3\\": true
            }"
        `);
    });

    test("should apply where filter for deep relations, three relations deep", async () => {
        typeDefs = /* GraphQL */ `
            type Main {
                id: ID! @unique
                current: Boolean!
                main: [Series!]! @relationship(type: "MAIN", properties: "RelationProps", direction: OUT)
            }

            type Series {
                id: ID! @unique
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
            }

            type NameDetails @mutation(operations: []) @query(read: false, aggregate: false) {
                fullName: String!
            }

            type RelationProps @relationshipProperties {
                current: Boolean!
            }

            type MasterData {
                id: ID! @unique
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", properties: "RelationProps", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                mains(
                    where: {
                        current: true
                        mainConnection_SINGLE: {
                            node: {
                                architectureConnection: {
                                    node: { nameDetailsConnection: { node: { fullName: "MHA" } } }
                                }
                            }
                        }
                    }
                ) {
                    id
                    mainConnection(where: { edge: { current: true } }) {
                        edges {
                            node {
                                architectureConnection(where: { edge: { current: true } }) {
                                    edges {
                                        node {
                                            nameDetailsConnection(where: { edge: { current: true } }) {
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
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Main)
            WHERE (this.current = $param0 AND single(this0 IN [(this)-[this5:MAIN]->(this0:Series) WHERE EXISTS {
                MATCH (this0)-[this1:ARCHITECTURE]->(this2:MasterData)
                WHERE single(this3 IN [(this2)-[this4:HAS_NAME]->(this3:NameDetails) WHERE this3.fullName = $param1 | 1] WHERE true)
            } | 1] WHERE true))
            CALL {
                WITH this
                MATCH (this)-[this6:MAIN]->(this7:Series)
                WHERE this6.current = $param2
                WITH collect({ node: this7, relationship: this6 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this7, edge.relationship AS this6
                    CALL {
                        WITH this7
                        MATCH (this7)-[this8:ARCHITECTURE]->(this9:MasterData)
                        WHERE this8.current = $param3
                        WITH collect({ node: this9, relationship: this8 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this9, edge.relationship AS this8
                            CALL {
                                WITH this9
                                MATCH (this9)-[this10:HAS_NAME]->(this11:NameDetails)
                                WHERE this10.current = $param4
                                WITH collect({ node: this11, relationship: this10 }) AS edges
                                WITH edges, size(edges) AS totalCount
                                CALL {
                                    WITH edges
                                    UNWIND edges AS edge
                                    WITH edge.node AS this11, edge.relationship AS this10
                                    RETURN collect({ node: { fullName: this11.fullName, __resolveType: \\"NameDetails\\" } }) AS var12
                                }
                                RETURN { edges: var12, totalCount: totalCount } AS var13
                            }
                            RETURN collect({ node: { nameDetailsConnection: var13, __resolveType: \\"MasterData\\" } }) AS var14
                        }
                        RETURN { edges: var14, totalCount: totalCount } AS var15
                    }
                    RETURN collect({ node: { architectureConnection: var15, __resolveType: \\"Series\\" } }) AS var16
                }
                RETURN { edges: var16, totalCount: totalCount } AS var17
            }
            RETURN this { .id, mainConnection: var17 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"MHA\\",
                \\"param2\\": true,
                \\"param3\\": true,
                \\"param4\\": true
            }"
        `);
    });
});
