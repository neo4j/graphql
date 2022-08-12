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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/1249", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    const typeDefs = `
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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
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

        const query = `
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

        const res = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ cypherParams: { tenant: "BULK" } }),
        });

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            bulks: [],
        });
    });
});
