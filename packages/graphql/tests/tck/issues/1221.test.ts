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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1221", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    test("should apply where filter for deep relations, two relations deep", async () => {
        typeDefs = gql`
            type Series {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
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

        const query = gql`
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
            "MATCH (this:\`Series\`)
            CALL {
                WITH this
                MATCH (this)-[this0:ARCHITECTURE]->(this1:\`MasterData\`)
                OPTIONAL MATCH (this1)-[this2:HAS_NAME]->(this3:\`NameDetails\`)
                WITH *
                WHERE this3.fullName = $param0
                RETURN count(this1) = 1 AS var4
            }
            WITH *
            WHERE (this.current = $param1 AND var4 = true)
            CALL {
                WITH this
                MATCH (this)-[this5:ARCHITECTURE]->(this6:\`MasterData\`)
                WHERE this5.current = $param2
                CALL {
                    WITH this6
                    MATCH (this6:\`MasterData\`)-[this7:HAS_NAME]->(this8:\`NameDetails\`)
                    WHERE this7.current = $param3
                    WITH { node: { fullName: this8.fullName } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var9
                }
                WITH { node: { nameDetailsConnection: var9 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var10
            }
            RETURN this { .id, architectureConnection: var10 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"MHA\\",
                \\"param1\\": true,
                \\"param2\\": true,
                \\"param3\\": true
            }"
        `);
    });

    test("should apply where filter for deep relations, three relations deep", async () => {
        typeDefs = gql`
            type Main {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                main: [Series!]! @relationship(type: "MAIN", properties: "RelationProps", direction: OUT)
            }

            type Series {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                architecture: [MasterData!]!
                    @relationship(type: "ARCHITECTURE", properties: "RelationProps", direction: OUT)
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

        const query = gql`
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
            "MATCH (this:\`Main\`)
            CALL {
                WITH this
                MATCH (this)-[this0:MAIN]->(this1:\`Series\`)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:ARCHITECTURE]->(this3:\`MasterData\`)
                    OPTIONAL MATCH (this3)-[this4:HAS_NAME]->(this5:\`NameDetails\`)
                    WITH *
                    WHERE this5.fullName = $param0
                    RETURN count(this3) > 0 AS var6
                }
                WITH *
                WHERE var6 = true
                RETURN count(this1) = 1 AS var7
            }
            WITH *
            WHERE (this.current = $param1 AND var7 = true)
            CALL {
                WITH this
                MATCH (this)-[this8:MAIN]->(this9:\`Series\`)
                WHERE this8.current = $param2
                CALL {
                    WITH this9
                    MATCH (this9:\`Series\`)-[this10:ARCHITECTURE]->(this11:\`MasterData\`)
                    WHERE this10.current = $param3
                    CALL {
                        WITH this11
                        MATCH (this11:\`MasterData\`)-[this12:HAS_NAME]->(this13:\`NameDetails\`)
                        WHERE this12.current = $param4
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
                WITH { node: { architectureConnection: var15 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var16
            }
            RETURN this { .id, mainConnection: var16 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"MHA\\",
                \\"param1\\": true,
                \\"param2\\": true,
                \\"param3\\": true,
                \\"param4\\": true
            }"
        `);
    });
});
