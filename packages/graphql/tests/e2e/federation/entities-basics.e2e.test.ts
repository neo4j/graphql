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

import supertest from "supertest";
import { UniqueType } from "../../utils/graphql-types";
import { GatewayServer } from "./setup/gateway-server";
import type { Server } from "./setup/server";
import { TestSubgraph } from "./setup/subgraph";
import { SubgraphServer } from "./setup/subgraph-server";
import { Neo4j } from "./setup/neo4j";

describe("Federation 2 Entities Basics (https://www.apollographql.com/docs/federation/entities/)", () => {
    let productsServer: Server;
    let reviewsServer: Server;
    let gatewayServer: Server;

    let neo4j: Neo4j;

    let gatewayUrl: string;

    let Product: UniqueType;
    let Review: UniqueType;

    beforeAll(async () => {
        Product = new UniqueType("Product");
        Review = new UniqueType("Review");

        const products = `
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

            type ${Product} @key(fields: "id") {
                id: ID!
                name: String
                price: Int
            }
        `;

        const reviews = `
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

            type ${Product} @key(fields: "id", resolvable: false) {
                id: ID!
              }

            type ${Review} {
                score: Int!
                description: String!
                product: ${Product}! @relationship(type: "HAS_REVIEW", direction: IN)
            }
        `;

        neo4j = new Neo4j();
        await neo4j.init();

        const productsSubgraph = new TestSubgraph({ typeDefs: products, driver: neo4j.driver });
        const reviewsSubgraph = new TestSubgraph({ typeDefs: reviews, driver: neo4j.driver });

        const [productsSchema, reviewsSchema] = await Promise.all([
            productsSubgraph.getSchema(),
            reviewsSubgraph.getSchema(),
        ]);

        productsServer = new SubgraphServer(productsSchema, 4003);
        reviewsServer = new SubgraphServer(reviewsSchema, 4004);

        const [productsUrl, reviewsUrl] = await Promise.all([productsServer.start(), reviewsServer.start()]);

        gatewayServer = new GatewayServer(
            [
                { name: "products", url: productsUrl },
                { name: "reviews", url: reviewsUrl },
            ],
            4005
        );

        gatewayUrl = await gatewayServer.start();

        await neo4j.executeWrite(
            `CREATE (:${Product} { id: "1", name: "product", price: 5 })-[:HAS_REVIEW]->(:${Review} { score: 5, description: "review" })`
        );
    });

    afterAll(async () => {
        await gatewayServer.stop();
        await Promise.all([productsServer.stop(), reviewsServer.stop()]);
        await neo4j.close();
    });

    test("all Product fields can be resolved when queried through Review (uses __resolveReference)", async () => {
        const request = supertest(gatewayUrl);

        const response = await request.post("").send({
            query: `
            {
                ${Review.plural} {
                  description
                  score
                  product {
                    id
                    name
                    price
                  }
                }
              }
        `,
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            data: {
                [Review.plural]: [{ description: "review", score: 5, product: { id: "1", price: 5, name: "product" } }],
            },
        });
    });
});
