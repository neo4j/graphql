/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            material: [${Material}!]! @relationship(type: "MATERIAL_BULK", direction: OUT)
        }

        type ${Material} @mutation(operations: []) @node {
            id: ID!
            itemNumber: String!

            suppliers: [${Supplier}!]!
                @relationship(type: "MATERIAL_SUPPLIER", properties: "RelationMaterialSupplier", direction: OUT)
        }

        type ${Supplier} @mutation(operations: []) @node {
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
