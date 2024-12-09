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

            \\"\\"\\"Boolean list filters\\"\\"\\"
            input BooleanListFilters {
              equals: [BooleanScalarFilters!]
            }

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              equals: Boolean
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
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

            \\"\\"\\"DateTime list filters\\"\\"\\"
            input DateTimeListFilters {
              equals: [DateTimeScalarFilters!]
              includes: DateTimeScalarFilters
            }

            \\"\\"\\"DateTime filters\\"\\"\\"
            input DateTimeScalarFilters {
              equals: DateTime
              greaterThan: DateTime
              greaterThanEquals: DateTime
              in: [DateTime!]
              lessThan: DateTime
              lessThanEquals: DateTime
            }

            \\"\\"\\"DateTime mutations\\"\\"\\"
            input DateTimeScalarMutations {
              set: DateTime
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            \\"\\"\\"Float list filters\\"\\"\\"
            input FloatListFilters {
              equals: [FloatScalarFilters!]
              includes: FloatScalarFilters
            }

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              equals: Float
              greaterThan: Float
              greaterThanEquals: Float
              in: [Float!]
              lessThan: Float
              lessThanEquals: Float
            }

            \\"\\"\\"Float mutations\\"\\"\\"
            input FloatScalarMutations {
              add: Float
              divide: Float
              multiply: Float
              set: Float
              subtract: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID list filters\\"\\"\\"
            input IDListFilters {
              equals: [IDScalarFilters!]
              includes: IDScalarFilters
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              equals: ID
              greaterThan: ID
              greaterThanEquals: ID
              in: [ID!]
              lessThan: ID
              lessThanEquals: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Int list filters\\"\\"\\"
            input IntListFilters {
              equals: [Int!]
              includes: Int
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              equals: Int
              greaterThan: Int
              greaterThanEquals: Int
              in: [Int!]
              lessThan: Int
              lessThanEquals: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            \\"\\"\\"Mutations for a list for Boolean\\"\\"\\"
            input ListBooleanMutations {
              pop: Int
              push: [Boolean!]
              set: [Boolean!]
            }

            \\"\\"\\"Mutations for a list for DateTime\\"\\"\\"
            input ListDateTimeMutations {
              pop: Int
              push: [DateTime!]
              set: [DateTime!]
            }

            \\"\\"\\"Mutations for a list for Float\\"\\"\\"
            input ListFloatMutations {
              pop: Int
              push: [Float!]
              set: [Float!]
            }

            \\"\\"\\"Mutations for a list for ID\\"\\"\\"
            input ListIDMutations {
              pop: Int
              push: [ID!]
              set: [ID!]
            }

            \\"\\"\\"Mutations for a list for Int\\"\\"\\"
            input ListIntMutations {
              pop: Int
              push: [Int!]
              set: [Int!]
            }

            \\"\\"\\"Mutations for a list for PointInput\\"\\"\\"
            input ListPointInputMutations {
              pop: Int
              push: [PointInput!]
              set: [PointInput!]
            }

            \\"\\"\\"Mutations for a list for String\\"\\"\\"
            input ListStringMutations {
              pop: Int
              push: [String!]
              set: [String!]
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
              actorCount: IntScalarMutations
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actorCount_SET: Int
              actorCounts: ListIntMutations
              actorCounts_POP: Int
              actorCounts_PUSH: [Int!]
              actorCounts_SET: [Int!]
              averageRating: FloatScalarMutations
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SET: Float
              averageRating_SUBTRACT: Float
              averageRatings: ListFloatMutations
              averageRatings_POP: Int
              averageRatings_PUSH: [Float!]
              averageRatings_SET: [Float!]
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime
              createdAts: ListDateTimeMutations
              createdAts_POP: Int
              createdAts_PUSH: [DateTime!]
              createdAts_SET: [DateTime!]
              filmedAt: PointMutations
              filmedAt_SET: PointInput
              filmedAts: ListPointInputMutations
              filmedAts_POP: Int
              filmedAts_PUSH: [PointInput!]
              filmedAts_SET: [PointInput!]
              id: IDScalarMutations
              id_SET: ID
              ids: ListIDMutations
              ids_POP: Int
              ids_PUSH: [ID!]
              ids_SET: [ID!]
              isActives: ListBooleanMutations
              isActives_POP: Int
              isActives_PUSH: [Boolean!]
              isActives_SET: [Boolean!]
              name: StringScalarMutations
              name_SET: String
              names: ListStringMutations
              names_POP: Int
              names_PUSH: [String!]
              names_SET: [String!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int!]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCounts: IntListFilters
              actorCounts_EQ: [Int!]
              actorCounts_INCLUDES: Int
              averageRating: FloatScalarFilters
              averageRating_EQ: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float!]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRatings: FloatListFilters
              averageRatings_EQ: [Float!]
              averageRatings_INCLUDES: Float
              createdAt: DateTimeScalarFilters
              createdAt_EQ: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime!]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              createdAts: DateTimeListFilters
              createdAts_EQ: [DateTime!]
              createdAts_INCLUDES: DateTime
              filmedAt: PointFilters
              filmedAt_DISTANCE: PointDistance
              filmedAt_EQ: PointInput
              filmedAt_GT: PointDistance
              filmedAt_GTE: PointDistance
              filmedAt_IN: [PointInput!]
              filmedAt_LT: PointDistance
              filmedAt_LTE: PointDistance
              filmedAts: PointListFilters
              filmedAts_EQ: [PointInput!]
              filmedAts_INCLUDES: PointInput
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              ids: IDListFilters
              ids_EQ: [ID!]
              ids_INCLUDES: ID
              isActives: BooleanListFilters
              isActives_EQ: [Boolean!]
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              names: StringListFilters
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

            \\"\\"\\"Distance filters\\"\\"\\"
            input PointDistanceFilters {
              eq: Float
              from: PointInput!
              gt: Float
              gte: Float
              lt: Float
              lte: Float
            }

            \\"\\"\\"Point filters\\"\\"\\"
            input PointFilters {
              distance: PointDistanceFilters
              equals: PointInput
              in: [PointInput!]
            }

            \\"\\"\\"Input type for a point\\"\\"\\"
            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            \\"\\"\\"Point list filters\\"\\"\\"
            input PointListFilters {
              equals: [PointInput!]
              includes: PointInput
            }

            \\"\\"\\"Point mutations\\"\\"\\"
            input PointMutations {
              set: PointInput
            }

            type Query {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            \\"\\"\\"String list filters\\"\\"\\"
            input StringListFilters {
              equals: [String!]
              includes: String
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              equals: String
              greaterThan: String
              greaterThanEquals: String
              in: [String!]
              lessThan: String
              lessThanEquals: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
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
