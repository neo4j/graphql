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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1249", () => {
    const testHelper = new TestHelper();

    let Bulk: UniqueType;
    let Material: UniqueType;
    let Supplier: UniqueType;
    let typeDefs: string;

    beforeAll(() => {
        Bulk = testHelper.createUniqueType("Bulk");
        Material = testHelper.createUniqueType("Material");
        Supplier = testHelper.createUniqueType("Supplier");
        typeDefs = `
        type ${Bulk}
            @mutation(operations: [])
            @node(labels: ["Bulk", "$tenant"]) {
            id: ID!
            supplierMaterialNumber: String!
            material: ${Material}! @relationship(type: "MATERIAL_BULK", direction: OUT)
        }

        type ${Material} @mutation(operations: []) {
            id: ID!
            itemNumber: String!

            suppliers: [${Supplier}!]!
                @relationship(type: "MATERIAL_SUPPLIER", properties: "RelationMaterialSupplier", direction: OUT)
        }

        type ${Supplier} @mutation(operations: []) {
            id: ID!
            name: String
            supplierId: String!
        }

        type RelationMaterialSupplier @relationshipProperties {
            supplierMaterialNumber: String!
        }
    `;
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should pass the cypherParams from the context correctly at the top level translate", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                ${Bulk.plural} {
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

        const res = await testHelper.executeGraphQL(query, {
            contextValue: { cypherParams: { tenant: "BULK" } },
        });

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            [Bulk.plural]: [],
        });
    });
});
