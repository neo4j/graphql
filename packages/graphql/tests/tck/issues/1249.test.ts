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

describe("https://github.com/neo4j/graphql/issues/1249", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Bulk
                @exclude(operations: [CREATE, DELETE, UPDATE])
                @node(labels: ["Bulk", "$context.cypherParams.tenant"]) {
                id: ID!
                supplierMaterialNumber: String!
                material: Material! @relationship(type: "MATERIAL_BULK", direction: OUT)
            }

            type Material @exclude(operations: [CREATE, DELETE, UPDATE]) {
                id: ID!
                itemNumber: String!

                suppliers: [Supplier!]!
                    @relationship(type: "MATERIAL_SUPPLIER", properties: "RelationMaterialSupplier", direction: OUT)
            }

            type Supplier @exclude(operations: [CREATE, DELETE, UPDATE]) {
                id: ID!
                name: String
                supplierId: String!
            }

            interface RelationMaterialSupplier @relationshipProperties {
                supplierMaterialNumber: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should contain the cypherParams that are passed via the context", async () => {
        const query = gql`
            query {
                bulks {
                    supplierMaterialNumber
                    material {
                        id
                        suppliersConnection {
                            edges {
                                supplierMaterialNumber
                                node {
                                    supplierId
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { contextValues: { cypherParams: { tenant: "BULK" } } });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Bulk\`:\`BULK\`)
            CALL {
                WITH this
                MATCH (this)-[this0:MATERIAL_BULK]->(this_material:\`Material\`)
                CALL {
                    WITH this_material
                    MATCH (this_material)-[this_material_connection_suppliersConnectionthis0:MATERIAL_SUPPLIER]->(this_material_Supplier:\`Supplier\`)
                    WITH { supplierMaterialNumber: this_material_connection_suppliersConnectionthis0.supplierMaterialNumber, node: { supplierId: this_material_Supplier.supplierId } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_material_suppliersConnection
                }
                WITH this_material { .id, suppliersConnection: this_material_suppliersConnection } AS this_material
                RETURN head(collect(this_material)) AS this_material
            }
            RETURN this { .supplierMaterialNumber, material: this_material } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"cypherParams\\": {
                    \\"tenant\\": \\"BULK\\"
                }
            }"
        `);
    });
});
