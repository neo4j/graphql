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
