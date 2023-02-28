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

describe("Federation 2 quickstart (https://www.apollographql.com/docs/federation/quickstart/setup/)", () => {
    let locationsServer: Server;
    let reviewsServer: Server;
    let gatewayServer: Server;

    let neo4j: Neo4j;

    let gatewayUrl: string;

    let Location: UniqueType;
    let Review: UniqueType;

    beforeAll(async () => {
        Location = new UniqueType("Location");
        Review = new UniqueType("Review");

        const locations = `
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

            type ${Location} @key(fields: "id") {
                id: ID!
                "The name of the location"
                name: String
                "A short description about the location"
                description: String
                "The location's main photo as a URL"
                photo: String
            }
        `;

        const reviews = `
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

            type ${Location} @key(fields: "id") {
                id: ID!
                "The calculated overall rating based on all reviews"
                overallRating: Float
                "All submitted reviews about this location"
                reviewsForLocation: [${Review}!]! @relationship(type: "HAS_REVIEW", direction: OUT)
            }

            type ${Review} {
                id: ID!
                "Written text"
                comment: String
                "A number from 1 - 5 with 1 being lowest and 5 being highest"
                rating: Int
                "The location the review is about"
                location: ${Location} @relationship(type: "HAS_REVIEW", direction: IN)
            }
        `;

        neo4j = new Neo4j();
        await neo4j.init();

        const locationsSubgraph = new TestSubgraph({ typeDefs: locations, driver: neo4j.driver });
        const reviewsSubgraph = new TestSubgraph({ typeDefs: reviews, driver: neo4j.driver });

        const [locationsSchema, reviewsSchema] = await Promise.all([
            locationsSubgraph.getSchema(),
            reviewsSubgraph.getSchema(),
        ]);

        locationsServer = new SubgraphServer(locationsSchema, 4006);
        reviewsServer = new SubgraphServer(reviewsSchema, 4007);

        const [locationsUrl, reviewsUrl] = await Promise.all([locationsServer.start(), reviewsServer.start()]);

        gatewayServer = new GatewayServer(
            [
                { name: "locations", url: locationsUrl },
                { name: "reviews", url: reviewsUrl },
            ],
            4008,
        );

        gatewayUrl = await gatewayServer.start();

        await neo4j.executeWrite(
            `
                CREATE (l:${Location} { id: "1", description: "description", name: "name", overallRating: 5.5, photo: "photo" })
                CREATE (l)-[:HAS_REVIEW]->(:${Review} { id: "1", comment: "Good", rating: 10 })
                CREATE (l)-[:HAS_REVIEW]->(:${Review} { id: "2", comment: "Bad", rating: 1 })
            `,
        );
    });

    afterAll(async () => {
        await gatewayServer.stop();
        await Promise.all([locationsServer.stop(), reviewsServer.stop()]);
        await neo4j.close();
    });

    test("all Location fields and related reviews can be resolved across both subgraphs", async () => {
        const request = supertest(gatewayUrl);

        const response = await request.post("").send({
            query: `
            {
                ${Location.plural} {
                  description
                  id
                  name
                  overallRating
                  photo
                  reviewsForLocation {
                    id
                    comment
                    rating
                  }
                }
              }
        `,
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            data: {
                [Location.plural]: [
                    {
                        description: "description",
                        id: "1",
                        name: "name",
                        overallRating: 5.5,
                        photo: "photo",
                        reviewsForLocation: expect.toIncludeSameMembers([
                            { id: "1", comment: "Good", rating: 10 },
                            { id: "2", comment: "Bad", rating: 1 },
                        ]),
                    },
                ],
            },
        });
    });
});
