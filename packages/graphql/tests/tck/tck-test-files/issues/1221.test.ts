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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

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
            WHERE (this.current = $param0
            AND (exists((this)-[:\`ARCHITECTURE\`]->(:\`MasterData\`))
            AND SINGLE(var3 IN [(this)-[this1:\`ARCHITECTURE\`]->(this2:\`MasterData\`) | { node: this2, relationship: this1 }]
                        WHERE apoc.cypher.runFirstColumn(\\"RETURN EXISTS((var3_node)-[:HAS_NAME]->(:NameDetails))
            AND SINGLE(var3_node_NameDetails_map IN [(var3_node)-[var3_node_NameDetails_MasterDataNameDetailsRelationship:HAS_NAME]->(var3_node_NameDetails:NameDetails) | { node: var3_node_NameDetails, relationship: var3_node_NameDetails_MasterDataNameDetailsRelationship } ] WHERE
            var3_node_NameDetails_map.node.fullName = $nestedParam1.node.nameDetailsConnection.node.fullName
            )\\", { var3_node: var3.node, nestedParam1: $nestedParam1 }, false))))
            CALL {
            WITH this
            MATCH (this)-[this_architecture_relationship:ARCHITECTURE]->(this_masterdata:MasterData)
            WHERE this_architecture_relationship.current = $this_architectureConnection.args.where.edge.current
            CALL {
            WITH this_masterdata
            MATCH (this_masterdata)-[this_masterdata_has_name_relationship:HAS_NAME]->(this_masterdata_namedetails:NameDetails)
            WHERE this_masterdata_has_name_relationship.current = $this_architectureConnection.edges.node.nameDetailsConnection.args.where.edge.current
            WITH collect({ node: { fullName: this_masterdata_namedetails.fullName } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS nameDetailsConnection
            }
            WITH collect({ node: { nameDetailsConnection: nameDetailsConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS architectureConnection
            }
            RETURN this { .id, architectureConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"nestedParam1\\": {
                    \\"node\\": {
                        \\"nameDetailsConnection\\": {
                            \\"node\\": {
                                \\"fullName\\": \\"MHA\\"
                            }
                        }
                    }
                },
                \\"this_architectureConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"current\\": true
                            }
                        }
                    },
                    \\"edges\\": {
                        \\"node\\": {
                            \\"nameDetailsConnection\\": {
                                \\"args\\": {
                                    \\"where\\": {
                                        \\"edge\\": {
                                            \\"current\\": true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
            WHERE (this.current = $param0
            AND (exists((this)-[:\`MAIN\`]->(:\`Series\`))
            AND SINGLE(var3 IN [(this)-[this1:\`MAIN\`]->(this2:\`Series\`) | { node: this2, relationship: this1 }]
                        WHERE apoc.cypher.runFirstColumn(\\"RETURN EXISTS((var3_node)-[:ARCHITECTURE]->(:MasterData))
            AND SINGLE(var3_node_MasterData_map IN [(var3_node)-[var3_node_MasterData_SeriesArchitectureRelationship:ARCHITECTURE]->(var3_node_MasterData:MasterData) | { node: var3_node_MasterData, relationship: var3_node_MasterData_SeriesArchitectureRelationship } ] WHERE
            apoc.cypher.runFirstColumn(\\\\\\"RETURN EXISTS((var3_node_MasterData_map_node)-[:HAS_NAME]->(:NameDetails))
            AND SINGLE(var3_node_MasterData_map_node_NameDetails_map IN [(var3_node_MasterData_map_node)-[var3_node_MasterData_map_node_NameDetails_MasterDataNameDetailsRelationship:HAS_NAME]->(var3_node_MasterData_map_node_NameDetails:NameDetails) | { node: var3_node_MasterData_map_node_NameDetails, relationship: var3_node_MasterData_map_node_NameDetails_MasterDataNameDetailsRelationship } ] WHERE
            var3_node_MasterData_map_node_NameDetails_map.node.fullName = $nestedParam1.node.architectureConnection.node.nameDetailsConnection.node.fullName
            )\\\\\\", { var3_node_MasterData_map_node: var3_node_MasterData_map.node, nestedParam1: $nestedParam1 }, false)
            )\\", { var3_node: var3.node, nestedParam1: $nestedParam1 }, false))))
            CALL {
            WITH this
            MATCH (this)-[this_main_relationship:MAIN]->(this_series:Series)
            WHERE this_main_relationship.current = $this_mainConnection.args.where.edge.current
            CALL {
            WITH this_series
            MATCH (this_series)-[this_series_architecture_relationship:ARCHITECTURE]->(this_series_masterdata:MasterData)
            WHERE this_series_architecture_relationship.current = $this_mainConnection.edges.node.architectureConnection.args.where.edge.current
            CALL {
            WITH this_series_masterdata
            MATCH (this_series_masterdata)-[this_series_masterdata_has_name_relationship:HAS_NAME]->(this_series_masterdata_namedetails:NameDetails)
            WHERE this_series_masterdata_has_name_relationship.current = $this_mainConnection.edges.node.architectureConnection.edges.node.nameDetailsConnection.args.where.edge.current
            WITH collect({ node: { fullName: this_series_masterdata_namedetails.fullName } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS nameDetailsConnection
            }
            WITH collect({ node: { nameDetailsConnection: nameDetailsConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS architectureConnection
            }
            WITH collect({ node: { architectureConnection: architectureConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS mainConnection
            }
            RETURN this { .id, mainConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"nestedParam1\\": {
                    \\"node\\": {
                        \\"architectureConnection\\": {
                            \\"node\\": {
                                \\"nameDetailsConnection\\": {
                                    \\"node\\": {
                                        \\"fullName\\": \\"MHA\\"
                                    }
                                }
                            }
                        }
                    }
                },
                \\"this_mainConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"current\\": true
                            }
                        }
                    },
                    \\"edges\\": {
                        \\"node\\": {
                            \\"architectureConnection\\": {
                                \\"args\\": {
                                    \\"where\\": {
                                        \\"edge\\": {
                                            \\"current\\": true
                                        }
                                    }
                                },
                                \\"edges\\": {
                                    \\"node\\": {
                                        \\"nameDetailsConnection\\": {
                                            \\"args\\": {
                                                \\"where\\": {
                                                    \\"edge\\": {
                                                        \\"current\\": true
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
            }"
        `);
    });
});
