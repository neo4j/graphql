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
import { Neo4jGraphQL } from "../../../src";

describe("Deprecated Aggregations disabled", () => {
    test("Top Level Aggregations", async () => {
        const typeDefs = gql`
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { excludeDeprecatedFields: { aggregationFilters: true } },
        });
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
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

            type MovieAggregateSelection {
              count: Int!
              createdAt: DateTimeAggregateSelection!
              id: IDAggregateSelection!
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
              createdAt_EQ: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              imdbRating: FloatScalarFilters
              imdbRating_EQ: Float
              imdbRating_GT: Float
              imdbRating_GTE: Float
              imdbRating_IN: [Float]
              imdbRating_LT: Float
              imdbRating_LTE: Float
              isbn: StringScalarFilters
              isbn_CONTAINS: String
              isbn_ENDS_WITH: String
              isbn_EQ: String
              isbn_IN: [String!]
              isbn_STARTS_WITH: String
              screenTime: DurationScalarFilters
              screenTime_EQ: Duration
              screenTime_GT: Duration
              screenTime_GTE: Duration
              screenTime_IN: [Duration]
              screenTime_LT: Duration
              screenTime_LTE: Duration
              someBigInt: BigIntScalarFilters
              someBigInt_EQ: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_IN: [BigInt]
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someInt: IntScalarFilters
              someInt_EQ: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_IN: [Int]
              someInt_LT: Int
              someInt_LTE: Int
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_IN: [LocalDateTime]
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_IN: [LocalTime]
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someTime: TimeScalarFilters
              someTime_EQ: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_IN: [Time]
              someTime_LT: Time
              someTime_LTE: Time
              title: StringScalarFilters
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String]
              title_STARTS_WITH: String
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
              matches: String
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
        const typeDefs = gql`
            type User @node {
                someId: ID
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
                someId: ID
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { excludeDeprecatedFields: { aggregationFilters: true } },
        });
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"Filters for an aggregation of an ID input field\\"\\"\\"
            input IDScalarAggregationFilters {
              max: IDScalarFilters
              min: IDScalarFilters
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
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
              someId: ID
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
              someDateTime: DateTimeScalarAggregationFilters
              someDuration: DurationScalarAggregationFilters
              someFloat: FloatScalarAggregationFilters
              someId: IDScalarAggregationFilters
              someInt: IntScalarAggregationFilters
              someLocalDateTime: LocalDateTimeScalarAggregationFilters
              someLocalTime: LocalTimeScalarAggregationFilters
              someString: StringScalarAggregationFilters
              someTime: TimeScalarAggregationFilters
            }

            input LikesCreateInput {
              someBigInt: BigInt
              someDateTime: DateTime
              someDuration: Duration
              someFloat: Float
              someId: ID
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
              someId: SortDirection
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
              someId: IDScalarMutations
              someId_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someId: { set: ... } }' instead.\\")
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
              someBigInt_EQ: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_IN: [BigInt]
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someDateTime: DateTimeScalarFilters
              someDateTime_EQ: DateTime
              someDateTime_GT: DateTime
              someDateTime_GTE: DateTime
              someDateTime_IN: [DateTime]
              someDateTime_LT: DateTime
              someDateTime_LTE: DateTime
              someDuration: DurationScalarFilters
              someDuration_EQ: Duration
              someDuration_GT: Duration
              someDuration_GTE: Duration
              someDuration_IN: [Duration]
              someDuration_LT: Duration
              someDuration_LTE: Duration
              someFloat: FloatScalarFilters
              someFloat_EQ: Float
              someFloat_GT: Float
              someFloat_GTE: Float
              someFloat_IN: [Float]
              someFloat_LT: Float
              someFloat_LTE: Float
              someId: IDScalarFilters
              someId_CONTAINS: ID
              someId_ENDS_WITH: ID
              someId_EQ: ID
              someId_IN: [ID]
              someId_STARTS_WITH: ID
              someInt: IntScalarFilters
              someInt_EQ: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_IN: [Int]
              someInt_LT: Int
              someInt_LTE: Int
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_IN: [LocalDateTime]
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_IN: [LocalTime]
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someString: StringScalarFilters
              someString_CONTAINS: String
              someString_ENDS_WITH: String
              someString_EQ: String
              someString_IN: [String]
              someString_STARTS_WITH: String
              someTime: TimeScalarFilters
              someTime_EQ: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_IN: [Time]
              someTime_LT: Time
              someTime_LTE: Time
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
              likesAggregate(where: UserWhere): PostUserLikesAggregationSelection
              likesConnection(after: String, first: Int, sort: [PostLikesConnectionSort!], where: PostLikesConnectionWhere): PostLikesConnection!
              title: String
            }

            type PostAggregateSelection {
              count: Int!
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
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: LikesAggregationWhereInput
              node: PostLikesNodeAggregationWhereInput
            }

            input PostLikesConnectFieldInput {
              edge: LikesCreateInput
              where: UserConnectWhere
            }

            type PostLikesConnection {
              edges: [PostLikesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostLikesConnectionFilters {
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
              someDateTime: DateTimeScalarAggregationFilters
              someDuration: DurationScalarAggregationFilters
              someFloat: FloatScalarAggregationFilters
              someId: IDScalarAggregationFilters
              someInt: IntScalarAggregationFilters
              someLocalDateTime: LocalDateTimeScalarAggregationFilters
              someLocalTime: LocalTimeScalarAggregationFilters
              someString: StringScalarAggregationFilters
              someTime: TimeScalarAggregationFilters
            }

            type PostLikesRelationship {
              cursor: String!
              node: User!
              properties: Likes!
            }

            input PostLikesRelationshipFilters {
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            input PostLikesUpdateConnectionInput {
              edge: LikesUpdateInput
              node: UserUpdateInput
            }

            input PostLikesUpdateFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
              delete: [PostLikesDeleteFieldInput!]
              disconnect: [PostLikesDisconnectFieldInput!]
              update: PostLikesUpdateConnectionInput
              where: PostLikesConnectionWhere
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

            type PostUserLikesAggregationSelection {
              count: Int!
              edge: PostUserLikesEdgeAggregateSelection
              node: PostUserLikesNodeAggregateSelection
            }

            type PostUserLikesEdgeAggregateSelection {
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someId: IDAggregateSelection!
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
              someId: IDAggregateSelection!
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
              likes: PostLikesRelationshipFilters
              likesAggregate: PostLikesAggregateInput
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
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String]
              title_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
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
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
              matches: String
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
              someId: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            type UserAggregateSelection {
              count: Int!
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someId: IDAggregateSelection!
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
              someId: ID
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

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              someBigInt: SortDirection
              someDateTime: SortDirection
              someDuration: SortDirection
              someFloat: SortDirection
              someId: SortDirection
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
              someId: IDScalarMutations
              someId_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someId: { set: ... } }' instead.\\")
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
              someBigInt_EQ: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_IN: [BigInt]
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someDateTime: DateTimeScalarFilters
              someDateTime_EQ: DateTime
              someDateTime_GT: DateTime
              someDateTime_GTE: DateTime
              someDateTime_IN: [DateTime]
              someDateTime_LT: DateTime
              someDateTime_LTE: DateTime
              someDuration: DurationScalarFilters
              someDuration_EQ: Duration
              someDuration_GT: Duration
              someDuration_GTE: Duration
              someDuration_IN: [Duration]
              someDuration_LT: Duration
              someDuration_LTE: Duration
              someFloat: FloatScalarFilters
              someFloat_EQ: Float
              someFloat_GT: Float
              someFloat_GTE: Float
              someFloat_IN: [Float]
              someFloat_LT: Float
              someFloat_LTE: Float
              someId: IDScalarFilters
              someId_CONTAINS: ID
              someId_ENDS_WITH: ID
              someId_EQ: ID
              someId_IN: [ID]
              someId_STARTS_WITH: ID
              someInt: IntScalarFilters
              someInt_EQ: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_IN: [Int]
              someInt_LT: Int
              someInt_LTE: Int
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_IN: [LocalDateTime]
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_IN: [LocalTime]
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someString: StringScalarFilters
              someString_CONTAINS: String
              someString_ENDS_WITH: String
              someString_EQ: String
              someString_IN: [String]
              someString_STARTS_WITH: String
              someTime: TimeScalarFilters
              someTime_EQ: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_IN: [Time]
              someTime_LT: Time
              someTime_LTE: Time
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Where Level Aggregations with arrays", async () => {
        const typeDefs = gql`
            type User @node {
                someId: ID
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
                someId: [ID!]!
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { excludeDeprecatedFields: { aggregationFilters: true } },
        });
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
              eq: [BigIntScalarFilters!]
              includes: BigIntScalarFilters
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
              eq: [DateTimeScalarFilters!]
              includes: DateTimeScalarFilters
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
              eq: [DurationScalarFilters!]
              includes: DurationScalarFilters
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
              eq: [FloatScalarFilters!]
              includes: FloatScalarFilters
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID list filters\\"\\"\\"
            input IDListFilters {
              eq: [IDScalarFilters!]
              includes: IDScalarFilters
            }

            \\"\\"\\"Filters for an aggregation of an ID input field\\"\\"\\"
            input IDScalarAggregationFilters {
              max: IDScalarFilters
              min: IDScalarFilters
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
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
              someId: [ID!]!
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
              someId: [ID!]!
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
              someId: SortDirection
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
              someId: ListIDMutations
              someId_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someId: { pop: ... } }' instead.\\")
              someId_PUSH: [ID!] @deprecated(reason: \\"Please use the generic mutation 'someId: { push: ... } }' instead.\\")
              someId_SET: [ID!] @deprecated(reason: \\"Please use the generic mutation 'someId: { set: ... } }' instead.\\")
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
              someBigInt_EQ: [BigInt!]
              someBigInt_INCLUDES: BigInt
              someDateTime: DateTimeListFilters
              someDateTime_EQ: [DateTime!]
              someDateTime_INCLUDES: DateTime
              someDuration: DurationListFilters
              someDuration_EQ: [Duration!]
              someDuration_INCLUDES: Duration
              someFloat: FloatListFilters
              someFloat_EQ: [Float!]
              someFloat_INCLUDES: Float
              someId: IDListFilters
              someId_EQ: [ID!]
              someId_INCLUDES: ID
              someInt: IntListFilters
              someInt_EQ: [Int!]
              someInt_INCLUDES: Int
              someLocalDateTime: LocalDateTimeListFilters
              someLocalDateTime_EQ: [LocalDateTime!]
              someLocalDateTime_INCLUDES: LocalDateTime
              someLocalTime: LocalTimeListFilters
              someLocalTime_EQ: [LocalTime!]
              someLocalTime_INCLUDES: LocalTime
              someString: StringListFilters
              someString_EQ: [String!]
              someString_INCLUDES: String
              someTime: TimeListFilters
              someTime_EQ: [Time!]
              someTime_INCLUDES: Time
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
              eq: [LocalDateTimeScalarFilters!]
              includes: LocalDateTimeScalarFilters
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
              eq: [LocalTimeScalarFilters!]
              includes: LocalTimeScalarFilters
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
              likesAggregate(where: UserWhere): PostUserLikesAggregationSelection
              likesConnection(after: String, first: Int, sort: [PostLikesConnectionSort!], where: PostLikesConnectionWhere): PostLikesConnection!
              title: String
            }

            type PostAggregateSelection {
              count: Int!
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
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostLikesNodeAggregationWhereInput
            }

            input PostLikesConnectFieldInput {
              edge: LikesCreateInput!
              where: UserConnectWhere
            }

            type PostLikesConnection {
              edges: [PostLikesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostLikesConnectionFilters {
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
              someDateTime: DateTimeScalarAggregationFilters
              someDuration: DurationScalarAggregationFilters
              someFloat: FloatScalarAggregationFilters
              someId: IDScalarAggregationFilters
              someInt: IntScalarAggregationFilters
              someLocalDateTime: LocalDateTimeScalarAggregationFilters
              someLocalTime: LocalTimeScalarAggregationFilters
              someString: StringScalarAggregationFilters
              someTime: TimeScalarAggregationFilters
            }

            type PostLikesRelationship {
              cursor: String!
              node: User!
              properties: Likes!
            }

            input PostLikesRelationshipFilters {
              \\"\\"\\"Return Posts where all of the related Users match this filter\\"\\"\\"
              all: UserWhere
              \\"\\"\\"Return Posts where none of the related Users match this filter\\"\\"\\"
              none: UserWhere
              \\"\\"\\"Return Posts where one of the related Users match this filter\\"\\"\\"
              single: UserWhere
              \\"\\"\\"Return Posts where some of the related Users match this filter\\"\\"\\"
              some: UserWhere
            }

            input PostLikesUpdateConnectionInput {
              edge: LikesUpdateInput
              node: UserUpdateInput
            }

            input PostLikesUpdateFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
              delete: [PostLikesDeleteFieldInput!]
              disconnect: [PostLikesDisconnectFieldInput!]
              update: PostLikesUpdateConnectionInput
              where: PostLikesConnectionWhere
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

            type PostUserLikesAggregationSelection {
              count: Int!
              node: PostUserLikesNodeAggregateSelection
            }

            type PostUserLikesNodeAggregateSelection {
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someId: IDAggregateSelection!
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
              likes: PostLikesRelationshipFilters
              likesAggregate: PostLikesAggregateInput
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
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String]
              title_STARTS_WITH: String
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
              users(limit: Int, offset: Int, sort: [UserSort!], where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
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
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
              matches: String
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
              someId: ID
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someString: String
              someTime: Time
            }

            type UserAggregateSelection {
              count: Int!
              someBigInt: BigIntAggregateSelection!
              someDateTime: DateTimeAggregateSelection!
              someDuration: DurationAggregateSelection!
              someFloat: FloatAggregateSelection!
              someId: IDAggregateSelection!
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
              someId: ID
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

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              someBigInt: SortDirection
              someDateTime: SortDirection
              someDuration: SortDirection
              someFloat: SortDirection
              someId: SortDirection
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
              someId: IDScalarMutations
              someId_SET: ID @deprecated(reason: \\"Please use the generic mutation 'someId: { set: ... } }' instead.\\")
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
              someBigInt_EQ: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_IN: [BigInt]
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someDateTime: DateTimeScalarFilters
              someDateTime_EQ: DateTime
              someDateTime_GT: DateTime
              someDateTime_GTE: DateTime
              someDateTime_IN: [DateTime]
              someDateTime_LT: DateTime
              someDateTime_LTE: DateTime
              someDuration: DurationScalarFilters
              someDuration_EQ: Duration
              someDuration_GT: Duration
              someDuration_GTE: Duration
              someDuration_IN: [Duration]
              someDuration_LT: Duration
              someDuration_LTE: Duration
              someFloat: FloatScalarFilters
              someFloat_EQ: Float
              someFloat_GT: Float
              someFloat_GTE: Float
              someFloat_IN: [Float]
              someFloat_LT: Float
              someFloat_LTE: Float
              someId: IDScalarFilters
              someId_CONTAINS: ID
              someId_ENDS_WITH: ID
              someId_EQ: ID
              someId_IN: [ID]
              someId_STARTS_WITH: ID
              someInt: IntScalarFilters
              someInt_EQ: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_IN: [Int]
              someInt_LT: Int
              someInt_LTE: Int
              someLocalDateTime: LocalDateTimeScalarFilters
              someLocalDateTime_EQ: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_IN: [LocalDateTime]
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalTime: LocalTimeScalarFilters
              someLocalTime_EQ: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_IN: [LocalTime]
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someString: StringScalarFilters
              someString_CONTAINS: String
              someString_ENDS_WITH: String
              someString_EQ: String
              someString_IN: [String]
              someString_STARTS_WITH: String
              someTime: TimeScalarFilters
              someTime_EQ: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_IN: [Time]
              someTime_LT: Time
              someTime_LTE: Time
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
