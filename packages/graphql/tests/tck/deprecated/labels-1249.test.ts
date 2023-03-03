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
                @node(additionalLabels: ["$context.cypherParams.tenant"]) {
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
                MATCH (this)-[this0:\`MATERIAL_BULK\`]->(this1:\`Material\`)
                CALL {
                    WITH this1
                    MATCH (this1:\`Material\`)-[this2:\`MATERIAL_SUPPLIER\`]->(this3:\`Supplier\`)
                    WITH { supplierMaterialNumber: this2.\`supplierMaterialNumber\`, node: { supplierId: this3.\`supplierId\` } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var4
                }
                WITH this1 { .id, suppliersConnection: var4 } AS this1
                RETURN head(collect(this1)) AS var5
            }
            RETURN this { .supplierMaterialNumber, material: var5 } AS this"
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
