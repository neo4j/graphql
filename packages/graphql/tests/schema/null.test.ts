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
import { lexicographicSortSchema } from "graphql/utilities";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../src";

describe("Null", () => {
    test("Simple", async () => {
        const typeDefs = gql`
            type Movie {
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

            type DateTimeAggregateSelectionNonNullable {
              max: DateTime!
              min: DateTime!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelectionNonNullable {
              average: Float!
              max: Float!
              min: Float!
              sum: Float!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type IntAggregateSelectionNonNullable {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
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
              actorCount: IntAggregateSelectionNonNullable!
              averageRating: FloatAggregateSelectionNonNullable!
              count: Int!
              createdAt: DateTimeAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
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
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int!]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCounts: [Int!]
              actorCounts_INCLUDES: Int
              actorCounts_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCounts_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float!]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRatings: [Float!]
              averageRatings_INCLUDES: Float
              averageRatings_NOT: [Float!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRatings_NOT_INCLUDES: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              createdAt: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime!]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              createdAt_NOT: DateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              createdAt_NOT_IN: [DateTime!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              createdAts: [DateTime!]
              createdAts_INCLUDES: DateTime
              createdAts_NOT: [DateTime!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              createdAts_NOT_INCLUDES: DateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              filmedAt: PointInput
              filmedAt_DISTANCE: PointDistance
              filmedAt_GT: PointDistance
              filmedAt_GTE: PointDistance
              filmedAt_IN: [PointInput!]
              filmedAt_LT: PointDistance
              filmedAt_LTE: PointDistance
              filmedAt_NOT: PointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              filmedAt_NOT_IN: [PointInput!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              filmedAts: [PointInput!]
              filmedAts_INCLUDES: PointInput
              filmedAts_NOT: [PointInput!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              filmedAts_NOT_INCLUDES: PointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID!]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              ids: [ID!]
              ids_INCLUDES: ID
              ids_NOT: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              ids_NOT_INCLUDES: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isActives: [Boolean!]
              isActives_NOT: [Boolean!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              names: [String!]
              names_INCLUDES: String
              names_NOT: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              names_NOT_INCLUDES: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type Point {
              crs: String!
              height: Float
              latitude: Float!
              longitude: Float!
              srid: Int!
            }

            input PointDistance {
              \\"\\"\\"The distance in metres to be used when comparing two points\\"\\"\\"
              distance: Float!
              point: PointInput!
            }

            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNonNullable {
              longest: String!
              shortest: String!
            }

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
