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
import { Neo4jGraphQL } from "../../../../src";
import { TestCDCEngine } from "../../../utils/builders/TestCDCEngine";

describe("Cypher", () => {
    test("Custom Directive Simple", async () => {
        const typeDefs = /* GraphQL */ `
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
                actors_no_args: [Actor]
                    @cypher(
                        statement: """
                        MATCH (a:Actor {title: $title})
                        RETURN a
                        LIMIT 1
                        """
                        columnName: "a"
                    )
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

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            \\"\\"\\"BigInt list filters\\"\\"\\"
            input BigIntListFilters {
              eq: [BigInt!]
              includes: BigInt
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

            \\"\\"\\"Boolean list filters\\"\\"\\"
            input BooleanListFilters {
              eq: [Boolean!]
            }

            \\"\\"\\"Boolean filters\\"\\"\\"
            input BooleanScalarFilters {
              eq: Boolean
            }

            \\"\\"\\"Distance filters for cartesian points\\"\\"\\"
            input CartesianDistancePointFilters {
              from: CartesianPointInput!
              gt: Float
              gte: Float
              lt: Float
              lte: Float
            }

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

            \\"\\"\\"Cartesian Point filters\\"\\"\\"
            input CartesianPointFilters {
              distance: CartesianDistancePointFilters
              eq: CartesianPointInput
              in: [CartesianPointInput!]
            }

            \\"\\"\\"Input type for a cartesian point\\"\\"\\"
            input CartesianPointInput {
              x: Float!
              y: Float!
              z: Float
            }

            \\"\\"\\"CartesianPoint list filters\\"\\"\\"
            input CartesianPointListFilters {
              eq: [CartesianPointInput!]
              includes: CartesianPointInput
            }

            type Count {
              nodes: Int!
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

            \\"\\"\\"Date list filters\\"\\"\\"
            input DateListFilters {
              eq: [Date!]
              includes: Date
            }

            \\"\\"\\"Date filters\\"\\"\\"
            input DateScalarFilters {
              eq: Date
              gt: Date
              gte: Date
              in: [Date!]
              lt: Date
              lte: Date
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            \\"\\"\\"Duration list filters\\"\\"\\"
            input DurationListFilters {
              eq: [Duration!]
              includes: Duration
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

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            \\"\\"\\"LocalDateTime list filters\\"\\"\\"
            input LocalDateTimeListFilters {
              eq: [LocalDateTime!]
              includes: LocalDateTime
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

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            \\"\\"\\"LocalTime list filters\\"\\"\\"
            input LocalTimeListFilters {
              eq: [LocalTime!]
              includes: LocalTime
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

            type Movie {
              actor: Actor
              actors(title: String): [Actor]
              actors_no_args: [Actor]
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

            type MovieAggregate {
              count: Count!
            }

            input MovieCreateInput {
              id: ID
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
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
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actor: ActorWhere
              actors_no_args: ActorRelationshipFilters
              actors_no_args_ALL: ActorWhere
              actors_no_args_NONE: ActorWhere
              actors_no_args_SINGLE: ActorWhere
              actors_no_args_SOME: ActorWhere
              custom_big_int: BigIntScalarFilters
              custom_big_int_EQ: BigInt @deprecated(reason: \\"Please use the relevant generic filter custom_big_int: { eq: ... }\\")
              custom_big_int_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter custom_big_int: { gt: ... }\\")
              custom_big_int_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter custom_big_int: { gte: ... }\\")
              custom_big_int_IN: [BigInt] @deprecated(reason: \\"Please use the relevant generic filter custom_big_int: { in: ... }\\")
              custom_big_int_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter custom_big_int: { lt: ... }\\")
              custom_big_int_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter custom_big_int: { lte: ... }\\")
              custom_boolean: BooleanScalarFilters
              custom_boolean_EQ: Boolean @deprecated(reason: \\"Please use the relevant generic filter custom_boolean: { eq: ... }\\")
              custom_cartesian_point: CartesianPointFilters
              custom_cartesian_point_DISTANCE: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_cartesian_point: { distance: ... }\\")
              custom_cartesian_point_EQ: CartesianPointInput @deprecated(reason: \\"Please use the relevant generic filter custom_cartesian_point: { eq: ... }\\")
              custom_cartesian_point_GT: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_cartesian_point: { gt: ... }\\")
              custom_cartesian_point_GTE: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_cartesian_point: { gte: ... }\\")
              custom_cartesian_point_IN: [CartesianPointInput] @deprecated(reason: \\"Please use the relevant generic filter custom_cartesian_point: { in: ... }\\")
              custom_cartesian_point_LT: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_cartesian_point: { lt: ... }\\")
              custom_cartesian_point_LTE: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_cartesian_point: { lte: ... }\\")
              custom_date: DateScalarFilters
              custom_date_EQ: Date @deprecated(reason: \\"Please use the relevant generic filter custom_date: { eq: ... }\\")
              custom_date_GT: Date @deprecated(reason: \\"Please use the relevant generic filter custom_date: { gt: ... }\\")
              custom_date_GTE: Date @deprecated(reason: \\"Please use the relevant generic filter custom_date: { gte: ... }\\")
              custom_date_IN: [Date] @deprecated(reason: \\"Please use the relevant generic filter custom_date: { in: ... }\\")
              custom_date_LT: Date @deprecated(reason: \\"Please use the relevant generic filter custom_date: { lt: ... }\\")
              custom_date_LTE: Date @deprecated(reason: \\"Please use the relevant generic filter custom_date: { lte: ... }\\")
              custom_datetime: DateTimeScalarFilters
              custom_datetime_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter custom_datetime: { eq: ... }\\")
              custom_datetime_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter custom_datetime: { gt: ... }\\")
              custom_datetime_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter custom_datetime: { gte: ... }\\")
              custom_datetime_IN: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter custom_datetime: { in: ... }\\")
              custom_datetime_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter custom_datetime: { lt: ... }\\")
              custom_datetime_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter custom_datetime: { lte: ... }\\")
              custom_duration: DurationScalarFilters
              custom_duration_EQ: Duration @deprecated(reason: \\"Please use the relevant generic filter custom_duration: { eq: ... }\\")
              custom_duration_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter custom_duration: { gt: ... }\\")
              custom_duration_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter custom_duration: { gte: ... }\\")
              custom_duration_IN: [Duration] @deprecated(reason: \\"Please use the relevant generic filter custom_duration: { in: ... }\\")
              custom_duration_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter custom_duration: { lt: ... }\\")
              custom_duration_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter custom_duration: { lte: ... }\\")
              custom_float: FloatScalarFilters
              custom_float_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter custom_float: { eq: ... }\\")
              custom_float_GT: Float @deprecated(reason: \\"Please use the relevant generic filter custom_float: { gt: ... }\\")
              custom_float_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter custom_float: { gte: ... }\\")
              custom_float_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter custom_float: { in: ... }\\")
              custom_float_LT: Float @deprecated(reason: \\"Please use the relevant generic filter custom_float: { lt: ... }\\")
              custom_float_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter custom_float: { lte: ... }\\")
              custom_id: IDScalarFilters
              custom_id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter custom_id: { contains: ... }\\")
              custom_id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter custom_id: { endsWith: ... }\\")
              custom_id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter custom_id: { eq: ... }\\")
              custom_id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter custom_id: { in: ... }\\")
              custom_id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter custom_id: { startsWith: ... }\\")
              custom_int: IntScalarFilters
              custom_int_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter custom_int: { eq: ... }\\")
              custom_int_GT: Int @deprecated(reason: \\"Please use the relevant generic filter custom_int: { gt: ... }\\")
              custom_int_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter custom_int: { gte: ... }\\")
              custom_int_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter custom_int: { in: ... }\\")
              custom_int_LT: Int @deprecated(reason: \\"Please use the relevant generic filter custom_int: { lt: ... }\\")
              custom_int_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter custom_int: { lte: ... }\\")
              custom_localdatetime: LocalDateTimeScalarFilters
              custom_localdatetime_EQ: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter custom_localdatetime: { eq: ... }\\")
              custom_localdatetime_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter custom_localdatetime: { gt: ... }\\")
              custom_localdatetime_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter custom_localdatetime: { gte: ... }\\")
              custom_localdatetime_IN: [LocalDateTime] @deprecated(reason: \\"Please use the relevant generic filter custom_localdatetime: { in: ... }\\")
              custom_localdatetime_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter custom_localdatetime: { lt: ... }\\")
              custom_localdatetime_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter custom_localdatetime: { lte: ... }\\")
              custom_localtime: LocalTimeScalarFilters
              custom_localtime_EQ: LocalTime @deprecated(reason: \\"Please use the relevant generic filter custom_localtime: { eq: ... }\\")
              custom_localtime_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter custom_localtime: { gt: ... }\\")
              custom_localtime_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter custom_localtime: { gte: ... }\\")
              custom_localtime_IN: [LocalTime] @deprecated(reason: \\"Please use the relevant generic filter custom_localtime: { in: ... }\\")
              custom_localtime_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter custom_localtime: { lt: ... }\\")
              custom_localtime_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter custom_localtime: { lte: ... }\\")
              custom_point: PointFilters
              custom_point_DISTANCE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_point: { distance: ... }\\")
              custom_point_EQ: PointInput @deprecated(reason: \\"Please use the relevant generic filter custom_point: { eq: ... }\\")
              custom_point_GT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_point: { gt: ... }\\")
              custom_point_GTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_point: { gte: ... }\\")
              custom_point_IN: [PointInput] @deprecated(reason: \\"Please use the relevant generic filter custom_point: { in: ... }\\")
              custom_point_LT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_point: { lt: ... }\\")
              custom_point_LTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter custom_point: { lte: ... }\\")
              custom_string: StringScalarFilters
              custom_string_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter custom_string: { contains: ... }\\")
              custom_string_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter custom_string: { endsWith: ... }\\")
              custom_string_EQ: String @deprecated(reason: \\"Please use the relevant generic filter custom_string: { eq: ... }\\")
              custom_string_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter custom_string: { in: ... }\\")
              custom_string_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter custom_string: { startsWith: ... }\\")
              custom_time: TimeScalarFilters
              custom_time_EQ: Time @deprecated(reason: \\"Please use the relevant generic filter custom_time: { eq: ... }\\")
              custom_time_GT: Time @deprecated(reason: \\"Please use the relevant generic filter custom_time: { gt: ... }\\")
              custom_time_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter custom_time: { gte: ... }\\")
              custom_time_IN: [Time] @deprecated(reason: \\"Please use the relevant generic filter custom_time: { in: ... }\\")
              custom_time_LT: Time @deprecated(reason: \\"Please use the relevant generic filter custom_time: { lt: ... }\\")
              custom_time_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter custom_time: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              list_custom_of_ids: IDListFilters
              list_custom_of_ids_EQ: [ID] @deprecated(reason: \\"Please use the relevant generic filter list_custom_of_ids: { eq: ... }\\")
              list_custom_of_ids_INCLUDES: ID @deprecated(reason: \\"Please use the relevant generic filter list_custom_of_ids: { includes: ... }\\")
              list_of_custom_big_ints: BigIntListFilters
              list_of_custom_big_ints_EQ: [BigInt] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_big_ints: { eq: ... }\\")
              list_of_custom_big_ints_INCLUDES: BigInt @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_big_ints: { includes: ... }\\")
              list_of_custom_booleans: BooleanListFilters
              list_of_custom_booleans_EQ: [Boolean] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_booleans: { eq: ... }\\")
              list_of_custom_cartesian_points: CartesianPointListFilters
              list_of_custom_cartesian_points_EQ: [CartesianPointInput] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_cartesian_points: { eq: ... }\\")
              list_of_custom_cartesian_points_INCLUDES: CartesianPointInput @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_cartesian_points: { includes: ... }\\")
              list_of_custom_dates: DateListFilters
              list_of_custom_dates_EQ: [Date] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_dates: { eq: ... }\\")
              list_of_custom_dates_INCLUDES: Date @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_dates: { includes: ... }\\")
              list_of_custom_datetimes: DateTimeListFilters
              list_of_custom_datetimes_EQ: [DateTime] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_datetimes: { eq: ... }\\")
              list_of_custom_datetimes_INCLUDES: DateTime @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_datetimes: { includes: ... }\\")
              list_of_custom_durations: DurationListFilters
              list_of_custom_durations_EQ: [Duration] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_durations: { eq: ... }\\")
              list_of_custom_durations_INCLUDES: Duration @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_durations: { includes: ... }\\")
              list_of_custom_floats: FloatListFilters
              list_of_custom_floats_EQ: [Float] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_floats: { eq: ... }\\")
              list_of_custom_floats_INCLUDES: Float @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_floats: { includes: ... }\\")
              list_of_custom_ints: IntListFilters
              list_of_custom_ints_EQ: [Int] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_ints: { eq: ... }\\")
              list_of_custom_ints_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_ints: { includes: ... }\\")
              list_of_custom_localdatetimes: LocalDateTimeListFilters
              list_of_custom_localdatetimes_EQ: [LocalDateTime] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_localdatetimes: { eq: ... }\\")
              list_of_custom_localdatetimes_INCLUDES: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_localdatetimes: { includes: ... }\\")
              list_of_custom_localtimes: LocalTimeListFilters
              list_of_custom_localtimes_EQ: [LocalTime] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_localtimes: { eq: ... }\\")
              list_of_custom_localtimes_INCLUDES: LocalTime @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_localtimes: { includes: ... }\\")
              list_of_custom_points: PointListFilters
              list_of_custom_points_EQ: [PointInput] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_points: { eq: ... }\\")
              list_of_custom_points_INCLUDES: PointInput @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_points: { includes: ... }\\")
              list_of_custom_strings: StringListFilters
              list_of_custom_strings_EQ: [String] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_strings: { eq: ... }\\")
              list_of_custom_strings_INCLUDES: String @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_strings: { includes: ... }\\")
              list_of_custom_times: TimeListFilters
              list_of_custom_times_EQ: [Time] @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_times: { eq: ... }\\")
              list_of_custom_times_INCLUDES: Time @deprecated(reason: \\"Please use the relevant generic filter list_of_custom_times: { includes: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
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

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            \\"\\"\\"Time list filters\\"\\"\\"
            input TimeListFilters {
              eq: [Time!]
              includes: Time
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
        const typeDefs = /* GraphQL */ `
            type Movie @node {
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

            type MovieAggregate {
              count: Count!
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
              custom_cypher_string_list: StringListFilters
              custom_cypher_string_list_EQ: [String] @deprecated(reason: \\"Please use the relevant generic filter custom_cypher_string_list: { eq: ... }\\")
              custom_cypher_string_list_INCLUDES: String @deprecated(reason: \\"Please use the relevant generic filter custom_cypher_string_list: { includes: ... }\\")
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
              movies(limit: Int, offset: Int, where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, where: MovieWhere): MoviesConnection!
            }

            \\"\\"\\"String list filters\\"\\"\\"
            input StringListFilters {
              eq: [String!]
              includes: String
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
        const typeDefs = /* GraphQL */ `
            type Movie @node {
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

            type MovieAggregate {
              count: Count!
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

    test("Union: Filters should not be generated for Relationship/Object custom cypher fields", async () => {
        const typeDefs = /* GraphQL */ `
            union Content = Blog | Post

            type Blog @node {
                title: String
                posts: [Post!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_POST]->(post)
                        RETURN post
                        """
                        columnName: "post"
                    )
                post: Post
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_POST]->(post)
                        RETURN post
                        LIMIT 1
                        """
                        columnName: "post"
                    )
            }

            type Post @node {
                content: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Blog {
              post: Post
              posts: [Post!]!
              title: String
            }

            type BlogAggregate {
              count: Count!
              node: BlogAggregateNode!
            }

            type BlogAggregateNode {
              title: StringAggregateSelection!
            }

            input BlogCreateInput {
              title: String
            }

            type BlogEdge {
              cursor: String!
              node: Blog!
            }

            \\"\\"\\"
            Fields to sort Blogs by. The order in which sorts are applied is not guaranteed when specifying many fields in one BlogSort object.
            \\"\\"\\"
            input BlogSort {
              title: SortDirection
            }

            input BlogUpdateInput {
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input BlogWhere {
              AND: [BlogWhere!]
              NOT: BlogWhere
              OR: [BlogWhere!]
              post: PostWhere
              posts: PostRelationshipFilters
              posts_ALL: PostWhere
              posts_NONE: PostWhere
              posts_SINGLE: PostWhere
              posts_SOME: PostWhere
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type BlogsConnection {
              aggregate: BlogAggregate!
              edges: [BlogEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            union Content = Blog | Post

            input ContentWhere {
              Blog: BlogWhere
              Post: PostWhere
            }

            type Count {
              nodes: Int!
            }

            type CreateBlogsMutationResponse {
              blogs: [Blog!]!
              info: CreateInfo!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createBlogs(input: [BlogCreateInput!]!): CreateBlogsMutationResponse!
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              deleteBlogs(where: BlogWhere): DeleteInfo!
              deletePosts(where: PostWhere): DeleteInfo!
              updateBlogs(update: BlogUpdateInput, where: BlogWhere): UpdateBlogsMutationResponse!
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              content: String
            }

            type PostAggregate {
              count: Count!
              node: PostAggregateNode!
            }

            type PostAggregateNode {
              content: StringAggregateSelection!
            }

            input PostCreateInput {
              content: String
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Posts match this filter\\"\\"\\"
              all: PostWhere
              \\"\\"\\"Filter type where none of the related Posts match this filter\\"\\"\\"
              none: PostWhere
              \\"\\"\\"Filter type where one of the related Posts match this filter\\"\\"\\"
              single: PostWhere
              \\"\\"\\"Filter type where some of the related Posts match this filter\\"\\"\\"
              some: PostWhere
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              content: SortDirection
            }

            input PostUpdateInput {
              content: StringScalarMutations
              content_SET: String @deprecated(reason: \\"Please use the generic mutation 'content: { set: ... } }' instead.\\")
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              content: StringScalarFilters
              content_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter content: { contains: ... }\\")
              content_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { endsWith: ... }\\")
              content_EQ: String @deprecated(reason: \\"Please use the relevant generic filter content: { eq: ... }\\")
              content_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter content: { in: ... }\\")
              content_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter content: { startsWith: ... }\\")
            }

            type PostsConnection {
              aggregate: PostAggregate!
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              blogs(limit: Int, offset: Int, sort: [BlogSort!], where: BlogWhere): [Blog!]!
              blogsConnection(after: String, first: Int, sort: [BlogSort!], where: BlogWhere): BlogsConnection!
              contents(limit: Int, offset: Int, where: ContentWhere): [Content!]!
              posts(limit: Int, offset: Int, sort: [PostSort!], where: PostWhere): [Post!]!
              postsConnection(after: String, first: Int, sort: [PostSort!], where: PostWhere): PostsConnection!
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

            type UpdateBlogsMutationResponse {
              blogs: [Blog!]!
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

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }"
        `);
    });

    test("Interface: Filters should not be generated for Relationship/Object custom cypher fields", async () => {
        const typeDefs = /* GraphQL */ `
            interface Production {
                actor: Actor
                actors: [Actor]
            }

            type Movie implements Production @node {
                actors: [Actor]
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
                actor: Actor
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(actor:Actor)
                        RETURN actor
                        LIMIT 1
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie]
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
                movie: Movie
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        LIMIT 1
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
              movie: Movie
              movies: [Movie]
              name: String
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movie: MovieWhere
              movies: MovieRelationshipFilters
              movies_ALL: MovieWhere
              movies_NONE: MovieWhere
              movies_SINGLE: MovieWhere
              movies_SOME: MovieWhere
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Count {
              nodes: Int!
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

            type Movie implements Production {
              actor: Actor
              actors: [Actor]
            }

            type MovieAggregate {
              count: Count!
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

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
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
              actor: ActorWhere
              actors: ActorRelationshipFilters
              actors_ALL: ActorWhere
              actors_NONE: ActorWhere
              actors_SINGLE: ActorWhere
              actors_SOME: ActorWhere
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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

            interface Production {
              actor: Actor
              actors: [Actor]
            }

            type ProductionAggregate {
              count: Count!
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              typename: [ProductionImplementation!]
            }

            type ProductionsConnection {
              aggregate: ProductionAggregate!
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, where: MovieWhere): MoviesConnection!
              productions(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int, where: ProductionWhere): ProductionsConnection!
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

    test("Filters should be generated only on 1:1 Relationship/Object custom cypher fields", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                actors: [Actor]
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
                actor: Actor
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(actor:Actor)
                        RETURN actor
                        LIMIT 1
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie]
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
                movie: Movie
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        LIMIT 1
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
              movie: Movie
              movies: [Movie]
              name: String
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movie: MovieWhere
              movies: MovieRelationshipFilters
              movies_ALL: MovieWhere
              movies_NONE: MovieWhere
              movies_SINGLE: MovieWhere
              movies_SOME: MovieWhere
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Count {
              nodes: Int!
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
              actor: Actor
              actors: [Actor]
            }

            type MovieAggregate {
              count: Count!
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

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
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
              actor: ActorWhere
              actors: ActorRelationshipFilters
              actors_ALL: ActorWhere
              actors_NONE: ActorWhere
              actors_SINGLE: ActorWhere
              actors_SOME: ActorWhere
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, where: MovieWhere): [Movie!]!
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
        const typeDefs = /* GraphQL */ `
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

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
              totalScreenTime: SortDirection
            }

            input ActorUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              totalScreenTime: IntScalarFilters
              totalScreenTime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter totalScreenTime: { eq: ... }\\")
              totalScreenTime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter totalScreenTime: { gt: ... }\\")
              totalScreenTime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter totalScreenTime: { gte: ... }\\")
              totalScreenTime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter totalScreenTime: { in: ... }\\")
              totalScreenTime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter totalScreenTime: { lt: ... }\\")
              totalScreenTime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter totalScreenTime: { lte: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Count {
              nodes: Int!
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

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            type Movie {
              actors(title: String): [Actor]
              id: ID
            }

            type MovieAggregate {
              count: Count!
            }

            input MovieCreateInput {
              id: ID
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
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
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_title: String @cypher(statement: "RETURN 'hello' as t", columnName: "t")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              custom_title: String
              title: String
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
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
              custom_title: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              custom_title: StringScalarFilters
              custom_title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter custom_title: { contains: ... }\\")
              custom_title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter custom_title: { endsWith: ... }\\")
              custom_title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter custom_title: { eq: ... }\\")
              custom_title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter custom_title: { in: ... }\\")
              custom_title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter custom_title: { startsWith: ... }\\")
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
