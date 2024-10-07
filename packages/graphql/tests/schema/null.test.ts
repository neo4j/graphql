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

import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../src";

describe("Null", () => {
    test("Simple", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID!
                ids: [ID!]!
                name: String!
                names: [String!]!
                actorCount: Int!
                actorCounts: [Int!]!
                averageRating: Float!
                averageRatings: [Float!]!
                isActives: [Boolean!]!
                filmedAt: Point!
                filmedAts: [Point!]!
                createdAt: DateTime!
                createdAts: [DateTime!]!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelection {
              max: DateTime
              min: DateTime
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              actorCount: Int!
              actorCounts: [Int!]!
              averageRating: Float!
              averageRatings: [Float!]!
              createdAt: DateTime!
              createdAts: [DateTime!]!
              filmedAt: Point!
              filmedAts: [Point!]!
              id: ID!
              ids: [ID!]!
              isActives: [Boolean!]!
              name: String!
              names: [String!]!
            }

            type MovieAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              createdAt: DateTimeAggregateSelection!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieCreateInput {
              actorCount: Int!
              actorCounts: [Int!]!
              averageRating: Float!
              averageRatings: [Float!]!
              createdAt: DateTime!
              createdAts: [DateTime!]!
              filmedAt: PointInput!
              filmedAts: [PointInput!]!
              id: ID!
              ids: [ID!]!
              isActives: [Boolean!]!
              name: String!
              names: [String!]!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              createdAt: SortDirection
              filmedAt: SortDirection
              id: SortDirection
              name: SortDirection
            }

            input MovieUpdateInput {
              actorCount: Int
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actorCounts: [Int!]
              actorCounts_POP: Int
              actorCounts_PUSH: [Int!]
              averageRating: Float
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SUBTRACT: Float
              averageRatings: [Float!]
              averageRatings_POP: Int
              averageRatings_PUSH: [Float!]
              createdAt: DateTime
              createdAts: [DateTime!]
              createdAts_POP: Int
              createdAts_PUSH: [DateTime!]
              filmedAt: PointInput
              filmedAts: [PointInput!]
              filmedAts_POP: Int
              filmedAts_PUSH: [PointInput!]
              id: ID
              ids: [ID!]
              ids_POP: Int
              ids_PUSH: [ID!]
              isActives: [Boolean!]
              isActives_POP: Int
              isActives_PUSH: [Boolean!]
              name: String
              names: [String!]
              names_POP: Int
              names_PUSH: [String!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              actorCount_EQ: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int!]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCounts: [Int!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              actorCounts_EQ: [Int!]
              actorCounts_INCLUDES: Int
              averageRating: Float @deprecated(reason: \\"Please use the explicit _EQ version\\")
              averageRating_EQ: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float!]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRatings: [Float!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              averageRatings_EQ: [Float!]
              averageRatings_INCLUDES: Float
              createdAt: DateTime @deprecated(reason: \\"Please use the explicit _EQ version\\")
              createdAt_EQ: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime!]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              createdAts: [DateTime!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              createdAts_EQ: [DateTime!]
              createdAts_INCLUDES: DateTime
              filmedAt: PointInput @deprecated(reason: \\"Please use the explicit _EQ version\\")
              filmedAt_DISTANCE: PointDistance
              filmedAt_EQ: PointInput
              filmedAt_GT: PointDistance
              filmedAt_GTE: PointDistance
              filmedAt_IN: [PointInput!]
              filmedAt_LT: PointDistance
              filmedAt_LTE: PointDistance
              filmedAts: [PointInput!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              filmedAts_EQ: [PointInput!]
              filmedAts_INCLUDES: PointInput
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              ids: [ID!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              ids_EQ: [ID!]
              ids_INCLUDES: ID
              isActives: [Boolean!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              isActives_EQ: [Boolean!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              names: [String!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              names_EQ: [String!]
              names_INCLUDES: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            \\"\\"\\"
            A point in a coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#point
            \\"\\"\\"
            type Point {
              crs: String!
              height: Float
              latitude: Float!
              longitude: Float!
              srid: Int!
            }

            \\"\\"\\"Input type for a point with a distance\\"\\"\\"
            input PointDistance {
              \\"\\"\\"The distance in metres to be used when comparing two points\\"\\"\\"
              distance: Float!
              point: PointInput!
            }

            \\"\\"\\"Input type for a point\\"\\"\\"
            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            type Query {
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }"
        `);
    });
});
