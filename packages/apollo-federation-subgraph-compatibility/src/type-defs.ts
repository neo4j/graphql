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

import { gql } from "graphql-tag";

export const typeDefs = gql`
    extend schema
        @link(
            url: "https://specs.apollo.dev/federation/v2.3"
            import: [
                "@composeDirective"
                "@extends"
                "@external"
                "@key"
                "@inaccessible"
                "@interfaceObject"
                "@override"
                "@provides"
                "@requires"
                "@shareable"
                "@tag"
            ]
        )
        @link(url: "https://myspecs.dev/myCustomDirective/v1.0", import: ["@custom"])
        @composeDirective(name: "@custom")

    directive @custom on OBJECT

    type Product @custom @key(fields: "id") @key(fields: "sku package") @key(fields: "sku variation { id }") {
        id: ID!
        sku: String
        package: String
        variation: ProductVariation @relationship(type: "HAS_VARIATION", direction: OUT)
        dimensions: ProductDimension @relationship(type: "HAS_DIMENSIONS", direction: OUT)
        createdBy: User @provides(fields: "totalProductsCreated") @relationship(type: "CREATED_BY", direction: OUT)
        notes: String @tag(name: "internal")
        research: [ProductResearch!]! @relationship(type: "HAS_RESEARCH", direction: OUT)
    }

    type DeprecatedProduct @key(fields: "sku package") {
        sku: String!
        package: String!
        reason: String
        createdBy: User @relationship(type: "CREATED_BY", direction: OUT)
    }

    type ProductVariation {
        id: ID!
    }

    type ProductResearch @key(fields: "study { caseNumber }") {
        study: CaseStudy! @relationship(type: "HAS_STUDY", direction: OUT)
        outcome: String
    }

    type CaseStudy {
        caseNumber: ID!
        description: String
    }

    type ProductDimension @shareable {
        size: String
        weight: Float
        unit: String @inaccessible
    }

    type Query {
        product(id: ID!): Product @cypher(statement: "MATCH (product:Product) WHERE product.id = $id RETURN product")
        deprecatedProduct(sku: String!, package: String!): DeprecatedProduct
            @deprecated(reason: "Use product query instead")
            @cypher(
                statement: "MATCH (product:DeprecatedProduct) WHERE product.sku = $sku AND product.package = $package = $id RETURN product"
            )
    }

    # Should be extend type as below
    # extend type User @key(fields: "email") {
    type User @key(fields: "email") @extends {
        averageProductsCreatedPerYear: Int @requires(fields: "totalProductsCreated yearsOfEmployment")
        email: ID! @external
        name: String @override(from: "users")
        totalProductsCreated: Int @external
        yearsOfEmployment: Int! @external
    }

    type Inventory @interfaceObject @key(fields: "id") {
        id: ID!
        deprecatedProducts: [DeprecatedProduct!]!
    }
`;
