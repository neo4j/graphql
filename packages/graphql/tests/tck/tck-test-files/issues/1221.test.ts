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
            "MATCH (this:Series)
            WHERE this.current = $this_current AND exists((this)-[:ARCHITECTURE]->(:MasterData)) AND single(this_architectureConnection_SINGLE_MasterData_map IN [(this)-[this_architectureConnection_SINGLE_MasterData_SeriesArchitectureRelationship:ARCHITECTURE]->(this_architectureConnection_SINGLE_MasterData:MasterData)  | { node: this_architectureConnection_SINGLE_MasterData, relationship: this_architectureConnection_SINGLE_MasterData_SeriesArchitectureRelationship } ] WHERE apoc.cypher.runFirstColumn(\\"RETURN exists((this_architectureConnection_SINGLE_MasterData_map_node)-[:HAS_NAME]->(:NameDetails))
            AND single(this_architectureConnection_SINGLE_MasterData_map_node_NameDetails_map IN [(this_architectureConnection_SINGLE_MasterData_map_node)-[this_architectureConnection_SINGLE_MasterData_map_node_NameDetails_MasterDataNameDetailsRelationship:HAS_NAME]->(this_architectureConnection_SINGLE_MasterData_map_node_NameDetails:NameDetails) | { node: this_architectureConnection_SINGLE_MasterData_map_node_NameDetails, relationship: this_architectureConnection_SINGLE_MasterData_map_node_NameDetails_MasterDataNameDetailsRelationship } ] WHERE
            this_architectureConnection_SINGLE_MasterData_map_node_NameDetails_map.node.fullName = $this_series.where.architectureConnection_SINGLE.node.nameDetailsConnection.node.fullName
            )\\", { this_architectureConnection_SINGLE_MasterData_map_node: this_architectureConnection_SINGLE_MasterData_map.node, this_series: $this_series }, false))
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
                \\"this_current\\": true,
                \\"this_series\\": {
                    \\"where\\": {
                        \\"architectureConnection_SINGLE\\": {
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
            "MATCH (this:Main)
            WHERE this.current = $this_current AND exists((this)-[:MAIN]->(:Series)) AND single(this_mainConnection_SINGLE_Series_map IN [(this)-[this_mainConnection_SINGLE_Series_MainMainRelationship:MAIN]->(this_mainConnection_SINGLE_Series:Series)  | { node: this_mainConnection_SINGLE_Series, relationship: this_mainConnection_SINGLE_Series_MainMainRelationship } ] WHERE apoc.cypher.runFirstColumn(\\"RETURN exists((this_mainConnection_SINGLE_Series_map_node)-[:ARCHITECTURE]->(:MasterData))
            AND single(this_mainConnection_SINGLE_Series_map_node_MasterData_map IN [(this_mainConnection_SINGLE_Series_map_node)-[this_mainConnection_SINGLE_Series_map_node_MasterData_SeriesArchitectureRelationship:ARCHITECTURE]->(this_mainConnection_SINGLE_Series_map_node_MasterData:MasterData) | { node: this_mainConnection_SINGLE_Series_map_node_MasterData, relationship: this_mainConnection_SINGLE_Series_map_node_MasterData_SeriesArchitectureRelationship } ] WHERE
            apoc.cypher.runFirstColumn(\\\\\\"RETURN exists((this_mainConnection_SINGLE_Series_map_node_MasterData_map_node)-[:HAS_NAME]->(:NameDetails))
            AND single(this_mainConnection_SINGLE_Series_map_node_MasterData_map_node_NameDetails_map IN [(this_mainConnection_SINGLE_Series_map_node_MasterData_map_node)-[this_mainConnection_SINGLE_Series_map_node_MasterData_map_node_NameDetails_MasterDataNameDetailsRelationship:HAS_NAME]->(this_mainConnection_SINGLE_Series_map_node_MasterData_map_node_NameDetails:NameDetails) | { node: this_mainConnection_SINGLE_Series_map_node_MasterData_map_node_NameDetails, relationship: this_mainConnection_SINGLE_Series_map_node_MasterData_map_node_NameDetails_MasterDataNameDetailsRelationship } ] WHERE
            this_mainConnection_SINGLE_Series_map_node_MasterData_map_node_NameDetails_map.node.fullName = $this_mains.where.mainConnection_SINGLE.node.architectureConnection.node.nameDetailsConnection.node.fullName
            )\\\\\\", { this_mainConnection_SINGLE_Series_map_node_MasterData_map_node: this_mainConnection_SINGLE_Series_map_node_MasterData_map.node, this_mains: $this_mains }, false)
            )\\", { this_mainConnection_SINGLE_Series_map_node: this_mainConnection_SINGLE_Series_map.node, this_mains: $this_mains }, false))
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
                \\"this_current\\": true,
                \\"this_mains\\": {
                    \\"where\\": {
                        \\"mainConnection_SINGLE\\": {
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
