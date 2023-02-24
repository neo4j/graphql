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
            WHERE (this.current = $param0 AND single(this1 IN [(this)-[this3:ARCHITECTURE]->(this1:\`MasterData\`) WHERE single(this0 IN [(this1)-[this2:HAS_NAME]->(this0:\`NameDetails\`) WHERE this0.fullName = $param1 | 1] WHERE true) | 1] WHERE true))
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
                    RETURN { edges: edges, totalCount: totalCount } AS this_MasterData_nameDetailsConnection
                }
                WITH { node: { nameDetailsConnection: this_MasterData_nameDetailsConnection } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_architectureConnection
            }
            RETURN this { .id, architectureConnection: this_architectureConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"MHA\\",
                \\"this_connection_architectureConnectionparam0\\": true,
                \\"this_MasterData_connection_nameDetailsConnectionparam0\\": true
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
            WHERE (this.current = $param0 AND single(this0 IN [(this)-[this5:MAIN]->(this0:\`Series\`) WHERE EXISTS {
                MATCH (this0)-[this1:ARCHITECTURE]->(this2:\`MasterData\`)
                WHERE single(this3 IN [(this2)-[this4:HAS_NAME]->(this3:\`NameDetails\`) WHERE this3.fullName = $param1 | 1] WHERE true)
            } | 1] WHERE true))
            CALL {
                WITH this
                MATCH (this)-[this_connection_mainConnectionthis0:MAIN]->(this_Series:\`Series\`)
                WHERE this_connection_mainConnectionthis0.current = $this_connection_mainConnectionparam0
                CALL {
                    WITH this_Series
                    MATCH (this_Series)-[this_Series_connection_architectureConnectionthis0:ARCHITECTURE]->(this_Series_MasterData:\`MasterData\`)
                    WHERE this_Series_connection_architectureConnectionthis0.current = $this_Series_connection_architectureConnectionparam0
                    CALL {
                        WITH this_Series_MasterData
                        MATCH (this_Series_MasterData)-[this_Series_MasterData_connection_nameDetailsConnectionthis0:HAS_NAME]->(this_Series_MasterData_NameDetails:\`NameDetails\`)
                        WHERE this_Series_MasterData_connection_nameDetailsConnectionthis0.current = $this_Series_MasterData_connection_nameDetailsConnectionparam0
                        WITH { node: { fullName: this_Series_MasterData_NameDetails.fullName } } AS edge
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS this_Series_MasterData_nameDetailsConnection
                    }
                    WITH { node: { nameDetailsConnection: this_Series_MasterData_nameDetailsConnection } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_Series_architectureConnection
                }
                WITH { node: { architectureConnection: this_Series_architectureConnection } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_mainConnection
            }
            RETURN this { .id, mainConnection: this_mainConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"MHA\\",
                \\"this_connection_mainConnectionparam0\\": true,
                \\"this_Series_connection_architectureConnectionparam0\\": true,
                \\"this_Series_MasterData_connection_nameDetailsConnectionparam0\\": true
            }"
        `);
    });
});
