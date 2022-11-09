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
import { Subgraph } from "../setup/subgraph";
import { SubgraphServer } from "../setup/subgraph-server";
import connect from "../setup/neo4j";

async function main() {
    const locations = gql`
        extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

        # type Location @key(fields: "id") {
        #     id: ID!
        #     "The name of the location"
        #     name: String!
        #     "A short description about the location"
        #     description: String!
        #     "The location's main photo as a URL"
        #     photo: String!
        # }

        type Location @key(fields: "id") {
            id: ID!
            "The name of the location"
            name: String
            "A short description about the location"
            description: String
            "The location's main photo as a URL"
            photo: String
        }
    `;

    const reviews = gql`
        extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

        type Location @key(fields: "id") {
            id: ID!
            "The calculated overall rating based on all reviews"
            overallRating: Float
            "All submitted reviews about this location"
            reviewsForLocation: [Review]!
        }

        type Review {
            id: ID!
            "Written text"
            comment: String
            "A number from 1 - 5 with 1 being lowest and 5 being highest"
            rating: Int
            "The location the review is about"
            location: Location
        }
    `;

    const driver = await connect();

    const locationsSubgraph = new Subgraph(locations, driver);
    const reviewsSubgraph = new Subgraph(reviews, driver);

    const [locationsSchema, reviewsSchema] = await Promise.all([
        locationsSubgraph.getSchema(),
        reviewsSubgraph.getSchema(),
    ]);

    const locationsServer = new SubgraphServer(locationsSchema, 4000);
    const reviewsServer = new SubgraphServer(reviewsSchema, 4001);

    const [locationsUrl, reviewsUrl] = await Promise.all([locationsServer.start(), reviewsServer.start()]);

    console.log(locationsUrl);
    console.log(reviewsUrl);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
