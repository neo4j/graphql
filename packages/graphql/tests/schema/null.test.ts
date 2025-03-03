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
              eq: [Boolean!]
            }

            type Count {
              nodes: Int!
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
              eq: [DateTime!]
              includes: DateTime
            }

            \\"\\"\\"DateTime filters\\"\\"\\"
            input DateTimeScalarFilters {
              eq: DateTime
              gt: DateTime
              gte: DateTime
              in: [DateTime!]
              lt: DateTime
              lte: DateTime
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
              eq: [Float!]
              includes: Float
            }

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"Float mutations\\"\\"\\"
            input FloatScalarMutations {
              add: Float
              divide: Float
              multiply: Float
              set: Float
              subtract: Float
            }

            \\"\\"\\"ID list filters\\"\\"\\"
            input IDListFilters {
              eq: [ID!]
              includes: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              in: [ID!]
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
              eq: [Int!]
              includes: Int
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
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

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              createdAt: DateTimeAggregateSelection!
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
              actorCount_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { decrement: ... } }' instead.\\")
              actorCount_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'actorCount: { increment: ... } }' instead.\\")
              actorCount_SET: Int @deprecated(reason: \\"Please use the generic mutation 'actorCount: { set: ... } }' instead.\\")
              actorCounts: ListIntMutations
              actorCounts_POP: Int @deprecated(reason: \\"Please use the generic mutation 'actorCounts: { pop: ... } }' instead.\\")
              actorCounts_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'actorCounts: { push: ... } }' instead.\\")
              actorCounts_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'actorCounts: { set: ... } }' instead.\\")
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              averageRatings: ListFloatMutations
              averageRatings_POP: Int @deprecated(reason: \\"Please use the generic mutation 'averageRatings: { pop: ... } }' instead.\\")
              averageRatings_PUSH: [Float!] @deprecated(reason: \\"Please use the generic mutation 'averageRatings: { push: ... } }' instead.\\")
              averageRatings_SET: [Float!] @deprecated(reason: \\"Please use the generic mutation 'averageRatings: { set: ... } }' instead.\\")
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'createdAt: { set: ... } }' instead.\\")
              createdAts: ListDateTimeMutations
              createdAts_POP: Int @deprecated(reason: \\"Please use the generic mutation 'createdAts: { pop: ... } }' instead.\\")
              createdAts_PUSH: [DateTime!] @deprecated(reason: \\"Please use the generic mutation 'createdAts: { push: ... } }' instead.\\")
              createdAts_SET: [DateTime!] @deprecated(reason: \\"Please use the generic mutation 'createdAts: { set: ... } }' instead.\\")
              filmedAt: PointMutations
              filmedAt_SET: PointInput @deprecated(reason: \\"Please use the generic mutation 'filmedAt: { set: ... } }' instead.\\")
              filmedAts: ListPointInputMutations
              filmedAts_POP: Int @deprecated(reason: \\"Please use the generic mutation 'filmedAts: { pop: ... } }' instead.\\")
              filmedAts_PUSH: [PointInput!] @deprecated(reason: \\"Please use the generic mutation 'filmedAts: { push: ... } }' instead.\\")
              filmedAts_SET: [PointInput!] @deprecated(reason: \\"Please use the generic mutation 'filmedAts: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              ids: ListIDMutations
              ids_POP: Int @deprecated(reason: \\"Please use the generic mutation 'ids: { pop: ... } }' instead.\\")
              ids_PUSH: [ID!] @deprecated(reason: \\"Please use the generic mutation 'ids: { push: ... } }' instead.\\")
              ids_SET: [ID!] @deprecated(reason: \\"Please use the generic mutation 'ids: { set: ... } }' instead.\\")
              isActives: ListBooleanMutations
              isActives_POP: Int @deprecated(reason: \\"Please use the generic mutation 'isActives: { pop: ... } }' instead.\\")
              isActives_PUSH: [Boolean!] @deprecated(reason: \\"Please use the generic mutation 'isActives: { push: ... } }' instead.\\")
              isActives_SET: [Boolean!] @deprecated(reason: \\"Please use the generic mutation 'isActives: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              names: ListStringMutations
              names_POP: Int @deprecated(reason: \\"Please use the generic mutation 'names: { pop: ... } }' instead.\\")
              names_PUSH: [String!] @deprecated(reason: \\"Please use the generic mutation 'names: { push: ... } }' instead.\\")
              names_SET: [String!] @deprecated(reason: \\"Please use the generic mutation 'names: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: IntScalarFilters
              actorCount_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { eq: ... }\\")
              actorCount_GT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gt: ... }\\")
              actorCount_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { gte: ... }\\")
              actorCount_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter actorCount: { in: ... }\\")
              actorCount_LT: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lt: ... }\\")
              actorCount_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter actorCount: { lte: ... }\\")
              actorCounts: IntListFilters
              actorCounts_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter actorCounts: { eq: ... }\\")
              actorCounts_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter actorCounts: { includes: ... }\\")
              averageRating: FloatScalarFilters
              averageRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { eq: ... }\\")
              averageRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gt: ... }\\")
              averageRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { gte: ... }\\")
              averageRating_IN: [Float!] @deprecated(reason: \\"Please use the relevant generic filter averageRating: { in: ... }\\")
              averageRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lt: ... }\\")
              averageRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter averageRating: { lte: ... }\\")
              averageRatings: FloatListFilters
              averageRatings_EQ: [Float!] @deprecated(reason: \\"Please use the relevant generic filter averageRatings: { eq: ... }\\")
              averageRatings_INCLUDES: Float @deprecated(reason: \\"Please use the relevant generic filter averageRatings: { includes: ... }\\")
              createdAt: DateTimeScalarFilters
              createdAt_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { eq: ... }\\")
              createdAt_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gt: ... }\\")
              createdAt_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gte: ... }\\")
              createdAt_IN: [DateTime!] @deprecated(reason: \\"Please use the relevant generic filter createdAt: { in: ... }\\")
              createdAt_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lt: ... }\\")
              createdAt_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lte: ... }\\")
              createdAts: DateTimeListFilters
              createdAts_EQ: [DateTime!] @deprecated(reason: \\"Please use the relevant generic filter createdAts: { eq: ... }\\")
              createdAts_INCLUDES: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAts: { includes: ... }\\")
              filmedAt: PointFilters
              filmedAt_DISTANCE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { distance: ... }\\")
              filmedAt_EQ: PointInput @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { eq: ... }\\")
              filmedAt_GT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { gt: ... }\\")
              filmedAt_GTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { gte: ... }\\")
              filmedAt_IN: [PointInput!] @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { in: ... }\\")
              filmedAt_LT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { lt: ... }\\")
              filmedAt_LTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { lte: ... }\\")
              filmedAts: PointListFilters
              filmedAts_EQ: [PointInput!] @deprecated(reason: \\"Please use the relevant generic filter filmedAts: { eq: ... }\\")
              filmedAts_INCLUDES: PointInput @deprecated(reason: \\"Please use the relevant generic filter filmedAts: { includes: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              ids: IDListFilters
              ids_EQ: [ID!] @deprecated(reason: \\"Please use the relevant generic filter ids: { eq: ... }\\")
              ids_INCLUDES: ID @deprecated(reason: \\"Please use the relevant generic filter ids: { includes: ... }\\")
              isActives: BooleanListFilters
              isActives_EQ: [Boolean!] @deprecated(reason: \\"Please use the relevant generic filter isActives: { eq: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              names: StringListFilters
              names_EQ: [String!] @deprecated(reason: \\"Please use the relevant generic filter names: { eq: ... }\\")
              names_INCLUDES: String @deprecated(reason: \\"Please use the relevant generic filter names: { includes: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              eq: PointInput
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
              eq: [PointInput!]
              includes: PointInput
            }

            \\"\\"\\"Point mutations\\"\\"\\"
            input PointMutations {
              set: PointInput
            }

            type Query {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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
              eq: [String!]
              includes: String
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
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
