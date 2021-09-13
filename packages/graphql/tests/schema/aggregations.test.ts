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
    test("Aggregations", () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                title: String
                createdAt: DateTime
                someTime: Time
                someLocalTime: LocalTime
                someLocalDateTime: LocalDateTime
                imdbRating: Float
                someInt: Int
                someBigInt: BigInt
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Query {
                movies(where: MovieWhere, options: MovieOptions): [Movie!]!
                moviesCount(where: MovieWhere): Int!
                moviesAggregate(where: MovieWhere): MovieAggregateSelection!
            }

            type Mutation {
                createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                deleteMovies(where: MovieWhere): DeleteInfo!
                updateMovies(
                    where: MovieWhere
                    update: MovieUpdateInput
                ): UpdateMoviesMutationResponse!
            }

            """
            A date and time, represented as an ISO-8601 string
            """
            scalar DateTime

            """
            A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'
            """
            scalar LocalDateTime

            """
            A local time, represented as a time string without timezone information
            """
            scalar LocalTime

            """
            A time, represented as an RFC3339 time string
            """
            scalar Time

            """
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            """
            scalar BigInt

            enum SortDirection {
                """
                Sort by field values in ascending order.
                """
                ASC
                """
                Sort by field values in descending order.
                """
                DESC
            }

            type CreateInfo {
                bookmark: String
                nodesCreated: Int!
                relationshipsCreated: Int!
            }
            
            type DateTimeAggregationSelection {
                max: DateTime!
                min: DateTime!
            }

            type FloatAggregationSelection {
                average: Float!
                max: Float!
                min: Float!
            }

            type IntAggregationSelection {
                average: Float!
                max: Int!
                min: Int!
            }

            type StringAggregationSelection {
                shortest: String!
                longest: String!
            }

            type BigIntAggregationSelection {
                average: Float!
                max: BigInt!
                min: BigInt!
            }

            type IDAggregationSelection {
                shortest: ID!
                longest: ID!
            }

            type LocalDateTimeAggregationSelection {
                max: LocalDateTime!
                min: LocalDateTime!
            }

            type LocalTimeAggregationSelection {
                max: LocalTime!
                min: LocalTime!
            }

            type TimeAggregationSelection {
                max: Time!
                min: Time!
            }

            type MovieAggregateSelection {
                count: Int!
                createdAt: DateTimeAggregationSelection!
                id: IDAggregationSelection!
                imdbRating: FloatAggregationSelection!
                someBigInt: BigIntAggregationSelection!
                someInt: IntAggregationSelection!
                title: StringAggregationSelection!
                someLocalDateTime: LocalDateTimeAggregationSelection!
                someLocalTime: LocalTimeAggregationSelection!
                someTime: TimeAggregationSelection!
            }

            type CreateMoviesMutationResponse {
                info: CreateInfo!
                movies: [Movie!]!
            }

            type DeleteInfo {
                bookmark: String
                nodesDeleted: Int!
                relationshipsDeleted: Int!
            }

            type UpdateInfo {
                bookmark: String
                nodesCreated: Int!
                nodesDeleted: Int!
                relationshipsCreated: Int!
                relationshipsDeleted: Int!
            }

            type Movie {
                id: ID
                title: String
                imdbRating: Float
                someInt: Int
                someBigInt: BigInt
                createdAt: DateTime
                someLocalDateTime: LocalDateTime
                someLocalTime: LocalTime
                someTime: Time
            }

            type UpdateMoviesMutationResponse {
                info: UpdateInfo!
                movies: [Movie!]!
            }

            input MovieCreateInput {
                id: ID
                title: String
                imdbRating: Float
                someInt: Int
                someBigInt: BigInt
                createdAt: DateTime
                someLocalDateTime: LocalDateTime
                someLocalTime: LocalTime
                someTime: Time
            }

            input MovieOptions {
                """
                Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                """
                sort: [MovieSort]
                limit: Int
                offset: Int
            }

            """
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            """
            input MovieSort {
                id: SortDirection
                title: SortDirection
                imdbRating: SortDirection
                someInt: SortDirection
                someBigInt: SortDirection
                createdAt: SortDirection
                someLocalDateTime: SortDirection
                someLocalTime: SortDirection
                someTime: SortDirection
            }

            input MovieUpdateInput {
                id: ID
                title: String
                imdbRating: Float
                someInt: Int
                someBigInt: BigInt
                createdAt: DateTime
                someLocalDateTime: LocalDateTime
                someLocalTime: LocalTime
                someTime: Time
            }

            input MovieWhere {
                OR: [MovieWhere!]
                AND: [MovieWhere!]
                id: ID
                id_NOT: ID
                id_IN: [ID]
                id_NOT_IN: [ID]
                id_CONTAINS: ID
                id_NOT_CONTAINS: ID
                id_STARTS_WITH: ID
                id_NOT_STARTS_WITH: ID
                id_ENDS_WITH: ID
                id_NOT_ENDS_WITH: ID
                title: String
                title_NOT: String
                title_IN: [String]
                title_NOT_IN: [String]
                title_CONTAINS: String
                title_NOT_CONTAINS: String
                title_STARTS_WITH: String
                title_NOT_STARTS_WITH: String
                title_ENDS_WITH: String
                title_NOT_ENDS_WITH: String
                imdbRating: Float
                imdbRating_NOT: Float
                imdbRating_IN: [Float]
                imdbRating_NOT_IN: [Float]
                imdbRating_LT: Float
                imdbRating_LTE: Float
                imdbRating_GT: Float
                imdbRating_GTE: Float
                someInt: Int
                someInt_NOT: Int
                someInt_IN: [Int]
                someInt_NOT_IN: [Int]
                someInt_LT: Int
                someInt_LTE: Int
                someInt_GT: Int
                someInt_GTE: Int
                someBigInt: BigInt
                someBigInt_NOT: BigInt
                someBigInt_IN: [BigInt]
                someBigInt_NOT_IN: [BigInt]
                someBigInt_LT: BigInt
                someBigInt_LTE: BigInt
                someBigInt_GT: BigInt
                someBigInt_GTE: BigInt
                createdAt: DateTime
                createdAt_NOT: DateTime
                createdAt_IN: [DateTime]
                createdAt_NOT_IN: [DateTime]
                createdAt_LT: DateTime
                createdAt_LTE: DateTime
                createdAt_GT: DateTime
                createdAt_GTE: DateTime
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
            }
            "
        `);
    });
});
