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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1249", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4jHelper;

    let Bulk: UniqueType;
    let Material: UniqueType;
    let Supplier: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Bulk = new UniqueType("Bulk");
        Material = new UniqueType("Material");
        Supplier = new UniqueType("Supplier");
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
        await driver.close();
    });

    test("should pass the cypherParams from the context correctly at the top level translate", async () => {
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();

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

        const res = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ cypherParams: { tenant: "BULK" } }),
        });

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            [Bulk.plural]: [],
        });
    });
});
