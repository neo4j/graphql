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
            type Actor {
                name: String
            }

            type Movie {
                id: ID
                custom_string: String @cypher(statement: "RETURN 'custom!' as c", columnName: "c")
                custom_int: Int @cypher(statement: "RETURN 42 as n", columnName: "n")
                custom_big_int: BigInt @cypher(statement: "RETURN 42 as n", columnName: "n")
                custom_float: Float @cypher(statement: "RETURN 3.14 as f", columnName: "f")
                custom_boolean: Boolean @cypher(statement: "RETURN true as b", columnName: "b")
                custom_id: ID @cypher(statement: "RETURN 'test-id' as i", columnName: "i")
                custom_point: Point
                    @cypher(statement: "RETURN point({latitude: 1, longitude: 1}) as p", columnName: "p")
                custom_cartesian_point: CartesianPoint @cypher(statement: "RETURN {x: 1, y: 1} as cp", columnName: "cp")
                custom_date: Date @cypher(statement: "RETURN date('2021-01-01') as d", columnName: "d")
                custom_time: Time @cypher(statement: "RETURN localtime() as t", columnName: "t")
                custom_localtime: LocalTime @cypher(statement: "RETURN localtime() as lt", columnName: "lt")
                custom_datetime: DateTime @cypher(statement: "RETURN datetime() as dt", columnName: "dt")
                custom_localdatetime: LocalDateTime
                    @cypher(statement: "RETURN localdatetime() as ldt", columnName: "ldt")
                custom_duration: Duration @cypher(statement: "RETURN duration({days: 1}) as dur", columnName: "dur")
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
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              custom_big_int: BigInt
              custom_big_int_GT: BigInt
              custom_big_int_GTE: BigInt
              custom_big_int_IN: [BigInt]
              custom_big_int_LT: BigInt
              custom_big_int_LTE: BigInt
              custom_big_int_NOT: BigInt @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_big_int_NOT_IN: [BigInt] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_boolean: Boolean
              custom_boolean_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_cartesian_point: CartesianPointInput
              custom_cartesian_point_DISTANCE: CartesianPointDistance
              custom_cartesian_point_GT: CartesianPointDistance
              custom_cartesian_point_GTE: CartesianPointDistance
              custom_cartesian_point_IN: [CartesianPointInput]
              custom_cartesian_point_LT: CartesianPointDistance
              custom_cartesian_point_LTE: CartesianPointDistance
              custom_cartesian_point_NOT: CartesianPointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_cartesian_point_NOT_IN: [CartesianPointInput] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_date: Date
              custom_date_GT: Date
              custom_date_GTE: Date
              custom_date_IN: [Date]
              custom_date_LT: Date
              custom_date_LTE: Date
              custom_date_NOT: Date @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_date_NOT_IN: [Date] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_datetime: DateTime
              custom_datetime_GT: DateTime
              custom_datetime_GTE: DateTime
              custom_datetime_IN: [DateTime]
              custom_datetime_LT: DateTime
              custom_datetime_LTE: DateTime
              custom_datetime_NOT: DateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_datetime_NOT_IN: [DateTime] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_duration: Duration
              custom_duration_GT: Duration
              custom_duration_GTE: Duration
              custom_duration_IN: [Duration]
              custom_duration_LT: Duration
              custom_duration_LTE: Duration
              custom_duration_NOT: Duration @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_duration_NOT_IN: [Duration] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_float: Float
              custom_float_GT: Float
              custom_float_GTE: Float
              custom_float_IN: [Float]
              custom_float_LT: Float
              custom_float_LTE: Float
              custom_float_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_float_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_id: ID
              custom_id_CONTAINS: ID
              custom_id_ENDS_WITH: ID
              custom_id_IN: [ID]
              custom_id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_id_STARTS_WITH: ID
              custom_int: Int
              custom_int_GT: Int
              custom_int_GTE: Int
              custom_int_IN: [Int]
              custom_int_LT: Int
              custom_int_LTE: Int
              custom_int_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_int_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_localdatetime: LocalDateTime
              custom_localdatetime_GT: LocalDateTime
              custom_localdatetime_GTE: LocalDateTime
              custom_localdatetime_IN: [LocalDateTime]
              custom_localdatetime_LT: LocalDateTime
              custom_localdatetime_LTE: LocalDateTime
              custom_localdatetime_NOT: LocalDateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_localdatetime_NOT_IN: [LocalDateTime] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_localtime: LocalTime
              custom_localtime_GT: LocalTime
              custom_localtime_GTE: LocalTime
              custom_localtime_IN: [LocalTime]
              custom_localtime_LT: LocalTime
              custom_localtime_LTE: LocalTime
              custom_localtime_NOT: LocalTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_localtime_NOT_IN: [LocalTime] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_point: PointInput
              custom_point_DISTANCE: PointDistance
              custom_point_GT: PointDistance
              custom_point_GTE: PointDistance
              custom_point_IN: [PointInput]
              custom_point_LT: PointDistance
              custom_point_LTE: PointDistance
              custom_point_NOT: PointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_point_NOT_IN: [PointInput] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_string: String
              custom_string_CONTAINS: String
              custom_string_ENDS_WITH: String
              custom_string_IN: [String]
              custom_string_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_string_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_string_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_string_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_string_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_string_STARTS_WITH: String
              custom_time: Time
              custom_time_GT: Time
              custom_time_GTE: Time
              custom_time_IN: [Time]
              custom_time_LT: Time
              custom_time_LTE: Time
              custom_time_NOT: Time @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              custom_time_NOT_IN: [Time] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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

    test("Sort On Primitive Field", async () => {
        const typeDefs = gql`
            type Actor {
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

            type Movie {
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
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              totalScreenTime: Int
              totalScreenTime_GT: Int
              totalScreenTime_GTE: Int
              totalScreenTime_IN: [Int!]
              totalScreenTime_LT: Int
              totalScreenTime_LTE: Int
              totalScreenTime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              totalScreenTime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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
