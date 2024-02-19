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

describe("https://github.com/neo4j/graphql/issues/1249", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Bulk @mutation(operations: []) @node(labels: ["Bulk", "$tenant"]) {
                id: ID!
                supplierMaterialNumber: String!
                material: Material! @relationship(type: "MATERIAL_BULK", direction: OUT)
            }

            type Material @mutation(operations: []) {
                id: ID!
                itemNumber: String!

                suppliers: [Supplier!]!
                    @relationship(type: "MATERIAL_SUPPLIER", properties: "RelationMaterialSupplier", direction: OUT)
            }

            type Supplier @mutation(operations: []) {
                id: ID!
                name: String
                supplierId: String!
            }

            type RelationMaterialSupplier @relationshipProperties {
                supplierMaterialNumber: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should contain the cypherParams that are passed via the context", async () => {
        const query = /* GraphQL */ `
            query {
                bulks {
                    supplierMaterialNumber
                    material {
                        id
                        suppliersConnection {
                            edges {
                                properties {
                                    supplierMaterialNumber
                                }
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
            "MATCH (this:Bulk:BULK)
            CALL {
                WITH this
                MATCH (this)-[this0:MATERIAL_BULK]->(this1:Material)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:MATERIAL_SUPPLIER]->(this3:Supplier)
                    WITH collect({ node: this3, relationship: this2 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this3, edge.relationship AS this2
                        RETURN collect({ properties: { supplierMaterialNumber: this2.supplierMaterialNumber, __resolveType: \\"RelationMaterialSupplier\\" }, node: { supplierId: this3.supplierId, __resolveType: \\"Supplier\\" } }) AS var4
                    }
                    RETURN { edges: var4, totalCount: totalCount } AS var5
                }
                WITH this1 { .id, suppliersConnection: var5 } AS this1
                RETURN head(collect(this1)) AS var6
            }
            RETURN this { .supplierMaterialNumber, material: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"tenant\\": \\"BULK\\"
            }"
        `);
    });
});
