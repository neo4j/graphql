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

import gql from "graphql-tag";
import { Neo4j } from "../setup/neo4j";
import { Subgraph } from "../setup/subgraph";
import { SubgraphServer } from "../setup/subgraph-server";

async function main() {
    // const locations = gql`
    //     extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

    //     # type Location @key(fields: "id") {
    //     #     id: ID!
    //     #     "The name of the location"
    //     #     name: String!
    //     #     "A short description about the location"
    //     #     description: String!
    //     #     "The location's main photo as a URL"
    //     #     photo: String!
    //     # }

    //     type Location @key(fields: "id") {
    //         id: ID!
    //         "The name of the location"
    //         name: String
    //         "A short description about the location"
    //         description: String
    //         "The location's main photo as a URL"
    //         photo: String
    //     }
    // `;

    // const reviews = gql`
    //     extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

    //     type Location @key(fields: "id") {
    //         id: ID!
    //         "The calculated overall rating based on all reviews"
    //         overallRating: Float
    //         "All submitted reviews about this location"
    //         reviewsForLocation: [Review!]!
    //     }

    //     type Review {
    //         id: ID!
    //         "Written text"
    //         comment: String
    //         "A number from 1 - 5 with 1 being lowest and 5 being highest"
    //         rating: Int
    //         "The location the review is about"
    //         location: Location
    //     }
    // `;

    const locations = gql`
        extend schema
            @link(
                url: "https://specs.apollo.dev/federation/v2.0"
                import: [
                    "@extends"
                    "@external"
                    "@inaccessible"
                    "@key"
                    "@override"
                    "@provides"
                    "@requires"
                    "@shareable"
                    "@tag"
                ]
            )

        type Product @key(fields: "id") @key(fields: "sku package") @key(fields: "sku variation { id }") {
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
            product(id: ID!): Product
                @cypher(statement: "MATCH (product:Product) WHERE product.id = $id RETURN product")
            deprecatedProduct(sku: String!, package: String!): DeprecatedProduct
                @deprecated(reason: "Use product query instead")
                @cypher(
                    statement: "MATCH (product:DeprecatedProduct) WHERE product.sku = $sku AND product.package = $package = $id RETURN product"
                )
        }

        # should be extends
        type User @key(fields: "email") @extends {
            averageProductsCreatedPerYear: Int @requires(fields: "totalProductsCreated yearsOfEmployment")
            email: ID! @external
            name: String @override(from: "users")
            totalProductsCreated: Int @external
            yearsOfEmployment: Int! @external
        }
    `;

    const reviews = gql`
        extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

        type Product @key(fields: "id", resolvable: false) {
            id: ID!
        }

        type Review {
            score: Int!
            description: String!
            product: Product! @relationship(type: "HAS_REVIEW", direction: IN)
        }
    `;

    const neo4j = new Neo4j();
    await neo4j.init();

    const locationsSubgraph = new Subgraph({ typeDefs: locations, driver: neo4j.driver });
    const reviewsSubgraph = new Subgraph({ typeDefs: reviews, driver: neo4j.driver });

    const [locationsSchema, reviewsSchema] = await Promise.all([
        locationsSubgraph.getSchema(),
        reviewsSubgraph.getSchema(),
    ]);

    const locationsServer = new SubgraphServer(locationsSchema, 4019);
    const reviewsServer = new SubgraphServer(reviewsSchema, 4020);

    const [locationsUrl, reviewsUrl] = await Promise.all([locationsServer.start(), reviewsServer.start()]);

    console.log(locationsUrl);
    console.log(reviewsUrl);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
