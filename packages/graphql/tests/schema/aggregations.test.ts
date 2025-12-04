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
import { Neo4jGraphQL } from "../../src";

describe("Aggregations", () => {
    test("Top Level Aggregations", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID
                isbn: String!
                title: String
                createdAt: DateTime
                someTime: Time
                someLocalTime: LocalTime
                someLocalDateTime: LocalDateTime
                imdbRating: Float
                someInt: Int
                someBigInt: BigInt
                screenTime: Duration
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
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelection {
              average: BigInt
              max: BigInt
              min: BigInt
              sum: BigInt
            }

            \\"\\"\\"BigInt filters\\"\\"\\"
            input BigIntScalarFilters {
              eq: BigInt
              gt: BigInt
              gte: BigInt
              in: [BigInt!]
              lt: BigInt
              lte: BigInt
            }

            \\"\\"\\"BigInt mutations\\"\\"\\"
            input BigIntScalarMutations {
              add: BigInt
              set: BigInt
              subtract: BigInt
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

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            type DurationAggregateSelection {
              max: Duration
              min: Duration
            }

            \\"\\"\\"Duration filters\\"\\"\\"
            input DurationScalarFilters {
              eq: Duration
              gt: Duration
              gte: Duration
              in: [Duration!]
              lt: Duration
              lte: Duration
            }

            \\"\\"\\"Duration mutations\\"\\"\\"
            input DurationScalarMutations {
              set: Duration
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
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

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            type LocalDateTimeAggregateSelection {
              max: LocalDateTime
              min: LocalDateTime
            }

            \\"\\"\\"LocalDateTime filters\\"\\"\\"
            input LocalDateTimeScalarFilters {
              eq: LocalDateTime
              gt: LocalDateTime
              gte: LocalDateTime
              in: [LocalDateTime!]
              lt: LocalDateTime
              lte: LocalDateTime
            }

            \\"\\"\\"LocalDateTime mutations\\"\\"\\"
            input LocalDateTimeScalarMutations {
              set: LocalDateTime
            }

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            type LocalTimeAggregateSelection {
              max: LocalTime
              min: LocalTime
            }

            \\"\\"\\"LocalTime filters\\"\\"\\"
            input LocalTimeScalarFilters {
              eq: LocalTime
              gt: LocalTime
              gte: LocalTime
              in: [LocalTime!]
              lt: LocalTime
              lte: LocalTime
            }

            \\"\\"\\"LocalTime mutations\\"\\"\\"
            input LocalTimeScalarMutations {
              set: LocalTime
            }

            type Movie {
              createdAt: DateTime
              id: ID
              imdbRating: Float
              isbn: String!
              screenTime: Duration
              someBigInt: BigInt
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someTime: Time
              title: String
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              createdAt: DateTimeAggregateSelection!
              imdbRating: FloatAggregateSelection!
              isbn: StringAggregateSelection!
              screenTime: DurationAggregateSelection!
              someBigInt: BigIntAggregateSelection!
              someInt: IntAggregateSelection!
              someLocalDateTime: LocalDateTimeAggregateSelection!
              someLocalTime: LocalTimeAggregateSelection!
              someTime: TimeAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              createdAt: DateTime
              id: ID
              imdbRating: Float
              isbn: String!
              screenTime: Duration
              someBigInt: BigInt
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someTime: Time
              title: String
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              createdAt: SortDirection
              id: SortDirection
              imdbRating: SortDirection
              isbn: SortDirection
              screenTime: SortDirection
              someBigInt: SortDirection
              someInt: SortDirection
              someLocalDateTime: SortDirection
              someLocalTime: SortDirection
              someTime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'createdAt: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              imdbRating: FloatScalarMutations
              imdbRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { add: ... } }' instead.\\")
              imdbRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { divide: ... } }' instead.\\")
              imdbRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { multiply: ... } }' instead.\\")
              imdbRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'imdbRating: { set: ... } }' instead.\\")
              imdbRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { subtract: ... } }' instead.\\")
              isbn: StringScalarMutations
              isbn_SET: String @deprecated(reason: \\"Please use the generic mutation 'isbn: { set: ... } }' instead.\\")
              screenTime: DurationScalarMutations
              screenTime_SET: Duration @deprecated(reason: \\"Please use the generic mutation 'screenTime: { set: ... } }' instead.\\")
              someBigInt: BigIntScalarMutations
              someBigInt_DECREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { decrement: ... } }' instead.\\")
              someBigInt_INCREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { increment: ... } }' instead.\\")
              someBigInt_SET: BigInt @deprecated(reason: \\"Please use the generic mutation 'someBigInt: { set: ... } }' instead.\\")
              someInt: IntScalarMutations
              someInt_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { decrement: ... } }' instead.\\")
              someInt_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { increment: ... } }' instead.\\")
              someInt_SET: Int @deprecated(reason: \\"Please use the generic mutation 'someInt: { set: ... } }' instead.\\")
              someLocalDateTime: LocalDateTimeScalarMutations
              someLocalDateTime_SET: LocalDateTime @deprecated(reason: \\"Please use the generic mutation 'someLocalDateTime: { set: ... } }' instead.\\")
              someLocalTime: LocalTimeScalarMutations
              someLocalTime_SET: LocalTime @deprecated(reason: \\"Please use the generic mutation 'someLocalTime: { set: ... } }' instead.\\")
              someTime: TimeScalarMutations
              someTime_SET: Time @deprecated(reason: \\"Please use the generic mutation 'someTime: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              createdAt: DateTimeScalarFilters
              createdAt_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { eq: ... }\\")
              createdAt_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gt: ... }\\")
              createdAt_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gte: ... }\\")
              createdAt_IN: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter createdAt: { in: ... }\\")
              createdAt_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lt: ... }\\")
              createdAt_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              imdbRating: FloatScalarFilters
              imdbRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { eq: ... }\\")
              imdbRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { gt: ... }\\")
              imdbRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { gte: ... }\\")
              imdbRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { in: ... }\\")
              imdbRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { lt: ... }\\")
              imdbRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { lte: ... }\\")
              isbn: StringScalarFilters
              isbn_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter isbn: { contains: ... }\\")
              isbn_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter isbn: { endsWith: ... }\\")
              isbn_EQ: String @deprecated(reason: \\"Please use the relevant generic filter isbn: { eq: ... }\\")
              isbn_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter isbn: { in: ... }\\")
              isbn_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter isbn: { startsWith: ... }\\")
              screenTime: DurationScalarFilters
              screenTime_EQ: Duration @deprecated(reason: \\"Please use the relevant generic filter screenTime: { eq: ... }\\")
              screenTime_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gt: ... }\\")
              screenTime_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gte: ... }\\")
              screenTime_IN: [Duration] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
              screenTime_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lt: ... }\\")
              screenTime_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lte: ... }\\")
              someBigInt: BigIntScalarFilters
              someBigInt_EQ: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { eq: ... }\\")
              someBigInt_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gt: ... }\\")
              someBigInt_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gte: ... }\\")
              someBigInt_IN: [BigInt] @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { in: ... }\\")
              someBigInt_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lt: ... }\\")
              someBigInt_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lte: ... }\\")
              someInt: IntScalarFilters
              someInt_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { eq: ... }\\")
              someInt_GT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gt: ... }\\")
              someInt_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gte: ... }\\")
              someInt_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter someInt: { in: ... }\\")
              someInt_LT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lt: ... }\\")
              someInt_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lte: ... }\\")
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { eq: ... }\\")
              someLocalDateTime_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gt: ... }\\")
              someLocalDateTime_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gte: ... }\\")
              someLocalDateTime_IN: [LocalDateTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { in: ... }\\")
              someLocalDateTime_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lt: ... }\\")
              someLocalDateTime_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lte: ... }\\")
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { eq: ... }\\")
              someLocalTime_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gt: ... }\\")
              someLocalTime_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gte: ... }\\")
              someLocalTime_IN: [LocalTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { in: ... }\\")
              someLocalTime_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lt: ... }\\")
              someLocalTime_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lte: ... }\\")
              someTime: TimeScalarFilters
              someTime_EQ: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { eq: ... }\\")
              someTime_GT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gt: ... }\\")
              someTime_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gte: ... }\\")
              someTime_IN: [Time] @deprecated(reason: \\"Please use the relevant generic filter someTime: { in: ... }\\")
              someTime_LT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lt: ... }\\")
              someTime_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            type TimeAggregateSelection {
              max: Time
              min: Time
            }

            \\"\\"\\"Time filters\\"\\"\\"
            input TimeScalarFilters {
              eq: Time
              gt: Time
              gte: Time
              in: [Time!]
              lt: Time
              lte: Time
            }

            \\"\\"\\"Time mutations\\"\\"\\"
            input TimeScalarMutations {
              set: Time
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

    test("Where Level Aggregations", async () => {
        const typeDefs = /* GraphQL */ `
            type User @node {
                someID: ID
                someString: String
                someFloat: Float
                someInt: Int
                someBigInt: BigInt
                someDateTime: DateTime
                someLocalDateTime: LocalDateTime
                someLocalTime: LocalTime
                someTime: Time
                someDuration: Duration
            }

            type Post @node {
                someID: ID
                title: String
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                someID: ID
                someString: String
                someFloat: Float
                someInt: Int
                someBigInt: BigInt
                someDateTime: DateTime
                someLocalDateTime: LocalDateTime
                someLocalTime: LocalTime
                someTime: Time
                someDuration: Duration
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
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelection {
              average: BigInt
              max: BigInt
              min: BigInt
              sum: BigInt
            }

            \\"\\"\\"Filters for an aggregation of an BigInt field\\"\\"\\"
            input BigIntScalarAggregationFilters {
              average: BigIntScalarFilters
              max: BigIntScalarFilters
              min: BigIntScalarFilters
              sum: BigIntScalarFilters
            }

            \\"\\"\\"BigInt filters\\"\\"\\"
            input BigIntScalarFilters {
              eq: BigInt
              gt: BigInt
              gte: BigInt
              in: [BigInt!]
              lt: BigInt
              lte: BigInt
            }

            \\"\\"\\"BigInt mutations\\"\\"\\"
            input BigIntScalarMutations {
              add: BigInt
              set: BigInt
              subtract: BigInt
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelection {
              max: DateTime
              min: DateTime
            }

            \\"\\"\\"Filters for an aggregation of an DateTime input field\\"\\"\\"
            input DateTimeScalarAggregationFilters {
              max: DateTimeScalarFilters
              min: DateTimeScalarFilters
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

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            type DurationAggregateSelection {
              max: Duration
              min: Duration
            }

            \\"\\"\\"Filters for an aggregation of a Dutation input field\\"\\"\\"
            input DurationScalarAggregationFilters {
              average: DurationScalarFilters
              max: DurationScalarFilters
              min: DurationScalarFilters
            }

            \\"\\"\\"Duration filters\\"\\"\\"
            input DurationScalarFilters {
              eq: Duration
              gt: Duration
              gte: Duration
              in: [Duration!]
              lt: Duration
              lte: Duration
            }

            \\"\\"\\"Duration mutations\\"\\"\\"
            input DurationScalarMutations {
              set: Duration
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            \\"\\"\\"Filters for an aggregation of a float field\\"\\"\\"
            input FloatScalarAggregationFilters {
              average: FloatScalarFilters
              max: FloatScalarFilters
              min: FloatScalarFilters
              sum: FloatScalarFilters
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

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Post.likes
            \\"\\"\\"
            type Likes {
              someBigInt: BigInt
              someDateTime: DateTime
              someDuration: Duration
              someFloat: Float
              someID: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            input LikesAggregationWhereInput {
              AND: [LikesAggregationWhereInput!]
              NOT: LikesAggregationWhereInput
              OR: [LikesAggregationWhereInput!]
              someBigInt: BigIntScalarAggregationFilters
              someBigInt_AVERAGE_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { eq: ... } } }' instead.\\")
              someBigInt_AVERAGE_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { gt: ... } } }' instead.\\")
              someBigInt_AVERAGE_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { gte: ... } } }' instead.\\")
              someBigInt_AVERAGE_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { lt: ... } } }' instead.\\")
              someBigInt_AVERAGE_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { lte: ... } } }' instead.\\")
              someBigInt_MAX_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { eq: ... } } }' instead.\\")
              someBigInt_MAX_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { gt: ... } } }' instead.\\")
              someBigInt_MAX_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { gte: ... } } }' instead.\\")
              someBigInt_MAX_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { lt: ... } } }' instead.\\")
              someBigInt_MAX_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { lte: ... } } }' instead.\\")
              someBigInt_MIN_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { eq: ... } } }' instead.\\")
              someBigInt_MIN_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { gt: ... } } }' instead.\\")
              someBigInt_MIN_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { gte: ... } } }' instead.\\")
              someBigInt_MIN_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { lt: ... } } }' instead.\\")
              someBigInt_MIN_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { lte: ... } } }' instead.\\")
              someBigInt_SUM_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { eq: ... } } }' instead.\\")
              someBigInt_SUM_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { gt: ... } } }' instead.\\")
              someBigInt_SUM_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { gte: ... } } }' instead.\\")
              someBigInt_SUM_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { lt: ... } } }' instead.\\")
              someBigInt_SUM_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { lte: ... } } }' instead.\\")
              someDateTime: DateTimeScalarAggregationFilters
              someDateTime_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { eq: ... } } }' instead.\\")
              someDateTime_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { gt: ... } } }' instead.\\")
              someDateTime_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { gte: ... } } }' instead.\\")
              someDateTime_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { lt: ... } } }' instead.\\")
              someDateTime_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { lte: ... } } }' instead.\\")
              someDateTime_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { eq: ... } } }' instead.\\")
              someDateTime_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { gt: ... } } }' instead.\\")
              someDateTime_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { gte: ... } } }' instead.\\")
              someDateTime_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { lt: ... } } }' instead.\\")
              someDateTime_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { lte: ... } } }' instead.\\")
              someDuration: DurationScalarAggregationFilters
              someDuration_AVERAGE_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { eq: ... } } }' instead.\\")
              someDuration_AVERAGE_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { gt: ... } } }' instead.\\")
              someDuration_AVERAGE_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { gte: ... } } }' instead.\\")
              someDuration_AVERAGE_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { lt: ... } } }' instead.\\")
              someDuration_AVERAGE_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { lte: ... } } }' instead.\\")
              someDuration_MAX_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { eq: ... } } }' instead.\\")
              someDuration_MAX_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { gt: ... } } }' instead.\\")
              someDuration_MAX_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { gte: ... } } }' instead.\\")
              someDuration_MAX_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { lt: ... } } }' instead.\\")
              someDuration_MAX_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { lte: ... } } }' instead.\\")
              someDuration_MIN_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { eq: ... } } }' instead.\\")
              someDuration_MIN_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { gt: ... } } }' instead.\\")
              someDuration_MIN_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { gte: ... } } }' instead.\\")
              someDuration_MIN_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { lt: ... } } }' instead.\\")
              someDuration_MIN_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { lte: ... } } }' instead.\\")
              someFloat: FloatScalarAggregationFilters
              someFloat_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { eq: ... } } }' instead.\\")
              someFloat_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { gt: ... } } }' instead.\\")
              someFloat_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { gte: ... } } }' instead.\\")
              someFloat_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { lt: ... } } }' instead.\\")
              someFloat_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { lte: ... } } }' instead.\\")
              someFloat_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { eq: ... } } }' instead.\\")
              someFloat_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { gt: ... } } }' instead.\\")
              someFloat_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { gte: ... } } }' instead.\\")
              someFloat_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { lt: ... } } }' instead.\\")
              someFloat_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { lte: ... } } }' instead.\\")
              someFloat_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { eq: ... } } }' instead.\\")
              someFloat_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { gt: ... } } }' instead.\\")
              someFloat_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { gte: ... } } }' instead.\\")
              someFloat_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { lt: ... } } }' instead.\\")
              someFloat_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { lte: ... } } }' instead.\\")
              someFloat_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { eq: ... } } }' instead.\\")
              someFloat_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { gt: ... } } }' instead.\\")
              someFloat_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { gte: ... } } }' instead.\\")
              someFloat_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { lt: ... } } }' instead.\\")
              someFloat_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { lte: ... } } }' instead.\\")
              someInt: IntScalarAggregationFilters
              someInt_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { eq: ... } } }' instead.\\")
              someInt_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { gt: ... } } }' instead.\\")
              someInt_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { gte: ... } } }' instead.\\")
              someInt_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { lt: ... } } }' instead.\\")
              someInt_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { lte: ... } } }' instead.\\")
              someInt_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { eq: ... } } }' instead.\\")
              someInt_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { gt: ... } } }' instead.\\")
              someInt_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { gte: ... } } }' instead.\\")
              someInt_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { lt: ... } } }' instead.\\")
              someInt_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { lte: ... } } }' instead.\\")
              someInt_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { eq: ... } } }' instead.\\")
              someInt_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { gt: ... } } }' instead.\\")
              someInt_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { gte: ... } } }' instead.\\")
              someInt_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { lt: ... } } }' instead.\\")
              someInt_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { lte: ... } } }' instead.\\")
              someInt_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { eq: ... } } }' instead.\\")
              someInt_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { gt: ... } } }' instead.\\")
              someInt_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { gte: ... } } }' instead.\\")
              someInt_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { lt: ... } } }' instead.\\")
              someInt_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { lte: ... } } }' instead.\\")
              someLocalDateTime: LocalDateTimeScalarAggregationFilters
              someLocalDateTime_MAX_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { eq: ... } } }' instead.\\")
              someLocalDateTime_MAX_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { gt: ... } } }' instead.\\")
              someLocalDateTime_MAX_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { gte: ... } } }' instead.\\")
              someLocalDateTime_MAX_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { lt: ... } } }' instead.\\")
              someLocalDateTime_MAX_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { lte: ... } } }' instead.\\")
              someLocalDateTime_MIN_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { eq: ... } } }' instead.\\")
              someLocalDateTime_MIN_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { gt: ... } } }' instead.\\")
              someLocalDateTime_MIN_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { gte: ... } } }' instead.\\")
              someLocalDateTime_MIN_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { lt: ... } } }' instead.\\")
              someLocalDateTime_MIN_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { lte: ... } } }' instead.\\")
              someLocalTime: LocalTimeScalarAggregationFilters
              someLocalTime_MAX_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { eq: ... } } }' instead.\\")
              someLocalTime_MAX_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { gt: ... } } }' instead.\\")
              someLocalTime_MAX_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { gte: ... } } }' instead.\\")
              someLocalTime_MAX_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { lt: ... } } }' instead.\\")
              someLocalTime_MAX_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { lte: ... } } }' instead.\\")
              someLocalTime_MIN_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { eq: ... } } }' instead.\\")
              someLocalTime_MIN_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { gt: ... } } }' instead.\\")
              someLocalTime_MIN_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { gte: ... } } }' instead.\\")
              someLocalTime_MIN_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { lt: ... } } }' instead.\\")
              someLocalTime_MIN_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { lte: ... } } }' instead.\\")
              someString: StringScalarAggregationFilters
              someString_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { eq: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gte: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { eq: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { eq: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lte: ... } } }' instead.\\")
              someTime: TimeScalarAggregationFilters
              someTime_MAX_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { eq: ... } } }' instead.\\")
              someTime_MAX_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { gt: ... } } }' instead.\\")
              someTime_MAX_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { gte: ... } } }' instead.\\")
              someTime_MAX_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { lt: ... } } }' instead.\\")
              someTime_MAX_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { lte: ... } } }' instead.\\")
              someTime_MIN_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { eq: ... } } }' instead.\\")
              someTime_MIN_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { gt: ... } } }' instead.\\")
              someTime_MIN_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { gte: ... } } }' instead.\\")
              someTime_MIN_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { lt: ... } } }' instead.\\")
              someTime_MIN_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { lte: ... } } }' instead.\\")
            }

            input LikesCreateInput {
              someBigInt: BigInt
              someDateTime: DateTime
              someDuration: Duration
              someFloat: Float
              someID: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            input LikesSort {
              someBigInt: SortDirection
              someDateTime: SortDirection
              someDuration: SortDirection
              someFloat: SortDirection
              someID: SortDirection
              someInt: SortDirection
              someLocalDateTime: SortDirection
              someLocalTime: SortDirection
              someString: SortDirection
              someTime: SortDirection
            }

            input LikesUpdateInput {
              someBigInt: BigIntScalarMutations
              someBigInt_DECREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { decrement: ... } }' instead.\\")
              someBigInt_INCREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { increment: ... } }' instead.\\")
              someBigInt_SET: BigInt @deprecated(reason: \\"Please use the generic mutation 'someBigInt: { set: ... } }' instead.\\")
              someDateTime: DateTimeScalarMutations
              someDateTime_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'someDateTime: { set: ... } }' instead.\\")
              someDuration: DurationScalarMutations
              someDuration_SET: Duration @deprecated(reason: \\"Please use the generic mutation 'someDuration: { set: ... } }' instead.\\")
              someFloat: FloatScalarMutations
              someFloat_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { add: ... } }' instead.\\")
              someFloat_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { divide: ... } }' instead.\\")
              someFloat_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { multiply: ... } }' instead.\\")
              someFloat_SET: Float @deprecated(reason: \\"Please use the generic mutation 'someFloat: { set: ... } }' instead.\\")
              someFloat_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { subtract: ... } }' instead.\\")
              someID: IDScalarMutations
              someID_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someID: { set: ... } }' instead.\\")
              someInt: IntScalarMutations
              someInt_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { decrement: ... } }' instead.\\")
              someInt_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { increment: ... } }' instead.\\")
              someInt_SET: Int @deprecated(reason: \\"Please use the generic mutation 'someInt: { set: ... } }' instead.\\")
              someLocalDateTime: LocalDateTimeScalarMutations
              someLocalDateTime_SET: LocalDateTime @deprecated(reason: \\"Please use the generic mutation 'someLocalDateTime: { set: ... } }' instead.\\")
              someLocalTime: LocalTimeScalarMutations
              someLocalTime_SET: LocalTime @deprecated(reason: \\"Please use the generic mutation 'someLocalTime: { set: ... } }' instead.\\")
              someString: StringScalarMutations
              someString_SET: String @deprecated(reason: \\"Please use the generic mutation 'someString: { set: ... } }' instead.\\")
              someTime: TimeScalarMutations
              someTime_SET: Time @deprecated(reason: \\"Please use the generic mutation 'someTime: { set: ... } }' instead.\\")
            }

            input LikesWhere {
              AND: [LikesWhere!]
              NOT: LikesWhere
              OR: [LikesWhere!]
              someBigInt: BigIntScalarFilters
              someBigInt_EQ: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { eq: ... }\\")
              someBigInt_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gt: ... }\\")
              someBigInt_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gte: ... }\\")
              someBigInt_IN: [BigInt] @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { in: ... }\\")
              someBigInt_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lt: ... }\\")
              someBigInt_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lte: ... }\\")
              someDateTime: DateTimeScalarFilters
              someDateTime_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { eq: ... }\\")
              someDateTime_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { gt: ... }\\")
              someDateTime_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { gte: ... }\\")
              someDateTime_IN: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { in: ... }\\")
              someDateTime_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { lt: ... }\\")
              someDateTime_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { lte: ... }\\")
              someDuration: DurationScalarFilters
              someDuration_EQ: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { eq: ... }\\")
              someDuration_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { gt: ... }\\")
              someDuration_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { gte: ... }\\")
              someDuration_IN: [Duration] @deprecated(reason: \\"Please use the relevant generic filter someDuration: { in: ... }\\")
              someDuration_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { lt: ... }\\")
              someDuration_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { lte: ... }\\")
              someFloat: FloatScalarFilters
              someFloat_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { eq: ... }\\")
              someFloat_GT: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { gt: ... }\\")
              someFloat_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { gte: ... }\\")
              someFloat_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter someFloat: { in: ... }\\")
              someFloat_LT: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { lt: ... }\\")
              someFloat_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { lte: ... }\\")
              someID: IDScalarFilters
              someID_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { contains: ... }\\")
              someID_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { endsWith: ... }\\")
              someID_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { eq: ... }\\")
              someID_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter someID: { in: ... }\\")
              someID_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { startsWith: ... }\\")
              someInt: IntScalarFilters
              someInt_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { eq: ... }\\")
              someInt_GT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gt: ... }\\")
              someInt_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gte: ... }\\")
              someInt_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter someInt: { in: ... }\\")
              someInt_LT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lt: ... }\\")
              someInt_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lte: ... }\\")
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { eq: ... }\\")
              someLocalDateTime_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gt: ... }\\")
              someLocalDateTime_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gte: ... }\\")
              someLocalDateTime_IN: [LocalDateTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { in: ... }\\")
              someLocalDateTime_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lt: ... }\\")
              someLocalDateTime_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lte: ... }\\")
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { eq: ... }\\")
              someLocalTime_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gt: ... }\\")
              someLocalTime_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gte: ... }\\")
              someLocalTime_IN: [LocalTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { in: ... }\\")
              someLocalTime_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lt: ... }\\")
              someLocalTime_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lte: ... }\\")
              someString: StringScalarFilters
              someString_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter someString: { contains: ... }\\")
              someString_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { endsWith: ... }\\")
              someString_EQ: String @deprecated(reason: \\"Please use the relevant generic filter someString: { eq: ... }\\")
              someString_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter someString: { in: ... }\\")
              someString_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { startsWith: ... }\\")
              someTime: TimeScalarFilters
              someTime_EQ: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { eq: ... }\\")
              someTime_GT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gt: ... }\\")
              someTime_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gte: ... }\\")
              someTime_IN: [Time] @deprecated(reason: \\"Please use the relevant generic filter someTime: { in: ... }\\")
              someTime_LT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lt: ... }\\")
              someTime_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lte: ... }\\")
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            type LocalDateTimeAggregateSelection {
              max: LocalDateTime
              min: LocalDateTime
            }

            \\"\\"\\"Filters for an aggregation of an LocalDateTime input field\\"\\"\\"
            input LocalDateTimeScalarAggregationFilters {
              max: LocalDateTimeScalarFilters
              min: LocalDateTimeScalarFilters
            }

            \\"\\"\\"LocalDateTime filters\\"\\"\\"
            input LocalDateTimeScalarFilters {
              eq: LocalDateTime
              gt: LocalDateTime
              gte: LocalDateTime
              in: [LocalDateTime!]
              lt: LocalDateTime
              lte: LocalDateTime
            }

            \\"\\"\\"LocalDateTime mutations\\"\\"\\"
            input LocalDateTimeScalarMutations {
              set: LocalDateTime
            }

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            type LocalTimeAggregateSelection {
              max: LocalTime
              min: LocalTime
            }

            \\"\\"\\"Filters for an aggregation of an LocalTime input field\\"\\"\\"
            input LocalTimeScalarAggregationFilters {
              max: LocalTimeScalarFilters
              min: LocalTimeScalarFilters
            }

            \\"\\"\\"LocalTime filters\\"\\"\\"
            input LocalTimeScalarFilters {
              eq: LocalTime
              gt: LocalTime
              gte: LocalTime
              in: [LocalTime!]
              lt: LocalTime
              lte: LocalTime
            }

            \\"\\"\\"LocalTime mutations\\"\\"\\"
            input LocalTimeScalarMutations {
              set: LocalTime
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(where: UserWhere): DeleteInfo!
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              likes(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              likesConnection(after: String, first: Int, sort: [PostLikesConnectionSort!], where: PostLikesConnectionWhere): PostLikesConnection!
              someID: ID
              title: String
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              title: StringAggregateSelection!
            }

            input PostCreateInput {
              likes: PostLikesFieldInput
              someID: ID
              title: String
            }

            input PostDeleteInput {
              likes: [PostLikesDeleteFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostLikesAggregateInput {
              AND: [PostLikesAggregateInput!]
              NOT: PostLikesAggregateInput
              OR: [PostLikesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: LikesAggregationWhereInput
              node: PostLikesNodeAggregationWhereInput
            }

            input PostLikesConnectFieldInput {
              edge: LikesCreateInput
              where: UserConnectWhere
            }

            type PostLikesConnection {
              aggregate: PostUserLikesAggregateSelection!
              edges: [PostLikesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostLikesConnectionAggregateInput {
              AND: [PostLikesConnectionAggregateInput!]
              NOT: PostLikesConnectionAggregateInput
              OR: [PostLikesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: LikesAggregationWhereInput
              node: PostLikesNodeAggregationWhereInput
            }

            input PostLikesConnectionFilters {
              \\"\\"\\"Filter Posts by aggregating results on related PostLikesConnections\\"\\"\\"
              aggregate: PostLikesConnectionAggregateInput
              \\"\\"\\"
              Return Posts where all of the related PostLikesConnections match this filter
              \\"\\"\\"
              all: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostLikesConnections match this filter
              \\"\\"\\"
              none: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related PostLikesConnections match this filter
              \\"\\"\\"
              single: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostLikesConnections match this filter
              \\"\\"\\"
              some: PostLikesConnectionWhere
            }

            input PostLikesConnectionSort {
              edge: LikesSort
              node: UserSort
            }

            input PostLikesConnectionWhere {
              AND: [PostLikesConnectionWhere!]
              NOT: PostLikesConnectionWhere
              OR: [PostLikesConnectionWhere!]
              edge: LikesWhere
              node: UserWhere
            }

            input PostLikesCreateFieldInput {
              edge: LikesCreateInput
              node: UserCreateInput!
            }

            input PostLikesDeleteFieldInput {
              where: PostLikesConnectionWhere
            }

            input PostLikesDisconnectFieldInput {
              where: PostLikesConnectionWhere
            }

            input PostLikesFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
            }

            input PostLikesNodeAggregationWhereInput {
              AND: [PostLikesNodeAggregationWhereInput!]
              NOT: PostLikesNodeAggregationWhereInput
              OR: [PostLikesNodeAggregationWhereInput!]
              someBigInt: BigIntScalarAggregationFilters
              someBigInt_AVERAGE_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { eq: ... } } }' instead.\\")
              someBigInt_AVERAGE_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { gt: ... } } }' instead.\\")
              someBigInt_AVERAGE_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { gte: ... } } }' instead.\\")
              someBigInt_AVERAGE_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { lt: ... } } }' instead.\\")
              someBigInt_AVERAGE_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { lte: ... } } }' instead.\\")
              someBigInt_MAX_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { eq: ... } } }' instead.\\")
              someBigInt_MAX_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { gt: ... } } }' instead.\\")
              someBigInt_MAX_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { gte: ... } } }' instead.\\")
              someBigInt_MAX_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { lt: ... } } }' instead.\\")
              someBigInt_MAX_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { lte: ... } } }' instead.\\")
              someBigInt_MIN_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { eq: ... } } }' instead.\\")
              someBigInt_MIN_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { gt: ... } } }' instead.\\")
              someBigInt_MIN_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { gte: ... } } }' instead.\\")
              someBigInt_MIN_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { lt: ... } } }' instead.\\")
              someBigInt_MIN_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { lte: ... } } }' instead.\\")
              someBigInt_SUM_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { eq: ... } } }' instead.\\")
              someBigInt_SUM_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { gt: ... } } }' instead.\\")
              someBigInt_SUM_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { gte: ... } } }' instead.\\")
              someBigInt_SUM_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { lt: ... } } }' instead.\\")
              someBigInt_SUM_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { lte: ... } } }' instead.\\")
              someDateTime: DateTimeScalarAggregationFilters
              someDateTime_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { eq: ... } } }' instead.\\")
              someDateTime_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { gt: ... } } }' instead.\\")
              someDateTime_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { gte: ... } } }' instead.\\")
              someDateTime_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { lt: ... } } }' instead.\\")
              someDateTime_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { lte: ... } } }' instead.\\")
              someDateTime_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { eq: ... } } }' instead.\\")
              someDateTime_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { gt: ... } } }' instead.\\")
              someDateTime_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { gte: ... } } }' instead.\\")
              someDateTime_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { lt: ... } } }' instead.\\")
              someDateTime_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { lte: ... } } }' instead.\\")
              someDuration: DurationScalarAggregationFilters
              someDuration_AVERAGE_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { eq: ... } } }' instead.\\")
              someDuration_AVERAGE_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { gt: ... } } }' instead.\\")
              someDuration_AVERAGE_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { gte: ... } } }' instead.\\")
              someDuration_AVERAGE_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { lt: ... } } }' instead.\\")
              someDuration_AVERAGE_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { lte: ... } } }' instead.\\")
              someDuration_MAX_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { eq: ... } } }' instead.\\")
              someDuration_MAX_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { gt: ... } } }' instead.\\")
              someDuration_MAX_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { gte: ... } } }' instead.\\")
              someDuration_MAX_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { lt: ... } } }' instead.\\")
              someDuration_MAX_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { lte: ... } } }' instead.\\")
              someDuration_MIN_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { eq: ... } } }' instead.\\")
              someDuration_MIN_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { gt: ... } } }' instead.\\")
              someDuration_MIN_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { gte: ... } } }' instead.\\")
              someDuration_MIN_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { lt: ... } } }' instead.\\")
              someDuration_MIN_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { lte: ... } } }' instead.\\")
              someFloat: FloatScalarAggregationFilters
              someFloat_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { eq: ... } } }' instead.\\")
              someFloat_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { gt: ... } } }' instead.\\")
              someFloat_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { gte: ... } } }' instead.\\")
              someFloat_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { lt: ... } } }' instead.\\")
              someFloat_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { lte: ... } } }' instead.\\")
              someFloat_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { eq: ... } } }' instead.\\")
              someFloat_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { gt: ... } } }' instead.\\")
              someFloat_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { gte: ... } } }' instead.\\")
              someFloat_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { lt: ... } } }' instead.\\")
              someFloat_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { lte: ... } } }' instead.\\")
              someFloat_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { eq: ... } } }' instead.\\")
              someFloat_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { gt: ... } } }' instead.\\")
              someFloat_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { gte: ... } } }' instead.\\")
              someFloat_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { lt: ... } } }' instead.\\")
              someFloat_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { lte: ... } } }' instead.\\")
              someFloat_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { eq: ... } } }' instead.\\")
              someFloat_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { gt: ... } } }' instead.\\")
              someFloat_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { gte: ... } } }' instead.\\")
              someFloat_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { lt: ... } } }' instead.\\")
              someFloat_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { lte: ... } } }' instead.\\")
              someInt: IntScalarAggregationFilters
              someInt_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { eq: ... } } }' instead.\\")
              someInt_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { gt: ... } } }' instead.\\")
              someInt_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { gte: ... } } }' instead.\\")
              someInt_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { lt: ... } } }' instead.\\")
              someInt_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { lte: ... } } }' instead.\\")
              someInt_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { eq: ... } } }' instead.\\")
              someInt_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { gt: ... } } }' instead.\\")
              someInt_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { gte: ... } } }' instead.\\")
              someInt_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { lt: ... } } }' instead.\\")
              someInt_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { lte: ... } } }' instead.\\")
              someInt_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { eq: ... } } }' instead.\\")
              someInt_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { gt: ... } } }' instead.\\")
              someInt_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { gte: ... } } }' instead.\\")
              someInt_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { lt: ... } } }' instead.\\")
              someInt_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { lte: ... } } }' instead.\\")
              someInt_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { eq: ... } } }' instead.\\")
              someInt_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { gt: ... } } }' instead.\\")
              someInt_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { gte: ... } } }' instead.\\")
              someInt_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { lt: ... } } }' instead.\\")
              someInt_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { lte: ... } } }' instead.\\")
              someLocalDateTime: LocalDateTimeScalarAggregationFilters
              someLocalDateTime_MAX_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { eq: ... } } }' instead.\\")
              someLocalDateTime_MAX_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { gt: ... } } }' instead.\\")
              someLocalDateTime_MAX_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { gte: ... } } }' instead.\\")
              someLocalDateTime_MAX_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { lt: ... } } }' instead.\\")
              someLocalDateTime_MAX_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { lte: ... } } }' instead.\\")
              someLocalDateTime_MIN_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { eq: ... } } }' instead.\\")
              someLocalDateTime_MIN_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { gt: ... } } }' instead.\\")
              someLocalDateTime_MIN_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { gte: ... } } }' instead.\\")
              someLocalDateTime_MIN_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { lt: ... } } }' instead.\\")
              someLocalDateTime_MIN_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { lte: ... } } }' instead.\\")
              someLocalTime: LocalTimeScalarAggregationFilters
              someLocalTime_MAX_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { eq: ... } } }' instead.\\")
              someLocalTime_MAX_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { gt: ... } } }' instead.\\")
              someLocalTime_MAX_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { gte: ... } } }' instead.\\")
              someLocalTime_MAX_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { lt: ... } } }' instead.\\")
              someLocalTime_MAX_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { lte: ... } } }' instead.\\")
              someLocalTime_MIN_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { eq: ... } } }' instead.\\")
              someLocalTime_MIN_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { gt: ... } } }' instead.\\")
              someLocalTime_MIN_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { gte: ... } } }' instead.\\")
              someLocalTime_MIN_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { lt: ... } } }' instead.\\")
              someLocalTime_MIN_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { lte: ... } } }' instead.\\")
              someString: StringScalarAggregationFilters
              someString_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { eq: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gte: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { eq: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { eq: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lte: ... } } }' instead.\\")
              someTime: TimeScalarAggregationFilters
              someTime_MAX_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { eq: ... } } }' instead.\\")
              someTime_MAX_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { gt: ... } } }' instead.\\")
              someTime_MAX_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { gte: ... } } }' instead.\\")
              someTime_MAX_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { lt: ... } } }' instead.\\")
              someTime_MAX_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { lte: ... } } }' instead.\\")
              someTime_MIN_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { eq: ... } } }' instead.\\")
              someTime_MIN_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { gt: ... } } }' instead.\\")
              someTime_MIN_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { gte: ... } } }' instead.\\")
              someTime_MIN_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { lt: ... } } }' instead.\\")
              someTime_MIN_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { lte: ... } } }' instead.\\")
            }

            type PostLikesRelationship {
              cursor: String!
              node: User!
              properties: Likes!
            }

            input PostLikesUpdateConnectionInput {
              edge: LikesUpdateInput
              node: UserUpdateInput
              where: PostLikesConnectionWhere
            }

            input PostLikesUpdateFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
              delete: [PostLikesDeleteFieldInput!]
              disconnect: [PostLikesDisconnectFieldInput!]
              update: PostLikesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              someID: SortDirection
              title: SortDirection
            }

            input PostUpdateInput {
              likes: [PostLikesUpdateFieldInput!]
              someID: IDScalarMutations
              someID_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someID: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            type PostUserLikesAggregateSelection {
              count: CountConnection!
              edge: PostUserLikesEdgeAggregateSelection
              node: PostUserLikesNodeAggregateSelection
            }

            type PostUserLikesEdgeAggregateSelection {
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someInt: IntAggregateSelection!
              someLocalDateTime: LocalDateTimeAggregateSelection!
              someLocalTime: LocalTimeAggregateSelection!
              someString: StringAggregateSelection!
              someTime: TimeAggregateSelection!
            }

            type PostUserLikesNodeAggregateSelection {
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someInt: IntAggregateSelection!
              someLocalDateTime: LocalDateTimeAggregateSelection!
              someLocalTime: LocalTimeAggregateSelection!
              someString: StringAggregateSelection!
              someTime: TimeAggregateSelection!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              likes: UserRelationshipFilters
              likesAggregate: PostLikesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the likesConnection filter, please use { likesConnection: { aggregate: {...} } } instead\\")
              likesConnection: PostLikesConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_ALL: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where none of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_NONE: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where one of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_SINGLE: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where some of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_SOME: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              likes_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: { all: ... }' instead.\\")
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              likes_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: { none: ... }' instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              likes_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: {  single: ... }' instead.\\")
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              likes_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: {  some: ... }' instead.\\")
              someID: IDScalarFilters
              someID_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { contains: ... }\\")
              someID_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { endsWith: ... }\\")
              someID_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { eq: ... }\\")
              someID_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter someID: { in: ... }\\")
              someID_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { startsWith: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type PostsConnection {
              aggregate: PostAggregate!
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              usersConnection(after: String, first: Int, sort: [UserSort!], where: UserWhere): UsersConnection!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
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

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            type TimeAggregateSelection {
              max: Time
              min: Time
            }

            \\"\\"\\"Filters for an aggregation of an Time input field\\"\\"\\"
            input TimeScalarAggregationFilters {
              max: TimeScalarFilters
              min: TimeScalarFilters
            }

            \\"\\"\\"Time filters\\"\\"\\"
            input TimeScalarFilters {
              eq: Time
              gt: Time
              gte: Time
              in: [Time!]
              lt: Time
              lte: Time
            }

            \\"\\"\\"Time mutations\\"\\"\\"
            input TimeScalarMutations {
              set: Time
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

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              someBigInt: BigInt
              someDateTime: DateTime
              someDuration: Duration
              someFloat: Float
              someID: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someInt: IntAggregateSelection!
              someLocalDateTime: LocalDateTimeAggregateSelection!
              someLocalTime: LocalTimeAggregateSelection!
              someString: StringAggregateSelection!
              someTime: TimeAggregateSelection!
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              someBigInt: BigInt
              someDateTime: DateTime
              someDuration: Duration
              someFloat: Float
              someID: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Filter type where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Filter type where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Filter type where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              someBigInt: SortDirection
              someDateTime: SortDirection
              someDuration: SortDirection
              someFloat: SortDirection
              someID: SortDirection
              someInt: SortDirection
              someLocalDateTime: SortDirection
              someLocalTime: SortDirection
              someString: SortDirection
              someTime: SortDirection
            }

            input UserUpdateInput {
              someBigInt: BigIntScalarMutations
              someBigInt_DECREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { decrement: ... } }' instead.\\")
              someBigInt_INCREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { increment: ... } }' instead.\\")
              someBigInt_SET: BigInt @deprecated(reason: \\"Please use the generic mutation 'someBigInt: { set: ... } }' instead.\\")
              someDateTime: DateTimeScalarMutations
              someDateTime_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'someDateTime: { set: ... } }' instead.\\")
              someDuration: DurationScalarMutations
              someDuration_SET: Duration @deprecated(reason: \\"Please use the generic mutation 'someDuration: { set: ... } }' instead.\\")
              someFloat: FloatScalarMutations
              someFloat_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { add: ... } }' instead.\\")
              someFloat_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { divide: ... } }' instead.\\")
              someFloat_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { multiply: ... } }' instead.\\")
              someFloat_SET: Float @deprecated(reason: \\"Please use the generic mutation 'someFloat: { set: ... } }' instead.\\")
              someFloat_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { subtract: ... } }' instead.\\")
              someID: IDScalarMutations
              someID_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someID: { set: ... } }' instead.\\")
              someInt: IntScalarMutations
              someInt_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { decrement: ... } }' instead.\\")
              someInt_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { increment: ... } }' instead.\\")
              someInt_SET: Int @deprecated(reason: \\"Please use the generic mutation 'someInt: { set: ... } }' instead.\\")
              someLocalDateTime: LocalDateTimeScalarMutations
              someLocalDateTime_SET: LocalDateTime @deprecated(reason: \\"Please use the generic mutation 'someLocalDateTime: { set: ... } }' instead.\\")
              someLocalTime: LocalTimeScalarMutations
              someLocalTime_SET: LocalTime @deprecated(reason: \\"Please use the generic mutation 'someLocalTime: { set: ... } }' instead.\\")
              someString: StringScalarMutations
              someString_SET: String @deprecated(reason: \\"Please use the generic mutation 'someString: { set: ... } }' instead.\\")
              someTime: TimeScalarMutations
              someTime_SET: Time @deprecated(reason: \\"Please use the generic mutation 'someTime: { set: ... } }' instead.\\")
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              someBigInt: BigIntScalarFilters
              someBigInt_EQ: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { eq: ... }\\")
              someBigInt_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gt: ... }\\")
              someBigInt_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gte: ... }\\")
              someBigInt_IN: [BigInt] @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { in: ... }\\")
              someBigInt_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lt: ... }\\")
              someBigInt_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lte: ... }\\")
              someDateTime: DateTimeScalarFilters
              someDateTime_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { eq: ... }\\")
              someDateTime_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { gt: ... }\\")
              someDateTime_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { gte: ... }\\")
              someDateTime_IN: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { in: ... }\\")
              someDateTime_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { lt: ... }\\")
              someDateTime_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { lte: ... }\\")
              someDuration: DurationScalarFilters
              someDuration_EQ: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { eq: ... }\\")
              someDuration_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { gt: ... }\\")
              someDuration_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { gte: ... }\\")
              someDuration_IN: [Duration] @deprecated(reason: \\"Please use the relevant generic filter someDuration: { in: ... }\\")
              someDuration_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { lt: ... }\\")
              someDuration_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { lte: ... }\\")
              someFloat: FloatScalarFilters
              someFloat_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { eq: ... }\\")
              someFloat_GT: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { gt: ... }\\")
              someFloat_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { gte: ... }\\")
              someFloat_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter someFloat: { in: ... }\\")
              someFloat_LT: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { lt: ... }\\")
              someFloat_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { lte: ... }\\")
              someID: IDScalarFilters
              someID_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { contains: ... }\\")
              someID_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { endsWith: ... }\\")
              someID_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { eq: ... }\\")
              someID_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter someID: { in: ... }\\")
              someID_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { startsWith: ... }\\")
              someInt: IntScalarFilters
              someInt_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { eq: ... }\\")
              someInt_GT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gt: ... }\\")
              someInt_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gte: ... }\\")
              someInt_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter someInt: { in: ... }\\")
              someInt_LT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lt: ... }\\")
              someInt_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lte: ... }\\")
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { eq: ... }\\")
              someLocalDateTime_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gt: ... }\\")
              someLocalDateTime_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gte: ... }\\")
              someLocalDateTime_IN: [LocalDateTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { in: ... }\\")
              someLocalDateTime_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lt: ... }\\")
              someLocalDateTime_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lte: ... }\\")
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { eq: ... }\\")
              someLocalTime_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gt: ... }\\")
              someLocalTime_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gte: ... }\\")
              someLocalTime_IN: [LocalTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { in: ... }\\")
              someLocalTime_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lt: ... }\\")
              someLocalTime_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lte: ... }\\")
              someString: StringScalarFilters
              someString_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter someString: { contains: ... }\\")
              someString_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { endsWith: ... }\\")
              someString_EQ: String @deprecated(reason: \\"Please use the relevant generic filter someString: { eq: ... }\\")
              someString_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter someString: { in: ... }\\")
              someString_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { startsWith: ... }\\")
              someTime: TimeScalarFilters
              someTime_EQ: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { eq: ... }\\")
              someTime_GT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gt: ... }\\")
              someTime_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gte: ... }\\")
              someTime_IN: [Time] @deprecated(reason: \\"Please use the relevant generic filter someTime: { in: ... }\\")
              someTime_LT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lt: ... }\\")
              someTime_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lte: ... }\\")
            }

            type UsersConnection {
              aggregate: UserAggregate!
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Where Level Aggregations with arrays", async () => {
        const typeDefs = /* GraphQL */ `
            type User @node {
                someID: ID
                someString: String
                someFloat: Float
                someInt: Int
                someBigInt: BigInt
                someDateTime: DateTime
                someLocalDateTime: LocalDateTime
                someLocalTime: LocalTime
                someTime: Time
                someDuration: Duration
            }

            type Post @node {
                title: String
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                someID: [ID!]!
                someString: [String!]!
                someFloat: [Float!]!
                someInt: [Int!]!
                someBigInt: [BigInt!]!
                someDateTime: [DateTime!]!
                someLocalDateTime: [LocalDateTime!]!
                someLocalTime: [LocalTime!]!
                someTime: [Time!]!
                someDuration: [Duration!]!
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
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelection {
              average: BigInt
              max: BigInt
              min: BigInt
              sum: BigInt
            }

            \\"\\"\\"BigInt list filters\\"\\"\\"
            input BigIntListFilters {
              eq: [BigInt!]
              includes: BigInt
            }

            \\"\\"\\"Filters for an aggregation of an BigInt field\\"\\"\\"
            input BigIntScalarAggregationFilters {
              average: BigIntScalarFilters
              max: BigIntScalarFilters
              min: BigIntScalarFilters
              sum: BigIntScalarFilters
            }

            \\"\\"\\"BigInt filters\\"\\"\\"
            input BigIntScalarFilters {
              eq: BigInt
              gt: BigInt
              gte: BigInt
              in: [BigInt!]
              lt: BigInt
              lte: BigInt
            }

            \\"\\"\\"BigInt mutations\\"\\"\\"
            input BigIntScalarMutations {
              add: BigInt
              set: BigInt
              subtract: BigInt
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
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

            \\"\\"\\"Filters for an aggregation of an DateTime input field\\"\\"\\"
            input DateTimeScalarAggregationFilters {
              max: DateTimeScalarFilters
              min: DateTimeScalarFilters
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

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            type DurationAggregateSelection {
              max: Duration
              min: Duration
            }

            \\"\\"\\"Duration list filters\\"\\"\\"
            input DurationListFilters {
              eq: [Duration!]
              includes: Duration
            }

            \\"\\"\\"Filters for an aggregation of a Dutation input field\\"\\"\\"
            input DurationScalarAggregationFilters {
              average: DurationScalarFilters
              max: DurationScalarFilters
              min: DurationScalarFilters
            }

            \\"\\"\\"Duration filters\\"\\"\\"
            input DurationScalarFilters {
              eq: Duration
              gt: Duration
              gte: Duration
              in: [Duration!]
              lt: Duration
              lte: Duration
            }

            \\"\\"\\"Duration mutations\\"\\"\\"
            input DurationScalarMutations {
              set: Duration
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

            \\"\\"\\"Filters for an aggregation of a float field\\"\\"\\"
            input FloatScalarAggregationFilters {
              average: FloatScalarFilters
              max: FloatScalarFilters
              min: FloatScalarFilters
              sum: FloatScalarFilters
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

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Post.likes
            \\"\\"\\"
            type Likes {
              someBigInt: [BigInt!]!
              someDateTime: [DateTime!]!
              someDuration: [Duration!]!
              someFloat: [Float!]!
              someID: [ID!]!
              someInt: [Int!]!
              someLocalDateTime: [LocalDateTime!]!
              someLocalTime: [LocalTime!]!
              someString: [String!]!
              someTime: [Time!]!
            }

            input LikesCreateInput {
              someBigInt: [BigInt!]!
              someDateTime: [DateTime!]!
              someDuration: [Duration!]!
              someFloat: [Float!]!
              someID: [ID!]!
              someInt: [Int!]!
              someLocalDateTime: [LocalDateTime!]!
              someLocalTime: [LocalTime!]!
              someString: [String!]!
              someTime: [Time!]!
            }

            input LikesSort {
              someBigInt: SortDirection
              someDateTime: SortDirection
              someDuration: SortDirection
              someFloat: SortDirection
              someID: SortDirection
              someInt: SortDirection
              someLocalDateTime: SortDirection
              someLocalTime: SortDirection
              someString: SortDirection
              someTime: SortDirection
            }

            input LikesUpdateInput {
              someBigInt: ListBigIntMutations
              someBigInt_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someBigInt: { pop: ... } }' instead.\\")
              someBigInt_PUSH: [BigInt!] @deprecated(reason: \\"Please use the generic mutation 'someBigInt: { push: ... } }' instead.\\")
              someBigInt_SET: [BigInt!] @deprecated(reason: \\"Please use the generic mutation 'someBigInt: { set: ... } }' instead.\\")
              someDateTime: ListDateTimeMutations
              someDateTime_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someDateTime: { pop: ... } }' instead.\\")
              someDateTime_PUSH: [DateTime!] @deprecated(reason: \\"Please use the generic mutation 'someDateTime: { push: ... } }' instead.\\")
              someDateTime_SET: [DateTime!] @deprecated(reason: \\"Please use the generic mutation 'someDateTime: { set: ... } }' instead.\\")
              someDuration: ListDurationMutations
              someDuration_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someDuration: { pop: ... } }' instead.\\")
              someDuration_PUSH: [Duration!] @deprecated(reason: \\"Please use the generic mutation 'someDuration: { push: ... } }' instead.\\")
              someDuration_SET: [Duration!] @deprecated(reason: \\"Please use the generic mutation 'someDuration: { set: ... } }' instead.\\")
              someFloat: ListFloatMutations
              someFloat_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someFloat: { pop: ... } }' instead.\\")
              someFloat_PUSH: [Float!] @deprecated(reason: \\"Please use the generic mutation 'someFloat: { push: ... } }' instead.\\")
              someFloat_SET: [Float!] @deprecated(reason: \\"Please use the generic mutation 'someFloat: { set: ... } }' instead.\\")
              someID: ListIDMutations
              someID_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someID: { pop: ... } }' instead.\\")
              someID_PUSH: [ID!] @deprecated(reason: \\"Please use the generic mutation 'someID: { push: ... } }' instead.\\")
              someID_SET: [ID!] @deprecated(reason: \\"Please use the generic mutation 'someID: { set: ... } }' instead.\\")
              someInt: ListIntMutations
              someInt_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someInt: { pop: ... } }' instead.\\")
              someInt_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someInt: { push: ... } }' instead.\\")
              someInt_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someInt: { set: ... } }' instead.\\")
              someLocalDateTime: ListLocalDateTimeMutations
              someLocalDateTime_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someLocalDateTime: { pop: ... } }' instead.\\")
              someLocalDateTime_PUSH: [LocalDateTime!] @deprecated(reason: \\"Please use the generic mutation 'someLocalDateTime: { push: ... } }' instead.\\")
              someLocalDateTime_SET: [LocalDateTime!] @deprecated(reason: \\"Please use the generic mutation 'someLocalDateTime: { set: ... } }' instead.\\")
              someLocalTime: ListLocalTimeMutations
              someLocalTime_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someLocalTime: { pop: ... } }' instead.\\")
              someLocalTime_PUSH: [LocalTime!] @deprecated(reason: \\"Please use the generic mutation 'someLocalTime: { push: ... } }' instead.\\")
              someLocalTime_SET: [LocalTime!] @deprecated(reason: \\"Please use the generic mutation 'someLocalTime: { set: ... } }' instead.\\")
              someString: ListStringMutations
              someString_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someString: { pop: ... } }' instead.\\")
              someString_PUSH: [String!] @deprecated(reason: \\"Please use the generic mutation 'someString: { push: ... } }' instead.\\")
              someString_SET: [String!] @deprecated(reason: \\"Please use the generic mutation 'someString: { set: ... } }' instead.\\")
              someTime: ListTimeMutations
              someTime_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someTime: { pop: ... } }' instead.\\")
              someTime_PUSH: [Time!] @deprecated(reason: \\"Please use the generic mutation 'someTime: { push: ... } }' instead.\\")
              someTime_SET: [Time!] @deprecated(reason: \\"Please use the generic mutation 'someTime: { set: ... } }' instead.\\")
            }

            input LikesWhere {
              AND: [LikesWhere!]
              NOT: LikesWhere
              OR: [LikesWhere!]
              someBigInt: BigIntListFilters
              someBigInt_EQ: [BigInt!] @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { eq: ... }\\")
              someBigInt_INCLUDES: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { includes: ... }\\")
              someDateTime: DateTimeListFilters
              someDateTime_EQ: [DateTime!] @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { eq: ... }\\")
              someDateTime_INCLUDES: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { includes: ... }\\")
              someDuration: DurationListFilters
              someDuration_EQ: [Duration!] @deprecated(reason: \\"Please use the relevant generic filter someDuration: { eq: ... }\\")
              someDuration_INCLUDES: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { includes: ... }\\")
              someFloat: FloatListFilters
              someFloat_EQ: [Float!] @deprecated(reason: \\"Please use the relevant generic filter someFloat: { eq: ... }\\")
              someFloat_INCLUDES: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { includes: ... }\\")
              someID: IDListFilters
              someID_EQ: [ID!] @deprecated(reason: \\"Please use the relevant generic filter someID: { eq: ... }\\")
              someID_INCLUDES: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { includes: ... }\\")
              someInt: IntListFilters
              someInt_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someInt: { eq: ... }\\")
              someInt_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { includes: ... }\\")
              someLocalDateTime: LocalDateTimeListFilters
              someLocalDateTime_EQ: [LocalDateTime!] @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { eq: ... }\\")
              someLocalDateTime_INCLUDES: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { includes: ... }\\")
              someLocalTime: LocalTimeListFilters
              someLocalTime_EQ: [LocalTime!] @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { eq: ... }\\")
              someLocalTime_INCLUDES: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { includes: ... }\\")
              someString: StringListFilters
              someString_EQ: [String!] @deprecated(reason: \\"Please use the relevant generic filter someString: { eq: ... }\\")
              someString_INCLUDES: String @deprecated(reason: \\"Please use the relevant generic filter someString: { includes: ... }\\")
              someTime: TimeListFilters
              someTime_EQ: [Time!] @deprecated(reason: \\"Please use the relevant generic filter someTime: { eq: ... }\\")
              someTime_INCLUDES: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { includes: ... }\\")
            }

            \\"\\"\\"Mutations for a list for BigInt\\"\\"\\"
            input ListBigIntMutations {
              pop: Int
              push: [BigInt!]
              set: [BigInt!]
            }

            \\"\\"\\"Mutations for a list for DateTime\\"\\"\\"
            input ListDateTimeMutations {
              pop: Int
              push: [DateTime!]
              set: [DateTime!]
            }

            \\"\\"\\"Mutations for a list for Duration\\"\\"\\"
            input ListDurationMutations {
              pop: Int
              push: [Duration!]
              set: [Duration!]
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

            \\"\\"\\"Mutations for a list for LocalDateTime\\"\\"\\"
            input ListLocalDateTimeMutations {
              pop: Int
              push: [LocalDateTime!]
              set: [LocalDateTime!]
            }

            \\"\\"\\"Mutations for a list for LocalTime\\"\\"\\"
            input ListLocalTimeMutations {
              pop: Int
              push: [LocalTime!]
              set: [LocalTime!]
            }

            \\"\\"\\"Mutations for a list for String\\"\\"\\"
            input ListStringMutations {
              pop: Int
              push: [String!]
              set: [String!]
            }

            \\"\\"\\"Mutations for a list for Time\\"\\"\\"
            input ListTimeMutations {
              pop: Int
              push: [Time!]
              set: [Time!]
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            type LocalDateTimeAggregateSelection {
              max: LocalDateTime
              min: LocalDateTime
            }

            \\"\\"\\"LocalDateTime list filters\\"\\"\\"
            input LocalDateTimeListFilters {
              eq: [LocalDateTime!]
              includes: LocalDateTime
            }

            \\"\\"\\"Filters for an aggregation of an LocalDateTime input field\\"\\"\\"
            input LocalDateTimeScalarAggregationFilters {
              max: LocalDateTimeScalarFilters
              min: LocalDateTimeScalarFilters
            }

            \\"\\"\\"LocalDateTime filters\\"\\"\\"
            input LocalDateTimeScalarFilters {
              eq: LocalDateTime
              gt: LocalDateTime
              gte: LocalDateTime
              in: [LocalDateTime!]
              lt: LocalDateTime
              lte: LocalDateTime
            }

            \\"\\"\\"LocalDateTime mutations\\"\\"\\"
            input LocalDateTimeScalarMutations {
              set: LocalDateTime
            }

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            type LocalTimeAggregateSelection {
              max: LocalTime
              min: LocalTime
            }

            \\"\\"\\"LocalTime list filters\\"\\"\\"
            input LocalTimeListFilters {
              eq: [LocalTime!]
              includes: LocalTime
            }

            \\"\\"\\"Filters for an aggregation of an LocalTime input field\\"\\"\\"
            input LocalTimeScalarAggregationFilters {
              max: LocalTimeScalarFilters
              min: LocalTimeScalarFilters
            }

            \\"\\"\\"LocalTime filters\\"\\"\\"
            input LocalTimeScalarFilters {
              eq: LocalTime
              gt: LocalTime
              gte: LocalTime
              in: [LocalTime!]
              lt: LocalTime
              lte: LocalTime
            }

            \\"\\"\\"LocalTime mutations\\"\\"\\"
            input LocalTimeScalarMutations {
              set: LocalTime
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(where: UserWhere): DeleteInfo!
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              likes(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              likesConnection(after: String, first: Int, sort: [PostLikesConnectionSort!], where: PostLikesConnectionWhere): PostLikesConnection!
              title: String
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              title: StringAggregateSelection!
            }

            input PostCreateInput {
              likes: PostLikesFieldInput
              title: String
            }

            input PostDeleteInput {
              likes: [PostLikesDeleteFieldInput!]
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostLikesAggregateInput {
              AND: [PostLikesAggregateInput!]
              NOT: PostLikesAggregateInput
              OR: [PostLikesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: PostLikesNodeAggregationWhereInput
            }

            input PostLikesConnectFieldInput {
              edge: LikesCreateInput!
              where: UserConnectWhere
            }

            type PostLikesConnection {
              aggregate: PostUserLikesAggregateSelection!
              edges: [PostLikesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostLikesConnectionAggregateInput {
              AND: [PostLikesConnectionAggregateInput!]
              NOT: PostLikesConnectionAggregateInput
              OR: [PostLikesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: PostLikesNodeAggregationWhereInput
            }

            input PostLikesConnectionFilters {
              \\"\\"\\"Filter Posts by aggregating results on related PostLikesConnections\\"\\"\\"
              aggregate: PostLikesConnectionAggregateInput
              \\"\\"\\"
              Return Posts where all of the related PostLikesConnections match this filter
              \\"\\"\\"
              all: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where none of the related PostLikesConnections match this filter
              \\"\\"\\"
              none: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where one of the related PostLikesConnections match this filter
              \\"\\"\\"
              single: PostLikesConnectionWhere
              \\"\\"\\"
              Return Posts where some of the related PostLikesConnections match this filter
              \\"\\"\\"
              some: PostLikesConnectionWhere
            }

            input PostLikesConnectionSort {
              edge: LikesSort
              node: UserSort
            }

            input PostLikesConnectionWhere {
              AND: [PostLikesConnectionWhere!]
              NOT: PostLikesConnectionWhere
              OR: [PostLikesConnectionWhere!]
              edge: LikesWhere
              node: UserWhere
            }

            input PostLikesCreateFieldInput {
              edge: LikesCreateInput!
              node: UserCreateInput!
            }

            input PostLikesDeleteFieldInput {
              where: PostLikesConnectionWhere
            }

            input PostLikesDisconnectFieldInput {
              where: PostLikesConnectionWhere
            }

            input PostLikesFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
            }

            input PostLikesNodeAggregationWhereInput {
              AND: [PostLikesNodeAggregationWhereInput!]
              NOT: PostLikesNodeAggregationWhereInput
              OR: [PostLikesNodeAggregationWhereInput!]
              someBigInt: BigIntScalarAggregationFilters
              someBigInt_AVERAGE_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { eq: ... } } }' instead.\\")
              someBigInt_AVERAGE_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { gt: ... } } }' instead.\\")
              someBigInt_AVERAGE_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { gte: ... } } }' instead.\\")
              someBigInt_AVERAGE_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { lt: ... } } }' instead.\\")
              someBigInt_AVERAGE_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { average: { lte: ... } } }' instead.\\")
              someBigInt_MAX_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { eq: ... } } }' instead.\\")
              someBigInt_MAX_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { gt: ... } } }' instead.\\")
              someBigInt_MAX_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { gte: ... } } }' instead.\\")
              someBigInt_MAX_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { lt: ... } } }' instead.\\")
              someBigInt_MAX_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { max: { lte: ... } } }' instead.\\")
              someBigInt_MIN_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { eq: ... } } }' instead.\\")
              someBigInt_MIN_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { gt: ... } } }' instead.\\")
              someBigInt_MIN_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { gte: ... } } }' instead.\\")
              someBigInt_MIN_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { lt: ... } } }' instead.\\")
              someBigInt_MIN_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { min: { lte: ... } } }' instead.\\")
              someBigInt_SUM_EQUAL: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { eq: ... } } }' instead.\\")
              someBigInt_SUM_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { gt: ... } } }' instead.\\")
              someBigInt_SUM_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { gte: ... } } }' instead.\\")
              someBigInt_SUM_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { lt: ... } } }' instead.\\")
              someBigInt_SUM_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter 'someBigInt: { sum: { lte: ... } } }' instead.\\")
              someDateTime: DateTimeScalarAggregationFilters
              someDateTime_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { eq: ... } } }' instead.\\")
              someDateTime_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { gt: ... } } }' instead.\\")
              someDateTime_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { gte: ... } } }' instead.\\")
              someDateTime_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { lt: ... } } }' instead.\\")
              someDateTime_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { max: { lte: ... } } }' instead.\\")
              someDateTime_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { eq: ... } } }' instead.\\")
              someDateTime_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { gt: ... } } }' instead.\\")
              someDateTime_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { gte: ... } } }' instead.\\")
              someDateTime_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { lt: ... } } }' instead.\\")
              someDateTime_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'someDateTime: { min: { lte: ... } } }' instead.\\")
              someDuration: DurationScalarAggregationFilters
              someDuration_AVERAGE_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { eq: ... } } }' instead.\\")
              someDuration_AVERAGE_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { gt: ... } } }' instead.\\")
              someDuration_AVERAGE_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { gte: ... } } }' instead.\\")
              someDuration_AVERAGE_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { lt: ... } } }' instead.\\")
              someDuration_AVERAGE_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { average: { lte: ... } } }' instead.\\")
              someDuration_MAX_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { eq: ... } } }' instead.\\")
              someDuration_MAX_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { gt: ... } } }' instead.\\")
              someDuration_MAX_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { gte: ... } } }' instead.\\")
              someDuration_MAX_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { lt: ... } } }' instead.\\")
              someDuration_MAX_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { max: { lte: ... } } }' instead.\\")
              someDuration_MIN_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { eq: ... } } }' instead.\\")
              someDuration_MIN_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { gt: ... } } }' instead.\\")
              someDuration_MIN_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { gte: ... } } }' instead.\\")
              someDuration_MIN_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { lt: ... } } }' instead.\\")
              someDuration_MIN_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'someDuration: { min: { lte: ... } } }' instead.\\")
              someFloat: FloatScalarAggregationFilters
              someFloat_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { eq: ... } } }' instead.\\")
              someFloat_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { gt: ... } } }' instead.\\")
              someFloat_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { gte: ... } } }' instead.\\")
              someFloat_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { lt: ... } } }' instead.\\")
              someFloat_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { average: { lte: ... } } }' instead.\\")
              someFloat_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { eq: ... } } }' instead.\\")
              someFloat_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { gt: ... } } }' instead.\\")
              someFloat_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { gte: ... } } }' instead.\\")
              someFloat_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { lt: ... } } }' instead.\\")
              someFloat_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { max: { lte: ... } } }' instead.\\")
              someFloat_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { eq: ... } } }' instead.\\")
              someFloat_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { gt: ... } } }' instead.\\")
              someFloat_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { gte: ... } } }' instead.\\")
              someFloat_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { lt: ... } } }' instead.\\")
              someFloat_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { min: { lte: ... } } }' instead.\\")
              someFloat_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { eq: ... } } }' instead.\\")
              someFloat_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { gt: ... } } }' instead.\\")
              someFloat_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { gte: ... } } }' instead.\\")
              someFloat_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { lt: ... } } }' instead.\\")
              someFloat_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someFloat: { sum: { lte: ... } } }' instead.\\")
              someInt: IntScalarAggregationFilters
              someInt_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { eq: ... } } }' instead.\\")
              someInt_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { gt: ... } } }' instead.\\")
              someInt_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { gte: ... } } }' instead.\\")
              someInt_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { lt: ... } } }' instead.\\")
              someInt_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { average: { lte: ... } } }' instead.\\")
              someInt_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { eq: ... } } }' instead.\\")
              someInt_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { gt: ... } } }' instead.\\")
              someInt_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { gte: ... } } }' instead.\\")
              someInt_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { lt: ... } } }' instead.\\")
              someInt_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { max: { lte: ... } } }' instead.\\")
              someInt_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { eq: ... } } }' instead.\\")
              someInt_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { gt: ... } } }' instead.\\")
              someInt_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { gte: ... } } }' instead.\\")
              someInt_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { lt: ... } } }' instead.\\")
              someInt_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { min: { lte: ... } } }' instead.\\")
              someInt_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { eq: ... } } }' instead.\\")
              someInt_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { gt: ... } } }' instead.\\")
              someInt_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { gte: ... } } }' instead.\\")
              someInt_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { lt: ... } } }' instead.\\")
              someInt_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someInt: { sum: { lte: ... } } }' instead.\\")
              someLocalDateTime: LocalDateTimeScalarAggregationFilters
              someLocalDateTime_MAX_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { eq: ... } } }' instead.\\")
              someLocalDateTime_MAX_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { gt: ... } } }' instead.\\")
              someLocalDateTime_MAX_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { gte: ... } } }' instead.\\")
              someLocalDateTime_MAX_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { lt: ... } } }' instead.\\")
              someLocalDateTime_MAX_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { max: { lte: ... } } }' instead.\\")
              someLocalDateTime_MIN_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { eq: ... } } }' instead.\\")
              someLocalDateTime_MIN_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { gt: ... } } }' instead.\\")
              someLocalDateTime_MIN_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { gte: ... } } }' instead.\\")
              someLocalDateTime_MIN_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { lt: ... } } }' instead.\\")
              someLocalDateTime_MIN_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalDateTime: { min: { lte: ... } } }' instead.\\")
              someLocalTime: LocalTimeScalarAggregationFilters
              someLocalTime_MAX_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { eq: ... } } }' instead.\\")
              someLocalTime_MAX_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { gt: ... } } }' instead.\\")
              someLocalTime_MAX_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { gte: ... } } }' instead.\\")
              someLocalTime_MAX_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { lt: ... } } }' instead.\\")
              someLocalTime_MAX_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { max: { lte: ... } } }' instead.\\")
              someLocalTime_MIN_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { eq: ... } } }' instead.\\")
              someLocalTime_MIN_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { gt: ... } } }' instead.\\")
              someLocalTime_MIN_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { gte: ... } } }' instead.\\")
              someLocalTime_MIN_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { lt: ... } } }' instead.\\")
              someLocalTime_MIN_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'someLocalTime: { min: { lte: ... } } }' instead.\\")
              someString: StringScalarAggregationFilters
              someString_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { eq: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { gte: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lt: ... } } }' instead.\\")
              someString_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'someString: { averageLength: { lte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { eq: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { gte: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lt: ... } } }' instead.\\")
              someString_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { longestLength: { lte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { eq: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { gte: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lt: ... } } }' instead.\\")
              someString_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'someString: { shortestLength: { lte: ... } } }' instead.\\")
              someTime: TimeScalarAggregationFilters
              someTime_MAX_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { eq: ... } } }' instead.\\")
              someTime_MAX_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { gt: ... } } }' instead.\\")
              someTime_MAX_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { gte: ... } } }' instead.\\")
              someTime_MAX_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { lt: ... } } }' instead.\\")
              someTime_MAX_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { max: { lte: ... } } }' instead.\\")
              someTime_MIN_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { eq: ... } } }' instead.\\")
              someTime_MIN_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { gt: ... } } }' instead.\\")
              someTime_MIN_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { gte: ... } } }' instead.\\")
              someTime_MIN_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { lt: ... } } }' instead.\\")
              someTime_MIN_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'someTime: { min: { lte: ... } } }' instead.\\")
            }

            type PostLikesRelationship {
              cursor: String!
              node: User!
              properties: Likes!
            }

            input PostLikesUpdateConnectionInput {
              edge: LikesUpdateInput
              node: UserUpdateInput
              where: PostLikesConnectionWhere
            }

            input PostLikesUpdateFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
              delete: [PostLikesDeleteFieldInput!]
              disconnect: [PostLikesDisconnectFieldInput!]
              update: PostLikesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              title: SortDirection
            }

            input PostUpdateInput {
              likes: [PostLikesUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            type PostUserLikesAggregateSelection {
              count: CountConnection!
              node: PostUserLikesNodeAggregateSelection
            }

            type PostUserLikesNodeAggregateSelection {
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someInt: IntAggregateSelection!
              someLocalDateTime: LocalDateTimeAggregateSelection!
              someLocalTime: LocalTimeAggregateSelection!
              someString: StringAggregateSelection!
              someTime: TimeAggregateSelection!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              likes: UserRelationshipFilters
              likesAggregate: PostLikesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the likesConnection filter, please use { likesConnection: { aggregate: {...} } } instead\\")
              likesConnection: PostLikesConnectionFilters
              \\"\\"\\"
              Return Posts where all of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_ALL: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where none of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_NONE: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where one of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_SINGLE: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Posts where some of the related PostLikesConnections match this filter
              \\"\\"\\"
              likesConnection_SOME: PostLikesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'likesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              likes_ALL: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: { all: ... }' instead.\\")
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              likes_NONE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: { none: ... }' instead.\\")
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              likes_SINGLE: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: {  single: ... }' instead.\\")
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              likes_SOME: UserWhere @deprecated(reason: \\"Please use the relevant generic filter 'likes: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type PostsConnection {
              aggregate: PostAggregate!
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              usersConnection(after: String, first: Int, sort: [UserSort!], where: UserWhere): UsersConnection!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
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

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            type TimeAggregateSelection {
              max: Time
              min: Time
            }

            \\"\\"\\"Time list filters\\"\\"\\"
            input TimeListFilters {
              eq: [Time!]
              includes: Time
            }

            \\"\\"\\"Filters for an aggregation of an Time input field\\"\\"\\"
            input TimeScalarAggregationFilters {
              max: TimeScalarFilters
              min: TimeScalarFilters
            }

            \\"\\"\\"Time filters\\"\\"\\"
            input TimeScalarFilters {
              eq: Time
              gt: Time
              gte: Time
              in: [Time!]
              lt: Time
              lte: Time
            }

            \\"\\"\\"Time mutations\\"\\"\\"
            input TimeScalarMutations {
              set: Time
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

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              someBigInt: BigInt
              someDateTime: DateTime
              someDuration: Duration
              someFloat: Float
              someID: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            type UserAggregate {
              count: Count!
              node: UserAggregateNode!
            }

            type UserAggregateNode {
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someInt: IntAggregateSelection!
              someLocalDateTime: LocalDateTimeAggregateSelection!
              someLocalTime: LocalTimeAggregateSelection!
              someString: StringAggregateSelection!
              someTime: TimeAggregateSelection!
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              someBigInt: BigInt
              someDateTime: DateTime
              someDuration: Duration
              someFloat: Float
              someID: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Filter type where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Filter type where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Filter type where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              someBigInt: SortDirection
              someDateTime: SortDirection
              someDuration: SortDirection
              someFloat: SortDirection
              someID: SortDirection
              someInt: SortDirection
              someLocalDateTime: SortDirection
              someLocalTime: SortDirection
              someString: SortDirection
              someTime: SortDirection
            }

            input UserUpdateInput {
              someBigInt: BigIntScalarMutations
              someBigInt_DECREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { decrement: ... } }' instead.\\")
              someBigInt_INCREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'someBigInt: { increment: ... } }' instead.\\")
              someBigInt_SET: BigInt @deprecated(reason: \\"Please use the generic mutation 'someBigInt: { set: ... } }' instead.\\")
              someDateTime: DateTimeScalarMutations
              someDateTime_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'someDateTime: { set: ... } }' instead.\\")
              someDuration: DurationScalarMutations
              someDuration_SET: Duration @deprecated(reason: \\"Please use the generic mutation 'someDuration: { set: ... } }' instead.\\")
              someFloat: FloatScalarMutations
              someFloat_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { add: ... } }' instead.\\")
              someFloat_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { divide: ... } }' instead.\\")
              someFloat_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { multiply: ... } }' instead.\\")
              someFloat_SET: Float @deprecated(reason: \\"Please use the generic mutation 'someFloat: { set: ... } }' instead.\\")
              someFloat_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'someFloat: { subtract: ... } }' instead.\\")
              someID: IDScalarMutations
              someID_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someID: { set: ... } }' instead.\\")
              someInt: IntScalarMutations
              someInt_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { decrement: ... } }' instead.\\")
              someInt_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'someInt: { increment: ... } }' instead.\\")
              someInt_SET: Int @deprecated(reason: \\"Please use the generic mutation 'someInt: { set: ... } }' instead.\\")
              someLocalDateTime: LocalDateTimeScalarMutations
              someLocalDateTime_SET: LocalDateTime @deprecated(reason: \\"Please use the generic mutation 'someLocalDateTime: { set: ... } }' instead.\\")
              someLocalTime: LocalTimeScalarMutations
              someLocalTime_SET: LocalTime @deprecated(reason: \\"Please use the generic mutation 'someLocalTime: { set: ... } }' instead.\\")
              someString: StringScalarMutations
              someString_SET: String @deprecated(reason: \\"Please use the generic mutation 'someString: { set: ... } }' instead.\\")
              someTime: TimeScalarMutations
              someTime_SET: Time @deprecated(reason: \\"Please use the generic mutation 'someTime: { set: ... } }' instead.\\")
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              someBigInt: BigIntScalarFilters
              someBigInt_EQ: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { eq: ... }\\")
              someBigInt_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gt: ... }\\")
              someBigInt_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { gte: ... }\\")
              someBigInt_IN: [BigInt] @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { in: ... }\\")
              someBigInt_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lt: ... }\\")
              someBigInt_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter someBigInt: { lte: ... }\\")
              someDateTime: DateTimeScalarFilters
              someDateTime_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { eq: ... }\\")
              someDateTime_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { gt: ... }\\")
              someDateTime_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { gte: ... }\\")
              someDateTime_IN: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { in: ... }\\")
              someDateTime_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { lt: ... }\\")
              someDateTime_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter someDateTime: { lte: ... }\\")
              someDuration: DurationScalarFilters
              someDuration_EQ: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { eq: ... }\\")
              someDuration_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { gt: ... }\\")
              someDuration_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { gte: ... }\\")
              someDuration_IN: [Duration] @deprecated(reason: \\"Please use the relevant generic filter someDuration: { in: ... }\\")
              someDuration_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { lt: ... }\\")
              someDuration_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter someDuration: { lte: ... }\\")
              someFloat: FloatScalarFilters
              someFloat_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { eq: ... }\\")
              someFloat_GT: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { gt: ... }\\")
              someFloat_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { gte: ... }\\")
              someFloat_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter someFloat: { in: ... }\\")
              someFloat_LT: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { lt: ... }\\")
              someFloat_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter someFloat: { lte: ... }\\")
              someID: IDScalarFilters
              someID_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { contains: ... }\\")
              someID_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { endsWith: ... }\\")
              someID_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { eq: ... }\\")
              someID_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter someID: { in: ... }\\")
              someID_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter someID: { startsWith: ... }\\")
              someInt: IntScalarFilters
              someInt_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { eq: ... }\\")
              someInt_GT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gt: ... }\\")
              someInt_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { gte: ... }\\")
              someInt_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter someInt: { in: ... }\\")
              someInt_LT: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lt: ... }\\")
              someInt_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter someInt: { lte: ... }\\")
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { eq: ... }\\")
              someLocalDateTime_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gt: ... }\\")
              someLocalDateTime_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { gte: ... }\\")
              someLocalDateTime_IN: [LocalDateTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { in: ... }\\")
              someLocalDateTime_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lt: ... }\\")
              someLocalDateTime_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter someLocalDateTime: { lte: ... }\\")
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { eq: ... }\\")
              someLocalTime_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gt: ... }\\")
              someLocalTime_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { gte: ... }\\")
              someLocalTime_IN: [LocalTime] @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { in: ... }\\")
              someLocalTime_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lt: ... }\\")
              someLocalTime_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter someLocalTime: { lte: ... }\\")
              someString: StringScalarFilters
              someString_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter someString: { contains: ... }\\")
              someString_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { endsWith: ... }\\")
              someString_EQ: String @deprecated(reason: \\"Please use the relevant generic filter someString: { eq: ... }\\")
              someString_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter someString: { in: ... }\\")
              someString_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter someString: { startsWith: ... }\\")
              someTime: TimeScalarFilters
              someTime_EQ: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { eq: ... }\\")
              someTime_GT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gt: ... }\\")
              someTime_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { gte: ... }\\")
              someTime_IN: [Time] @deprecated(reason: \\"Please use the relevant generic filter someTime: { in: ... }\\")
              someTime_LT: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lt: ... }\\")
              someTime_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter someTime: { lte: ... }\\")
            }

            type UsersConnection {
              aggregate: UserAggregate!
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
