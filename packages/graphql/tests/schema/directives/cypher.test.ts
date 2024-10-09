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

describe("Cypher", () => {
    test("Custom Directive Simple", async () => {
        const typeDefs = gql`
            type Actor @node {
                name: String
            }

            type Movie @node {
                id: ID
                custom_string: String @cypher(statement: "RETURN 'custom!' as c", columnName: "c")
                list_of_custom_strings: [String]
                    @cypher(
                        statement: "RETURN ['a','b','c'] as list_of_custom_strings"
                        columnName: "list_of_custom_strings"
                    )
                custom_int: Int @cypher(statement: "RETURN 42 as n", columnName: "n")
                list_of_custom_ints: [Int]
                    @cypher(statement: "RETURN [1,2,3] as list_of_custom_ints", columnName: "list_of_custom_ints")
                custom_big_int: BigInt @cypher(statement: "RETURN 42 as n", columnName: "n")
                list_of_custom_big_ints: [BigInt]
                    @cypher(
                        statement: "RETURN [1,2,3] as list_of_custom_big_ints"
                        columnName: "list_of_custom_big_ints"
                    )
                custom_float: Float @cypher(statement: "RETURN 3.14 as f", columnName: "f")
                list_of_custom_floats: [Float]
                    @cypher(
                        statement: "RETURN [1.1,2.2,3.3] as list_of_custom_floats"
                        columnName: "list_of_custom_floats"
                    )
                custom_boolean: Boolean @cypher(statement: "RETURN true as b", columnName: "b")
                list_of_custom_booleans: [Boolean]
                    @cypher(
                        statement: "RETURN [true,false,true] as list_of_custom_booleans"
                        columnName: "list_of_custom_booleans"
                    )
                custom_id: ID @cypher(statement: "RETURN 'test-id' as i", columnName: "i")
                list_custom_of_ids: [ID]
                    @cypher(statement: "RETURN ['1','2','3'] as list_of_ids", columnName: "list_of_ids")
                custom_point: Point
                    @cypher(statement: "RETURN point({latitude: 1, longitude: 1}) as p", columnName: "p")
                list_of_custom_points: [Point]
                    @cypher(
                        statement: "RETURN [point({latitude: 1, longitude: 1}), point({latitude: 2, longitude: 2})] as list_of_points"
                        columnName: "list_of_points"
                    )
                custom_cartesian_point: CartesianPoint @cypher(statement: "RETURN {x: 1, y: 1} as cp", columnName: "cp")
                list_of_custom_cartesian_points: [CartesianPoint]
                    @cypher(
                        statement: "RETURN [{x: 1, y: 1}, {x: 2, y: 2}] as list_of_cartesian_points"
                        columnName: "list_of_cartesian_points"
                    )
                custom_date: Date @cypher(statement: "RETURN date('2021-01-01') as d", columnName: "d")
                list_of_custom_dates: [Date]
                    @cypher(
                        statement: "RETURN [date('2021-01-01'), date('2021-01-02')] as list_of_dates"
                        columnName: "list_of_dates"
                    )
                custom_time: Time @cypher(statement: "RETURN localtime() as t", columnName: "t")
                list_of_custom_times: [Time]
                    @cypher(
                        statement: "RETURN [localtime(), localtime()] as list_of_times"
                        columnName: "list_of_times"
                    )
                custom_localtime: LocalTime @cypher(statement: "RETURN localtime() as lt", columnName: "lt")
                list_of_custom_localtimes: [LocalTime]
                    @cypher(
                        statement: "RETURN [localtime(), localtime()] as list_of_localtimes"
                        columnName: "list_of_localtimes"
                    )
                custom_datetime: DateTime @cypher(statement: "RETURN datetime() as dt", columnName: "dt")
                list_of_custom_datetimes: [DateTime]
                    @cypher(
                        statement: "RETURN [localdatetime(), localdatetime()] as list_of_datetimes"
                        columnName: "list_of_datetimes"
                    )
                custom_localdatetime: LocalDateTime
                    @cypher(statement: "RETURN localdatetime() as ldt", columnName: "ldt")
                list_of_custom_localdatetimes: [LocalDateTime]
                    @cypher(
                        statement: "RETURN [localdatetime(), localdatetime()] as list_of_localdatetimes"
                        columnName: "list_of_localdatetimes"
                    )
                custom_duration: Duration @cypher(statement: "RETURN duration({days: 1}) as dur", columnName: "dur")
                list_of_custom_durations: [Duration]
                    @cypher(
                        statement: "RETURN [duration({days: 1}), duration({days: 2})] as list_of_durations"
                        columnName: "list_of_durations"
                    )
                actor: Actor @cypher(statement: "MATCH (this)-[:ACTED_IN]->(a:Actor) RETURN a", columnName: "a")
                actors(title: String): [Actor]
                    @cypher(
                        statement: """
                        MATCH (a:Actor {title: $title})
                        RETURN a
                        LIMIT 1
                        """
                        columnName: "a"
                    )
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              name: String
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            \\"\\"\\"
            A point in a two- or three-dimensional Cartesian coordinate system or in a three-dimensional cylindrical coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#cartesian-point
            \\"\\"\\"
            type CartesianPoint {
              crs: String!
              srid: Int!
              x: Float!
              y: Float!
              z: Float
            }

            \\"\\"\\"Input type for a cartesian point with a distance\\"\\"\\"
            input CartesianPointDistance {
              distance: Float!
              point: CartesianPointInput!
            }

            \\"\\"\\"Input type for a cartesian point\\"\\"\\"
            input CartesianPointInput {
              x: Float!
              y: Float!
              z: Float
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
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

            \\"\\"\\"A date, represented as a 'yyyy-mm-dd' string\\"\\"\\"
            scalar Date

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            type Movie {
              actor: Actor
              actors(title: String): [Actor]
              custom_big_int: BigInt
              custom_boolean: Boolean
              custom_cartesian_point: CartesianPoint
              custom_date: Date
              custom_datetime: DateTime
              custom_duration: Duration
              custom_float: Float
              custom_id: ID
              custom_int: Int
              custom_localdatetime: LocalDateTime
              custom_localtime: LocalTime
              custom_point: Point
              custom_string: String
              custom_time: Time
              id: ID
              list_custom_of_ids: [ID]
              list_of_custom_big_ints: [BigInt]
              list_of_custom_booleans: [Boolean]
              list_of_custom_cartesian_points: [CartesianPoint]
              list_of_custom_dates: [Date]
              list_of_custom_datetimes: [DateTime]
              list_of_custom_durations: [Duration]
              list_of_custom_floats: [Float]
              list_of_custom_ints: [Int]
              list_of_custom_localdatetimes: [LocalDateTime]
              list_of_custom_localtimes: [LocalTime]
              list_of_custom_points: [Point]
              list_of_custom_strings: [String]
              list_of_custom_times: [Time]
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
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
              actor: SortDirection
              custom_big_int: SortDirection
              custom_boolean: SortDirection
              custom_cartesian_point: SortDirection
              custom_date: SortDirection
              custom_datetime: SortDirection
              custom_duration: SortDirection
              custom_float: SortDirection
              custom_id: SortDirection
              custom_int: SortDirection
              custom_localdatetime: SortDirection
              custom_localtime: SortDirection
              custom_point: SortDirection
              custom_string: SortDirection
              custom_time: SortDirection
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              custom_big_int: BigInt @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_big_int_EQ: BigInt
              custom_big_int_GT: BigInt
              custom_big_int_GTE: BigInt
              custom_big_int_IN: [BigInt]
              custom_big_int_LT: BigInt
              custom_big_int_LTE: BigInt
              custom_boolean: Boolean @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_boolean_EQ: Boolean
              custom_cartesian_point: CartesianPointInput @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_cartesian_point_DISTANCE: CartesianPointDistance
              custom_cartesian_point_EQ: CartesianPointInput
              custom_cartesian_point_GT: CartesianPointDistance
              custom_cartesian_point_GTE: CartesianPointDistance
              custom_cartesian_point_IN: [CartesianPointInput]
              custom_cartesian_point_LT: CartesianPointDistance
              custom_cartesian_point_LTE: CartesianPointDistance
              custom_date: Date @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_date_EQ: Date
              custom_date_GT: Date
              custom_date_GTE: Date
              custom_date_IN: [Date]
              custom_date_LT: Date
              custom_date_LTE: Date
              custom_datetime: DateTime @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_datetime_EQ: DateTime
              custom_datetime_GT: DateTime
              custom_datetime_GTE: DateTime
              custom_datetime_IN: [DateTime]
              custom_datetime_LT: DateTime
              custom_datetime_LTE: DateTime
              custom_duration: Duration @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_duration_EQ: Duration
              custom_duration_GT: Duration
              custom_duration_GTE: Duration
              custom_duration_IN: [Duration]
              custom_duration_LT: Duration
              custom_duration_LTE: Duration
              custom_float: Float @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_float_EQ: Float
              custom_float_GT: Float
              custom_float_GTE: Float
              custom_float_IN: [Float]
              custom_float_LT: Float
              custom_float_LTE: Float
              custom_id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_id_CONTAINS: ID
              custom_id_ENDS_WITH: ID
              custom_id_EQ: ID
              custom_id_IN: [ID]
              custom_id_STARTS_WITH: ID
              custom_int: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_int_EQ: Int
              custom_int_GT: Int
              custom_int_GTE: Int
              custom_int_IN: [Int]
              custom_int_LT: Int
              custom_int_LTE: Int
              custom_localdatetime: LocalDateTime @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_localdatetime_EQ: LocalDateTime
              custom_localdatetime_GT: LocalDateTime
              custom_localdatetime_GTE: LocalDateTime
              custom_localdatetime_IN: [LocalDateTime]
              custom_localdatetime_LT: LocalDateTime
              custom_localdatetime_LTE: LocalDateTime
              custom_localtime: LocalTime @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_localtime_EQ: LocalTime
              custom_localtime_GT: LocalTime
              custom_localtime_GTE: LocalTime
              custom_localtime_IN: [LocalTime]
              custom_localtime_LT: LocalTime
              custom_localtime_LTE: LocalTime
              custom_point: PointInput @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_point_DISTANCE: PointDistance
              custom_point_EQ: PointInput
              custom_point_GT: PointDistance
              custom_point_GTE: PointDistance
              custom_point_IN: [PointInput]
              custom_point_LT: PointDistance
              custom_point_LTE: PointDistance
              custom_string: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_string_CONTAINS: String
              custom_string_ENDS_WITH: String
              custom_string_EQ: String
              custom_string_IN: [String]
              custom_string_STARTS_WITH: String
              custom_time: Time @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_time_EQ: Time
              custom_time_GT: Time
              custom_time_GTE: Time
              custom_time_IN: [Time]
              custom_time_LT: Time
              custom_time_LTE: Time
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              list_custom_of_ids: [ID] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_custom_of_ids_EQ: [ID]
              list_custom_of_ids_INCLUDES: ID
              list_of_custom_big_ints: [BigInt] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_big_ints_EQ: [BigInt]
              list_of_custom_big_ints_INCLUDES: BigInt
              list_of_custom_booleans: [Boolean] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_booleans_EQ: [Boolean]
              list_of_custom_cartesian_points: [CartesianPointInput] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_cartesian_points_EQ: [CartesianPointInput]
              list_of_custom_cartesian_points_INCLUDES: CartesianPointInput
              list_of_custom_dates: [Date] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_dates_EQ: [Date]
              list_of_custom_dates_INCLUDES: Date
              list_of_custom_datetimes: [DateTime] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_datetimes_EQ: [DateTime]
              list_of_custom_datetimes_INCLUDES: DateTime
              list_of_custom_durations: [Duration] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_durations_EQ: [Duration]
              list_of_custom_durations_INCLUDES: Duration
              list_of_custom_floats: [Float] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_floats_EQ: [Float]
              list_of_custom_floats_INCLUDES: Float
              list_of_custom_ints: [Int] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_ints_EQ: [Int]
              list_of_custom_ints_INCLUDES: Int
              list_of_custom_localdatetimes: [LocalDateTime] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_localdatetimes_EQ: [LocalDateTime]
              list_of_custom_localdatetimes_INCLUDES: LocalDateTime
              list_of_custom_localtimes: [LocalTime] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_localtimes_EQ: [LocalTime]
              list_of_custom_localtimes_INCLUDES: LocalTime
              list_of_custom_points: [PointInput] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_points_EQ: [PointInput]
              list_of_custom_points_INCLUDES: PointInput
              list_of_custom_strings: [String] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_strings_EQ: [String]
              list_of_custom_strings_INCLUDES: String
              list_of_custom_times: [Time] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              list_of_custom_times_EQ: [Time]
              list_of_custom_times_INCLUDES: Time
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
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

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
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

    test("Filters should not be generated on list custom cypher fields", async () => {
        const typeDefs = gql`
            type Movie {
                custom_cypher_string_list: [String]
                    @cypher(statement: "RETURN ['a','b','c'] as list", columnName: "list")
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
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              custom_cypher_string_list: [String]
            }

            type MovieAggregateSelection {
              count: Int!
            }

            input MovieCreateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOptions {
              limit: Int
              offset: Int
            }

            input MovieUpdateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              custom_cypher_string_list: [String] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_cypher_string_list_EQ: [String]
              custom_cypher_string_list_INCLUDES: String
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
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, where: MovieWhere): MoviesConnection!
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

    test("Filters should not be generated on custom cypher fields with arguments", async () => {
        const typeDefs = gql`
            type Movie {
                custom_string_with_param(param: String): String
                    @cypher(statement: "RETURN $param as c", columnName: "c")
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
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              custom_string_with_param(param: String): String
            }

            type MovieAggregateSelection {
              count: Int!
            }

            input MovieCreateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
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
              custom_string_with_param: SortDirection
            }

            input MovieUpdateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
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

    test("Filters should not be generated on Relationship/Object custom cypher fields", async () => {
        const typeDefs = gql`
            type Movie {
                actors: [Actor]
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor {
                name: String
                movies: [Movie]
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              movies: [Movie]
              name: String
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              actors: [Actor]
            }

            type MovieAggregateSelection {
              count: Int!
            }

            input MovieCreateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOptions {
              limit: Int
              offset: Int
            }

            input MovieUpdateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, where: MovieWhere): MoviesConnection!
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
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

    test("Sort On Primitive Field", async () => {
        const typeDefs = gql`
            type Actor @node {
                name: String
                totalScreenTime: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[r:ACTED_IN]->(:Movie)
                        RETURN sum(r.screenTime) as result
                        """
                        columnName: "result"
                    )
            }

            type Movie @node {
                id: ID
                actors(title: String): [Actor]
                    @cypher(
                        statement: """
                        MATCH (a:Actor {title: $title})
                        RETURN a
                        LIMIT 1
                        """
                        columnName: "a"
                    )
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              name: String
              totalScreenTime: Int!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
              totalScreenTime: SortDirection
            }

            input ActorUpdateInput {
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
              totalScreenTime: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              totalScreenTime_EQ: Int
              totalScreenTime_GT: Int
              totalScreenTime_GTE: Int
              totalScreenTime_IN: [Int!]
              totalScreenTime_LT: Int
              totalScreenTime_LTE: Int
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type Movie {
              actors(title: String): [Actor]
              id: ID
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
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
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
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

    test("Filters should not be generated on custom cypher fields for subscriptions", async () => {
        const typeDefs = gql`
            type Movie {
                title: String
                custom_title: String @cypher(statement: "RETURN 'hello' as t", columnName: "t")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: true } });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type Movie {
              custom_title: String
              title: String
            }

            type MovieAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              title: String
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              custom_title: String
              title: String
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
              custom_title: SortDirection
              title: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String]
              title_STARTS_WITH: String
            }

            input MovieUpdateInput {
              title: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              custom_title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              custom_title_CONTAINS: String
              custom_title_ENDS_WITH: String
              custom_title_EQ: String
              custom_title_IN: [String]
              custom_title_STARTS_WITH: String
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
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

            type Subscription {
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
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
