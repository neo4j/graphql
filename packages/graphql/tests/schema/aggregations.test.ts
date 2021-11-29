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
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../src";

describe("Aggregations", () => {
    test("Top Level Aggregations", () => {
        const typeDefs = gql`
            type Movie {
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
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            \\"\\"\\"A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.\\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelectionNullable {
              average: BigInt
              max: BigInt
              min: BigInt
              sum: BigInt
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelectionNullable {
              max: DateTime
              min: DateTime
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            type DurationAggregateSelectionNullable {
              max: Duration
              min: Duration
            }

            type FloatAggregateSelectionNullable {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelectionNullable {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            type LocalDateTimeAggregateSelectionNullable {
              max: LocalDateTime
              min: LocalDateTime
            }

            \\"\\"\\"A local time, represented as a time string without timezone information\\"\\"\\"
            scalar LocalTime

            type LocalTimeAggregateSelectionNullable {
              max: LocalTime
              min: LocalTime
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
              createdAt: DateTimeAggregateSelectionNullable!
              id: IDAggregateSelectionNullable!
              imdbRating: FloatAggregateSelectionNullable!
              isbn: StringAggregateSelectionNonNullable!
              screenTime: DurationAggregateSelectionNullable!
              someBigInt: BigIntAggregateSelectionNullable!
              someInt: IntAggregateSelectionNullable!
              someLocalDateTime: LocalDateTimeAggregateSelectionNullable!
              someLocalTime: LocalTimeAggregateSelectionNullable!
              someTime: TimeAggregateSelectionNullable!
              title: StringAggregateSelectionNullable!
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

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
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

            type MovieSubscriptionResponse {
              id: Int!
              movie: Movie
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              toID: String
              toName: String
              type: String!
            }

            input MovieUpdateInput {
              createdAt: DateTime
              id: ID
              imdbRating: Float
              isbn: String
              screenTime: Duration
              someBigInt: BigInt
              someInt: Int
              someLocalDateTime: LocalDateTime
              someLocalTime: LocalTime
              someTime: Time
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              createdAt: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              createdAt_NOT: DateTime
              createdAt_NOT_IN: [DateTime]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
              imdbRating: Float
              imdbRating_GT: Float
              imdbRating_GTE: Float
              imdbRating_IN: [Float]
              imdbRating_LT: Float
              imdbRating_LTE: Float
              imdbRating_NOT: Float
              imdbRating_NOT_IN: [Float]
              isbn: String
              isbn_CONTAINS: String
              isbn_ENDS_WITH: String
              isbn_IN: [String]
              isbn_NOT: String
              isbn_NOT_CONTAINS: String
              isbn_NOT_ENDS_WITH: String
              isbn_NOT_IN: [String]
              isbn_NOT_STARTS_WITH: String
              isbn_STARTS_WITH: String
              screenTime: Duration
              screenTime_GT: Duration
              screenTime_GTE: Duration
              screenTime_IN: [Duration]
              screenTime_LT: Duration
              screenTime_LTE: Duration
              screenTime_NOT: Duration
              screenTime_NOT_IN: [Duration]
              someBigInt: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_IN: [BigInt]
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someBigInt_NOT: BigInt
              someBigInt_NOT_IN: [BigInt]
              someInt: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_IN: [Int]
              someInt_LT: Int
              someInt_LTE: Int
              someInt_NOT: Int
              someInt_NOT_IN: [Int]
              someLocalDateTime: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_IN: [LocalDateTime]
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalDateTime_NOT: LocalDateTime
              someLocalDateTime_NOT_IN: [LocalDateTime]
              someLocalTime: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_IN: [LocalTime]
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someLocalTime_NOT: LocalTime
              someLocalTime_NOT_IN: [LocalTime]
              someTime: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_IN: [Time]
              someTime_LT: Time
              someTime_LTE: Time
              someTime_NOT: Time
              someTime_NOT_IN: [Time]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            enum NodeUpdatedType {
              Connected
              Created
              Deleted
              Disconnected
              Updated
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesCount(where: MovieWhere): Int!
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

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type Subscription {
              \\"\\"\\"Subscribe to updates from Movie\\"\\"\\"
              subscribeToMovie(filter: SubscriptionFilter, where: MovieWhere): MovieSubscriptionResponse!
            }

            input SubscriptionFilter {
              handle: String
              handle_IN: [String!]
              handle_NOT: String
              handle_NOT_IN: [String!]
              handle_UNDEFINED: Boolean
              id: Int
              id_IN: [Int!]
              id_NOT: Int
              id_NOT_IN: [Int!]
              id_UNDEFINED: Boolean
              propsUpdated: [String!]
              relationshipID: Int
              relationshipID_IN: [Int!]
              relationshipID_NOT: Int
              relationshipID_NOT_IN: [Int!]
              relationshipID_UNDEFINED: Boolean
              relationshipName: String
              relationshipName_IN: [String!]
              relationshipName_NOT: String
              relationshipName_NOT_IN: [String!]
              relationshipName_UNDEFINED: Boolean
              toID: Int
              toID_IN: [Int!]
              toID_NOT: Int
              toID_NOT_IN: [Int!]
              toID_UNDEFINED: Boolean
              toName: String
              toName_IN: [String!]
              toName_NOT: String
              toName_NOT_IN: [String!]
              toName_UNDEFINED: Boolean
              type: NodeUpdatedType
              type_IN: [NodeUpdatedType!]
              type_NOT: NodeUpdatedType
              type_NOT_IN: [NodeUpdatedType!]
              type_UNDEFINED: Boolean
            }

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            type TimeAggregateSelectionNullable {
              max: Time
              min: Time
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }
            "
        `);
    });

    test("Where Level Aggregations", () => {
        const typeDefs = gql`
            type User {
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

            type Post {
                title: String
                likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
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
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            \\"\\"\\"A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.\\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelectionNullable {
              average: BigInt
              max: BigInt
              min: BigInt
              sum: BigInt
            }

            type CreateInfo {
              bookmark: String
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

            type DateTimeAggregateSelectionNullable {
              max: DateTime
              min: DateTime
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            type DurationAggregateSelectionNullable {
              max: Duration
              min: Duration
            }

            type FloatAggregateSelectionNullable {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelectionNullable {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            interface Likes {
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

            input LikesWhere {
              AND: [LikesWhere!]
              OR: [LikesWhere!]
              someBigInt: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_IN: [BigInt]
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someBigInt_NOT: BigInt
              someBigInt_NOT_IN: [BigInt]
              someDateTime: DateTime
              someDateTime_GT: DateTime
              someDateTime_GTE: DateTime
              someDateTime_IN: [DateTime]
              someDateTime_LT: DateTime
              someDateTime_LTE: DateTime
              someDateTime_NOT: DateTime
              someDateTime_NOT_IN: [DateTime]
              someDuration: Duration
              someDuration_GT: Duration
              someDuration_GTE: Duration
              someDuration_IN: [Duration]
              someDuration_LT: Duration
              someDuration_LTE: Duration
              someDuration_NOT: Duration
              someDuration_NOT_IN: [Duration]
              someFloat: Float
              someFloat_GT: Float
              someFloat_GTE: Float
              someFloat_IN: [Float]
              someFloat_LT: Float
              someFloat_LTE: Float
              someFloat_NOT: Float
              someFloat_NOT_IN: [Float]
              someId: ID
              someId_CONTAINS: ID
              someId_ENDS_WITH: ID
              someId_IN: [ID]
              someId_NOT: ID
              someId_NOT_CONTAINS: ID
              someId_NOT_ENDS_WITH: ID
              someId_NOT_IN: [ID]
              someId_NOT_STARTS_WITH: ID
              someId_STARTS_WITH: ID
              someInt: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_IN: [Int]
              someInt_LT: Int
              someInt_LTE: Int
              someInt_NOT: Int
              someInt_NOT_IN: [Int]
              someLocalDateTime: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_IN: [LocalDateTime]
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalDateTime_NOT: LocalDateTime
              someLocalDateTime_NOT_IN: [LocalDateTime]
              someLocalTime: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_IN: [LocalTime]
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someLocalTime_NOT: LocalTime
              someLocalTime_NOT_IN: [LocalTime]
              someString: String
              someString_CONTAINS: String
              someString_ENDS_WITH: String
              someString_IN: [String]
              someString_NOT: String
              someString_NOT_CONTAINS: String
              someString_NOT_ENDS_WITH: String
              someString_NOT_IN: [String]
              someString_NOT_STARTS_WITH: String
              someString_STARTS_WITH: String
              someTime: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_IN: [Time]
              someTime_LT: Time
              someTime_LTE: Time
              someTime_NOT: Time
              someTime_NOT_IN: [Time]
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            type LocalDateTimeAggregateSelectionNullable {
              max: LocalDateTime
              min: LocalDateTime
            }

            \\"\\"\\"A local time, represented as a time string without timezone information\\"\\"\\"
            scalar LocalTime

            type LocalTimeAggregateSelectionNullable {
              max: LocalTime
              min: LocalTime
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(where: UserWhere): DeleteInfo!
              updatePosts(connect: PostConnectInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            enum NodeUpdatedType {
              Connected
              Created
              Deleted
              Disconnected
              Updated
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              likes(options: UserOptions, where: UserWhere): [User]
              likesAggregate(where: UserWhere): PostUserLikesAggregationSelection
              likesConnection(after: String, first: Int, sort: [PostLikesConnectionSort!], where: PostLikesConnectionWhere): PostLikesConnection!
              title: String
            }

            type PostAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNullable!
            }

            input PostConnectInput {
              likes: [PostLikesConnectFieldInput!]
            }

            input PostCreateInput {
              likes: PostLikesFieldInput
              title: String
            }

            input PostDeleteInput {
              likes: [PostLikesDeleteFieldInput!]
            }

            input PostDisconnectInput {
              likes: [PostLikesDisconnectFieldInput!]
            }

            input PostLikesAggregateInput {
              AND: [PostLikesAggregateInput!]
              OR: [PostLikesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: PostLikesEdgeAggregationWhereInput
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

            input PostLikesConnectionSort {
              edge: LikesSort
              node: UserSort
            }

            input PostLikesConnectionWhere {
              AND: [PostLikesConnectionWhere!]
              OR: [PostLikesConnectionWhere!]
              edge: LikesWhere
              edge_NOT: LikesWhere
              node: UserWhere
              node_NOT: UserWhere
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

            input PostLikesEdgeAggregationWhereInput {
              AND: [PostLikesEdgeAggregationWhereInput!]
              OR: [PostLikesEdgeAggregationWhereInput!]
              someBigInt_AVERAGE_EQUAL: BigInt
              someBigInt_AVERAGE_GT: BigInt
              someBigInt_AVERAGE_GTE: BigInt
              someBigInt_AVERAGE_LT: BigInt
              someBigInt_AVERAGE_LTE: BigInt
              someBigInt_EQUAL: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someBigInt_MAX_EQUAL: BigInt
              someBigInt_MAX_GT: BigInt
              someBigInt_MAX_GTE: BigInt
              someBigInt_MAX_LT: BigInt
              someBigInt_MAX_LTE: BigInt
              someBigInt_MIN_EQUAL: BigInt
              someBigInt_MIN_GT: BigInt
              someBigInt_MIN_GTE: BigInt
              someBigInt_MIN_LT: BigInt
              someBigInt_MIN_LTE: BigInt
              someBigInt_SUM_EQUAL: BigInt
              someBigInt_SUM_GT: BigInt
              someBigInt_SUM_GTE: BigInt
              someBigInt_SUM_LT: BigInt
              someBigInt_SUM_LTE: BigInt
              someDateTime_EQUAL: DateTime
              someDateTime_GT: DateTime
              someDateTime_GTE: DateTime
              someDateTime_LT: DateTime
              someDateTime_LTE: DateTime
              someDateTime_MAX_EQUAL: DateTime
              someDateTime_MAX_GT: DateTime
              someDateTime_MAX_GTE: DateTime
              someDateTime_MAX_LT: DateTime
              someDateTime_MAX_LTE: DateTime
              someDateTime_MIN_EQUAL: DateTime
              someDateTime_MIN_GT: DateTime
              someDateTime_MIN_GTE: DateTime
              someDateTime_MIN_LT: DateTime
              someDateTime_MIN_LTE: DateTime
              someDuration_AVERAGE_EQUAL: Duration
              someDuration_AVERAGE_GT: Duration
              someDuration_AVERAGE_GTE: Duration
              someDuration_AVERAGE_LT: Duration
              someDuration_AVERAGE_LTE: Duration
              someDuration_EQUAL: Duration
              someDuration_GT: Duration
              someDuration_GTE: Duration
              someDuration_LT: Duration
              someDuration_LTE: Duration
              someDuration_MAX_EQUAL: Duration
              someDuration_MAX_GT: Duration
              someDuration_MAX_GTE: Duration
              someDuration_MAX_LT: Duration
              someDuration_MAX_LTE: Duration
              someDuration_MIN_EQUAL: Duration
              someDuration_MIN_GT: Duration
              someDuration_MIN_GTE: Duration
              someDuration_MIN_LT: Duration
              someDuration_MIN_LTE: Duration
              someFloat_AVERAGE_EQUAL: Float
              someFloat_AVERAGE_GT: Float
              someFloat_AVERAGE_GTE: Float
              someFloat_AVERAGE_LT: Float
              someFloat_AVERAGE_LTE: Float
              someFloat_EQUAL: Float
              someFloat_GT: Float
              someFloat_GTE: Float
              someFloat_LT: Float
              someFloat_LTE: Float
              someFloat_MAX_EQUAL: Float
              someFloat_MAX_GT: Float
              someFloat_MAX_GTE: Float
              someFloat_MAX_LT: Float
              someFloat_MAX_LTE: Float
              someFloat_MIN_EQUAL: Float
              someFloat_MIN_GT: Float
              someFloat_MIN_GTE: Float
              someFloat_MIN_LT: Float
              someFloat_MIN_LTE: Float
              someFloat_SUM_EQUAL: Float
              someFloat_SUM_GT: Float
              someFloat_SUM_GTE: Float
              someFloat_SUM_LT: Float
              someFloat_SUM_LTE: Float
              someId_EQUAL: ID
              someInt_AVERAGE_EQUAL: Float
              someInt_AVERAGE_GT: Float
              someInt_AVERAGE_GTE: Float
              someInt_AVERAGE_LT: Float
              someInt_AVERAGE_LTE: Float
              someInt_EQUAL: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_LT: Int
              someInt_LTE: Int
              someInt_MAX_EQUAL: Int
              someInt_MAX_GT: Int
              someInt_MAX_GTE: Int
              someInt_MAX_LT: Int
              someInt_MAX_LTE: Int
              someInt_MIN_EQUAL: Int
              someInt_MIN_GT: Int
              someInt_MIN_GTE: Int
              someInt_MIN_LT: Int
              someInt_MIN_LTE: Int
              someInt_SUM_EQUAL: Int
              someInt_SUM_GT: Int
              someInt_SUM_GTE: Int
              someInt_SUM_LT: Int
              someInt_SUM_LTE: Int
              someLocalDateTime_EQUAL: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalDateTime_MAX_EQUAL: LocalDateTime
              someLocalDateTime_MAX_GT: LocalDateTime
              someLocalDateTime_MAX_GTE: LocalDateTime
              someLocalDateTime_MAX_LT: LocalDateTime
              someLocalDateTime_MAX_LTE: LocalDateTime
              someLocalDateTime_MIN_EQUAL: LocalDateTime
              someLocalDateTime_MIN_GT: LocalDateTime
              someLocalDateTime_MIN_GTE: LocalDateTime
              someLocalDateTime_MIN_LT: LocalDateTime
              someLocalDateTime_MIN_LTE: LocalDateTime
              someLocalTime_EQUAL: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someLocalTime_MAX_EQUAL: LocalTime
              someLocalTime_MAX_GT: LocalTime
              someLocalTime_MAX_GTE: LocalTime
              someLocalTime_MAX_LT: LocalTime
              someLocalTime_MAX_LTE: LocalTime
              someLocalTime_MIN_EQUAL: LocalTime
              someLocalTime_MIN_GT: LocalTime
              someLocalTime_MIN_GTE: LocalTime
              someLocalTime_MIN_LT: LocalTime
              someLocalTime_MIN_LTE: LocalTime
              someString_AVERAGE_EQUAL: Float
              someString_AVERAGE_GT: Float
              someString_AVERAGE_GTE: Float
              someString_AVERAGE_LT: Float
              someString_AVERAGE_LTE: Float
              someString_EQUAL: String
              someString_GT: Int
              someString_GTE: Int
              someString_LONGEST_EQUAL: Int
              someString_LONGEST_GT: Int
              someString_LONGEST_GTE: Int
              someString_LONGEST_LT: Int
              someString_LONGEST_LTE: Int
              someString_LT: Int
              someString_LTE: Int
              someString_SHORTEST_EQUAL: Int
              someString_SHORTEST_GT: Int
              someString_SHORTEST_GTE: Int
              someString_SHORTEST_LT: Int
              someString_SHORTEST_LTE: Int
              someTime_EQUAL: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_LT: Time
              someTime_LTE: Time
              someTime_MAX_EQUAL: Time
              someTime_MAX_GT: Time
              someTime_MAX_GTE: Time
              someTime_MAX_LT: Time
              someTime_MAX_LTE: Time
              someTime_MIN_EQUAL: Time
              someTime_MIN_GT: Time
              someTime_MIN_GTE: Time
              someTime_MIN_LT: Time
              someTime_MIN_LTE: Time
            }

            input PostLikesFieldInput {
              connect: [PostLikesConnectFieldInput!]
              create: [PostLikesCreateFieldInput!]
            }

            input PostLikesNodeAggregationWhereInput {
              AND: [PostLikesNodeAggregationWhereInput!]
              OR: [PostLikesNodeAggregationWhereInput!]
              someBigInt_AVERAGE_EQUAL: BigInt
              someBigInt_AVERAGE_GT: BigInt
              someBigInt_AVERAGE_GTE: BigInt
              someBigInt_AVERAGE_LT: BigInt
              someBigInt_AVERAGE_LTE: BigInt
              someBigInt_EQUAL: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someBigInt_MAX_EQUAL: BigInt
              someBigInt_MAX_GT: BigInt
              someBigInt_MAX_GTE: BigInt
              someBigInt_MAX_LT: BigInt
              someBigInt_MAX_LTE: BigInt
              someBigInt_MIN_EQUAL: BigInt
              someBigInt_MIN_GT: BigInt
              someBigInt_MIN_GTE: BigInt
              someBigInt_MIN_LT: BigInt
              someBigInt_MIN_LTE: BigInt
              someBigInt_SUM_EQUAL: BigInt
              someBigInt_SUM_GT: BigInt
              someBigInt_SUM_GTE: BigInt
              someBigInt_SUM_LT: BigInt
              someBigInt_SUM_LTE: BigInt
              someDateTime_EQUAL: DateTime
              someDateTime_GT: DateTime
              someDateTime_GTE: DateTime
              someDateTime_LT: DateTime
              someDateTime_LTE: DateTime
              someDateTime_MAX_EQUAL: DateTime
              someDateTime_MAX_GT: DateTime
              someDateTime_MAX_GTE: DateTime
              someDateTime_MAX_LT: DateTime
              someDateTime_MAX_LTE: DateTime
              someDateTime_MIN_EQUAL: DateTime
              someDateTime_MIN_GT: DateTime
              someDateTime_MIN_GTE: DateTime
              someDateTime_MIN_LT: DateTime
              someDateTime_MIN_LTE: DateTime
              someDuration_AVERAGE_EQUAL: Duration
              someDuration_AVERAGE_GT: Duration
              someDuration_AVERAGE_GTE: Duration
              someDuration_AVERAGE_LT: Duration
              someDuration_AVERAGE_LTE: Duration
              someDuration_EQUAL: Duration
              someDuration_GT: Duration
              someDuration_GTE: Duration
              someDuration_LT: Duration
              someDuration_LTE: Duration
              someDuration_MAX_EQUAL: Duration
              someDuration_MAX_GT: Duration
              someDuration_MAX_GTE: Duration
              someDuration_MAX_LT: Duration
              someDuration_MAX_LTE: Duration
              someDuration_MIN_EQUAL: Duration
              someDuration_MIN_GT: Duration
              someDuration_MIN_GTE: Duration
              someDuration_MIN_LT: Duration
              someDuration_MIN_LTE: Duration
              someFloat_AVERAGE_EQUAL: Float
              someFloat_AVERAGE_GT: Float
              someFloat_AVERAGE_GTE: Float
              someFloat_AVERAGE_LT: Float
              someFloat_AVERAGE_LTE: Float
              someFloat_EQUAL: Float
              someFloat_GT: Float
              someFloat_GTE: Float
              someFloat_LT: Float
              someFloat_LTE: Float
              someFloat_MAX_EQUAL: Float
              someFloat_MAX_GT: Float
              someFloat_MAX_GTE: Float
              someFloat_MAX_LT: Float
              someFloat_MAX_LTE: Float
              someFloat_MIN_EQUAL: Float
              someFloat_MIN_GT: Float
              someFloat_MIN_GTE: Float
              someFloat_MIN_LT: Float
              someFloat_MIN_LTE: Float
              someFloat_SUM_EQUAL: Float
              someFloat_SUM_GT: Float
              someFloat_SUM_GTE: Float
              someFloat_SUM_LT: Float
              someFloat_SUM_LTE: Float
              someId_EQUAL: ID
              someInt_AVERAGE_EQUAL: Float
              someInt_AVERAGE_GT: Float
              someInt_AVERAGE_GTE: Float
              someInt_AVERAGE_LT: Float
              someInt_AVERAGE_LTE: Float
              someInt_EQUAL: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_LT: Int
              someInt_LTE: Int
              someInt_MAX_EQUAL: Int
              someInt_MAX_GT: Int
              someInt_MAX_GTE: Int
              someInt_MAX_LT: Int
              someInt_MAX_LTE: Int
              someInt_MIN_EQUAL: Int
              someInt_MIN_GT: Int
              someInt_MIN_GTE: Int
              someInt_MIN_LT: Int
              someInt_MIN_LTE: Int
              someInt_SUM_EQUAL: Int
              someInt_SUM_GT: Int
              someInt_SUM_GTE: Int
              someInt_SUM_LT: Int
              someInt_SUM_LTE: Int
              someLocalDateTime_EQUAL: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalDateTime_MAX_EQUAL: LocalDateTime
              someLocalDateTime_MAX_GT: LocalDateTime
              someLocalDateTime_MAX_GTE: LocalDateTime
              someLocalDateTime_MAX_LT: LocalDateTime
              someLocalDateTime_MAX_LTE: LocalDateTime
              someLocalDateTime_MIN_EQUAL: LocalDateTime
              someLocalDateTime_MIN_GT: LocalDateTime
              someLocalDateTime_MIN_GTE: LocalDateTime
              someLocalDateTime_MIN_LT: LocalDateTime
              someLocalDateTime_MIN_LTE: LocalDateTime
              someLocalTime_EQUAL: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someLocalTime_MAX_EQUAL: LocalTime
              someLocalTime_MAX_GT: LocalTime
              someLocalTime_MAX_GTE: LocalTime
              someLocalTime_MAX_LT: LocalTime
              someLocalTime_MAX_LTE: LocalTime
              someLocalTime_MIN_EQUAL: LocalTime
              someLocalTime_MIN_GT: LocalTime
              someLocalTime_MIN_GTE: LocalTime
              someLocalTime_MIN_LT: LocalTime
              someLocalTime_MIN_LTE: LocalTime
              someString_AVERAGE_EQUAL: Float
              someString_AVERAGE_GT: Float
              someString_AVERAGE_GTE: Float
              someString_AVERAGE_LT: Float
              someString_AVERAGE_LTE: Float
              someString_EQUAL: String
              someString_GT: Int
              someString_GTE: Int
              someString_LONGEST_EQUAL: Int
              someString_LONGEST_GT: Int
              someString_LONGEST_GTE: Int
              someString_LONGEST_LT: Int
              someString_LONGEST_LTE: Int
              someString_LT: Int
              someString_LTE: Int
              someString_SHORTEST_EQUAL: Int
              someString_SHORTEST_GT: Int
              someString_SHORTEST_GTE: Int
              someString_SHORTEST_LT: Int
              someString_SHORTEST_LTE: Int
              someTime_EQUAL: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_LT: Time
              someTime_LTE: Time
              someTime_MAX_EQUAL: Time
              someTime_MAX_GT: Time
              someTime_MAX_GTE: Time
              someTime_MAX_LT: Time
              someTime_MAX_LTE: Time
              someTime_MIN_EQUAL: Time
              someTime_MIN_GT: Time
              someTime_MIN_GTE: Time
              someTime_MIN_LT: Time
              someTime_MIN_LTE: Time
            }

            type PostLikesRelationship implements Likes {
              cursor: String!
              node: User!
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

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [PostSort]
            }

            input PostRelationInput {
              likes: [PostLikesCreateFieldInput!]
            }

            \\"\\"\\"Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.\\"\\"\\"
            input PostSort {
              title: SortDirection
            }

            type PostSubscriptionResponse {
              id: Int!
              name: String!
              post: Post
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              toID: String
              toName: String
              type: String!
            }

            input PostUpdateInput {
              likes: [PostLikesUpdateFieldInput!]
              title: String
            }

            type PostUserLikesAggregationSelection {
              count: Int!
              edge: PostUserLikesEdgeAggregateSelection
              node: PostUserLikesNodeAggregateSelection
            }

            type PostUserLikesEdgeAggregateSelection {
              someBigInt: BigIntAggregateSelectionNullable!
              someDateTime: DateTimeAggregateSelectionNullable!
              someDuration: DurationAggregateSelectionNullable!
              someFloat: FloatAggregateSelectionNullable!
              someId: IDAggregateSelectionNullable!
              someInt: IntAggregateSelectionNullable!
              someLocalDateTime: LocalDateTimeAggregateSelectionNullable!
              someLocalTime: LocalTimeAggregateSelectionNullable!
              someString: StringAggregateSelectionNullable!
              someTime: TimeAggregateSelectionNullable!
            }

            type PostUserLikesNodeAggregateSelection {
              someBigInt: BigIntAggregateSelectionNullable!
              someDateTime: DateTimeAggregateSelectionNullable!
              someDuration: DurationAggregateSelectionNullable!
              someFloat: FloatAggregateSelectionNullable!
              someId: IDAggregateSelectionNullable!
              someInt: IntAggregateSelectionNullable!
              someLocalDateTime: LocalDateTimeAggregateSelectionNullable!
              someLocalTime: LocalTimeAggregateSelectionNullable!
              someString: StringAggregateSelectionNullable!
              someTime: TimeAggregateSelectionNullable!
            }

            input PostWhere {
              AND: [PostWhere!]
              OR: [PostWhere!]
              likes: UserWhere
              likesAggregate: PostLikesAggregateInput
              likesConnection: PostLikesConnectionWhere
              likesConnection_NOT: PostLikesConnectionWhere
              likes_NOT: UserWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsCount(where: PostWhere): Int!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersCount(where: UserWhere): Int!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type Subscription {
              \\"\\"\\"Subscribe to updates from Post\\"\\"\\"
              subscribeToPost(filter: SubscriptionFilter, where: PostWhere): PostSubscriptionResponse!
              \\"\\"\\"Subscribe to updates from User\\"\\"\\"
              subscribeToUser(filter: SubscriptionFilter, where: UserWhere): UserSubscriptionResponse!
            }

            input SubscriptionFilter {
              handle: String
              handle_IN: [String!]
              handle_NOT: String
              handle_NOT_IN: [String!]
              handle_UNDEFINED: Boolean
              id: Int
              id_IN: [Int!]
              id_NOT: Int
              id_NOT_IN: [Int!]
              id_UNDEFINED: Boolean
              propsUpdated: [String!]
              relationshipID: Int
              relationshipID_IN: [Int!]
              relationshipID_NOT: Int
              relationshipID_NOT_IN: [Int!]
              relationshipID_UNDEFINED: Boolean
              relationshipName: String
              relationshipName_IN: [String!]
              relationshipName_NOT: String
              relationshipName_NOT_IN: [String!]
              relationshipName_UNDEFINED: Boolean
              toID: Int
              toID_IN: [Int!]
              toID_NOT: Int
              toID_NOT_IN: [Int!]
              toID_UNDEFINED: Boolean
              toName: String
              toName_IN: [String!]
              toName_NOT: String
              toName_NOT_IN: [String!]
              toName_UNDEFINED: Boolean
              type: NodeUpdatedType
              type_IN: [NodeUpdatedType!]
              type_NOT: NodeUpdatedType
              type_NOT_IN: [NodeUpdatedType!]
              type_UNDEFINED: Boolean
            }

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            type TimeAggregateSelectionNullable {
              max: Time
              min: Time
            }

            type UpdateInfo {
              bookmark: String
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
              someBigInt: BigIntAggregateSelectionNullable!
              someDateTime: DateTimeAggregateSelectionNullable!
              someDuration: DurationAggregateSelectionNullable!
              someFloat: FloatAggregateSelectionNullable!
              someId: IDAggregateSelectionNullable!
              someInt: IntAggregateSelectionNullable!
              someLocalDateTime: LocalDateTimeAggregateSelectionNullable!
              someLocalTime: LocalTimeAggregateSelectionNullable!
              someString: StringAggregateSelectionNullable!
              someTime: TimeAggregateSelectionNullable!
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

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [UserSort]
            }

            \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
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

            type UserSubscriptionResponse {
              id: Int!
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              toID: String
              toName: String
              type: String!
              user: User
            }

            input UserUpdateInput {
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

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
              someBigInt: BigInt
              someBigInt_GT: BigInt
              someBigInt_GTE: BigInt
              someBigInt_IN: [BigInt]
              someBigInt_LT: BigInt
              someBigInt_LTE: BigInt
              someBigInt_NOT: BigInt
              someBigInt_NOT_IN: [BigInt]
              someDateTime: DateTime
              someDateTime_GT: DateTime
              someDateTime_GTE: DateTime
              someDateTime_IN: [DateTime]
              someDateTime_LT: DateTime
              someDateTime_LTE: DateTime
              someDateTime_NOT: DateTime
              someDateTime_NOT_IN: [DateTime]
              someDuration: Duration
              someDuration_GT: Duration
              someDuration_GTE: Duration
              someDuration_IN: [Duration]
              someDuration_LT: Duration
              someDuration_LTE: Duration
              someDuration_NOT: Duration
              someDuration_NOT_IN: [Duration]
              someFloat: Float
              someFloat_GT: Float
              someFloat_GTE: Float
              someFloat_IN: [Float]
              someFloat_LT: Float
              someFloat_LTE: Float
              someFloat_NOT: Float
              someFloat_NOT_IN: [Float]
              someId: ID
              someId_CONTAINS: ID
              someId_ENDS_WITH: ID
              someId_IN: [ID]
              someId_NOT: ID
              someId_NOT_CONTAINS: ID
              someId_NOT_ENDS_WITH: ID
              someId_NOT_IN: [ID]
              someId_NOT_STARTS_WITH: ID
              someId_STARTS_WITH: ID
              someInt: Int
              someInt_GT: Int
              someInt_GTE: Int
              someInt_IN: [Int]
              someInt_LT: Int
              someInt_LTE: Int
              someInt_NOT: Int
              someInt_NOT_IN: [Int]
              someLocalDateTime: LocalDateTime
              someLocalDateTime_GT: LocalDateTime
              someLocalDateTime_GTE: LocalDateTime
              someLocalDateTime_IN: [LocalDateTime]
              someLocalDateTime_LT: LocalDateTime
              someLocalDateTime_LTE: LocalDateTime
              someLocalDateTime_NOT: LocalDateTime
              someLocalDateTime_NOT_IN: [LocalDateTime]
              someLocalTime: LocalTime
              someLocalTime_GT: LocalTime
              someLocalTime_GTE: LocalTime
              someLocalTime_IN: [LocalTime]
              someLocalTime_LT: LocalTime
              someLocalTime_LTE: LocalTime
              someLocalTime_NOT: LocalTime
              someLocalTime_NOT_IN: [LocalTime]
              someString: String
              someString_CONTAINS: String
              someString_ENDS_WITH: String
              someString_IN: [String]
              someString_NOT: String
              someString_NOT_CONTAINS: String
              someString_NOT_ENDS_WITH: String
              someString_NOT_IN: [String]
              someString_NOT_STARTS_WITH: String
              someString_STARTS_WITH: String
              someTime: Time
              someTime_GT: Time
              someTime_GTE: Time
              someTime_IN: [Time]
              someTime_LT: Time
              someTime_LTE: Time
              someTime_NOT: Time
              someTime_NOT_IN: [Time]
            }
            "
        `);
    });
});
