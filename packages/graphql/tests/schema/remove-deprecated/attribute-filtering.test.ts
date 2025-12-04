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
import { Neo4jGraphQL } from "../../../src";

describe("Exclude attribute suffix based filtering", () => {
    test("should exclude attribute suffix based filtering", async () => {
        const typeDefs = /* GraphQL */ `
            type typeA @node {
                name: String
                actedIn: [typeB!]! @relationship(type: "HAS_TYPE", properties: "relType", direction: OUT)
            }

            type typeB implements interfaceC @node {
                id: ID!
                ratings: [Float!]!
                rels: [typeA!]! @relationship(type: "HAS_TYPE", properties: "relType", direction: IN)
                averageRating: Float!
                date: Date
                duration: Duration
                localDateTime: LocalDateTime
                createdAt: DateTime
                cartesianPoint: CartesianPoint
                point: Point
                time: Time
                localTime: LocalTime
                list: [String!]!
            }
            union d = typeA | typeB

            interface interfaceC {
                averageRating: Float!
                date: Date
                duration: Duration
                localDateTime: LocalDateTime
                createdAt: DateTime
                cartesianPoint: CartesianPoint
                point: Point
                time: Time
                localTime: LocalTime
                list: [String!]!
            }

            type relType @relationshipProperties {
                pay: [Float!]
                averageRating: Float!
                date: Date
                duration: Duration
                localDateTime: LocalDateTime
                createdAt: DateTime
                cartesianPoint: CartesianPoint
                point: Point
                time: Time
                localTime: LocalTime
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                excludeDeprecatedFields: {
                    attributeFilters: true,
                },
            },
        });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
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

            \\"\\"\\"CartesianPoint mutations\\"\\"\\"
            input CartesianPointMutations {
              set: CartesianPointInput
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

            type CreateTypeASMutationResponse {
              info: CreateInfo!
              typeAS: [typeA!]!
            }

            type CreateTypeBSMutationResponse {
              info: CreateInfo!
              typeBS: [typeB!]!
            }

            \\"\\"\\"A date, represented as a 'yyyy-mm-dd' string\\"\\"\\"
            scalar Date

            \\"\\"\\"Date filters\\"\\"\\"
            input DateScalarFilters {
              eq: Date
              gt: Date
              gte: Date
              in: [Date!]
              lt: Date
              lte: Date
            }

            \\"\\"\\"Date mutations\\"\\"\\"
            input DateScalarMutations {
              set: Date
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

            type InterfaceCSConnection {
              aggregate: interfaceCAggregate!
              edges: [interfaceCEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Mutations for a list for Float\\"\\"\\"
            input ListFloatMutations {
              pop: Int
              push: [Float!]
              set: [Float!]
            }

            \\"\\"\\"Mutations for a list for String\\"\\"\\"
            input ListStringMutations {
              pop: Int
              push: [String!]
              set: [String!]
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
              createTypeAS(input: [typeACreateInput!]!): CreateTypeASMutationResponse!
              createTypeBS(input: [typeBCreateInput!]!): CreateTypeBSMutationResponse!
              deleteTypeAS(delete: typeADeleteInput, where: typeAWhere): DeleteInfo!
              deleteTypeBS(delete: typeBDeleteInput, where: typeBWhere): DeleteInfo!
              updateTypeAS(update: typeAUpdateInput, where: typeAWhere): UpdateTypeASMutationResponse!
              updateTypeBS(update: typeBUpdateInput, where: typeBWhere): UpdateTypeBSMutationResponse!
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

            \\"\\"\\"Point mutations\\"\\"\\"
            input PointMutations {
              set: PointInput
            }

            type Query {
              ds(limit: Int, offset: Int, where: dWhere): [d!]!
              interfaceCS(limit: Int, offset: Int, sort: [interfaceCSort!], where: interfaceCWhere): [interfaceC!]!
              interfaceCSConnection(after: String, first: Int, sort: [interfaceCSort!], where: interfaceCWhere): InterfaceCSConnection!
              typeAS(limit: Int, offset: Int, sort: [typeASort!], where: typeAWhere): [typeA!]!
              typeASConnection(after: String, first: Int, sort: [typeASort!], where: typeAWhere): TypeASConnection!
              typeBS(limit: Int, offset: Int, sort: [typeBSort!], where: typeBWhere): [typeB!]!
              typeBSConnection(after: String, first: Int, sort: [typeBSort!], where: typeBWhere): TypeBSConnection!
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

            type TypeASConnection {
              aggregate: typeAAggregate!
              edges: [typeAEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type TypeBSConnection {
              aggregate: typeBAggregate!
              edges: [typeBEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type UpdateTypeASMutationResponse {
              info: UpdateInfo!
              typeAS: [typeA!]!
            }

            type UpdateTypeBSMutationResponse {
              info: UpdateInfo!
              typeBS: [typeB!]!
            }

            union d = typeA | typeB

            input dWhere {
              typeA: typeAWhere
              typeB: typeBWhere
            }

            interface interfaceC {
              averageRating: Float!
              cartesianPoint: CartesianPoint
              createdAt: DateTime
              date: Date
              duration: Duration
              list: [String!]!
              localDateTime: LocalDateTime
              localTime: LocalTime
              point: Point
              time: Time
            }

            type interfaceCAggregate {
              count: Count!
              node: interfaceCAggregateNode!
            }

            type interfaceCAggregateNode {
              averageRating: FloatAggregateSelection!
              createdAt: DateTimeAggregateSelection!
              duration: DurationAggregateSelection!
              localDateTime: LocalDateTimeAggregateSelection!
              localTime: LocalTimeAggregateSelection!
              time: TimeAggregateSelection!
            }

            type interfaceCEdge {
              cursor: String!
              node: interfaceC!
            }

            enum interfaceCImplementation {
              typeB
            }

            \\"\\"\\"
            Fields to sort InterfaceCS by. The order in which sorts are applied is not guaranteed when specifying many fields in one interfaceCSort object.
            \\"\\"\\"
            input interfaceCSort {
              averageRating: SortDirection
              cartesianPoint: SortDirection
              createdAt: SortDirection
              date: SortDirection
              duration: SortDirection
              localDateTime: SortDirection
              localTime: SortDirection
              point: SortDirection
              time: SortDirection
            }

            input interfaceCWhere {
              AND: [interfaceCWhere!]
              NOT: interfaceCWhere
              OR: [interfaceCWhere!]
              averageRating: FloatScalarFilters
              cartesianPoint: CartesianPointFilters
              createdAt: DateTimeScalarFilters
              date: DateScalarFilters
              duration: DurationScalarFilters
              list: StringListFilters
              localDateTime: LocalDateTimeScalarFilters
              localTime: LocalTimeScalarFilters
              point: PointFilters
              time: TimeScalarFilters
              typename: [interfaceCImplementation!]
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * typeA.actedIn
            * typeB.rels
            \\"\\"\\"
            type relType {
              averageRating: Float!
              cartesianPoint: CartesianPoint
              createdAt: DateTime
              date: Date
              duration: Duration
              localDateTime: LocalDateTime
              localTime: LocalTime
              pay: [Float!]
              point: Point
              time: Time
            }

            input relTypeAggregationWhereInput {
              AND: [relTypeAggregationWhereInput!]
              NOT: relTypeAggregationWhereInput
              OR: [relTypeAggregationWhereInput!]
              averageRating: FloatScalarAggregationFilters
              averageRating_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { eq: ... } } }' instead.\\")
              averageRating_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { gt: ... } } }' instead.\\")
              averageRating_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { gte: ... } } }' instead.\\")
              averageRating_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { lt: ... } } }' instead.\\")
              averageRating_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { lte: ... } } }' instead.\\")
              averageRating_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { eq: ... } } }' instead.\\")
              averageRating_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { gt: ... } } }' instead.\\")
              averageRating_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { gte: ... } } }' instead.\\")
              averageRating_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { lt: ... } } }' instead.\\")
              averageRating_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { lte: ... } } }' instead.\\")
              averageRating_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { eq: ... } } }' instead.\\")
              averageRating_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { gt: ... } } }' instead.\\")
              averageRating_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { gte: ... } } }' instead.\\")
              averageRating_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { lt: ... } } }' instead.\\")
              averageRating_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { lte: ... } } }' instead.\\")
              averageRating_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { eq: ... } } }' instead.\\")
              averageRating_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { gt: ... } } }' instead.\\")
              averageRating_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { gte: ... } } }' instead.\\")
              averageRating_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { lt: ... } } }' instead.\\")
              averageRating_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { lte: ... } } }' instead.\\")
              createdAt: DateTimeScalarAggregationFilters
              createdAt_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { eq: ... } } }' instead.\\")
              createdAt_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gt: ... } } }' instead.\\")
              createdAt_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gte: ... } } }' instead.\\")
              createdAt_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lt: ... } } }' instead.\\")
              createdAt_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lte: ... } } }' instead.\\")
              createdAt_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { eq: ... } } }' instead.\\")
              createdAt_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gt: ... } } }' instead.\\")
              createdAt_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gte: ... } } }' instead.\\")
              createdAt_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lt: ... } } }' instead.\\")
              createdAt_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lte: ... } } }' instead.\\")
              duration: DurationScalarAggregationFilters
              duration_AVERAGE_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { eq: ... } } }' instead.\\")
              duration_AVERAGE_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { gt: ... } } }' instead.\\")
              duration_AVERAGE_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { gte: ... } } }' instead.\\")
              duration_AVERAGE_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { lt: ... } } }' instead.\\")
              duration_AVERAGE_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { lte: ... } } }' instead.\\")
              duration_MAX_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { eq: ... } } }' instead.\\")
              duration_MAX_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { gt: ... } } }' instead.\\")
              duration_MAX_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { gte: ... } } }' instead.\\")
              duration_MAX_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { lt: ... } } }' instead.\\")
              duration_MAX_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { lte: ... } } }' instead.\\")
              duration_MIN_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { eq: ... } } }' instead.\\")
              duration_MIN_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { gt: ... } } }' instead.\\")
              duration_MIN_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { gte: ... } } }' instead.\\")
              duration_MIN_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { lt: ... } } }' instead.\\")
              duration_MIN_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { lte: ... } } }' instead.\\")
              localDateTime: LocalDateTimeScalarAggregationFilters
              localDateTime_MAX_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { eq: ... } } }' instead.\\")
              localDateTime_MAX_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { gt: ... } } }' instead.\\")
              localDateTime_MAX_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { gte: ... } } }' instead.\\")
              localDateTime_MAX_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { lt: ... } } }' instead.\\")
              localDateTime_MAX_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { lte: ... } } }' instead.\\")
              localDateTime_MIN_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { eq: ... } } }' instead.\\")
              localDateTime_MIN_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { gt: ... } } }' instead.\\")
              localDateTime_MIN_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { gte: ... } } }' instead.\\")
              localDateTime_MIN_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { lt: ... } } }' instead.\\")
              localDateTime_MIN_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { lte: ... } } }' instead.\\")
              localTime: LocalTimeScalarAggregationFilters
              localTime_MAX_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { eq: ... } } }' instead.\\")
              localTime_MAX_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { gt: ... } } }' instead.\\")
              localTime_MAX_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { gte: ... } } }' instead.\\")
              localTime_MAX_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { lt: ... } } }' instead.\\")
              localTime_MAX_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { lte: ... } } }' instead.\\")
              localTime_MIN_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { eq: ... } } }' instead.\\")
              localTime_MIN_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { gt: ... } } }' instead.\\")
              localTime_MIN_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { gte: ... } } }' instead.\\")
              localTime_MIN_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { lt: ... } } }' instead.\\")
              localTime_MIN_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { lte: ... } } }' instead.\\")
              time: TimeScalarAggregationFilters
              time_MAX_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { eq: ... } } }' instead.\\")
              time_MAX_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { gt: ... } } }' instead.\\")
              time_MAX_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { gte: ... } } }' instead.\\")
              time_MAX_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { lt: ... } } }' instead.\\")
              time_MAX_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { lte: ... } } }' instead.\\")
              time_MIN_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { eq: ... } } }' instead.\\")
              time_MIN_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { gt: ... } } }' instead.\\")
              time_MIN_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { gte: ... } } }' instead.\\")
              time_MIN_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { lt: ... } } }' instead.\\")
              time_MIN_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { lte: ... } } }' instead.\\")
            }

            input relTypeCreateInput {
              averageRating: Float!
              cartesianPoint: CartesianPointInput
              createdAt: DateTime
              date: Date
              duration: Duration
              localDateTime: LocalDateTime
              localTime: LocalTime
              pay: [Float!]
              point: PointInput
              time: Time
            }

            input relTypeSort {
              averageRating: SortDirection
              cartesianPoint: SortDirection
              createdAt: SortDirection
              date: SortDirection
              duration: SortDirection
              localDateTime: SortDirection
              localTime: SortDirection
              pay: SortDirection
              point: SortDirection
              time: SortDirection
            }

            input relTypeUpdateInput {
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              cartesianPoint: CartesianPointMutations
              cartesianPoint_SET: CartesianPointInput @deprecated(reason: \\"Please use the generic mutation 'cartesianPoint: { set: ... } }' instead.\\")
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'createdAt: { set: ... } }' instead.\\")
              date: DateScalarMutations
              date_SET: Date @deprecated(reason: \\"Please use the generic mutation 'date: { set: ... } }' instead.\\")
              duration: DurationScalarMutations
              duration_SET: Duration @deprecated(reason: \\"Please use the generic mutation 'duration: { set: ... } }' instead.\\")
              localDateTime: LocalDateTimeScalarMutations
              localDateTime_SET: LocalDateTime @deprecated(reason: \\"Please use the generic mutation 'localDateTime: { set: ... } }' instead.\\")
              localTime: LocalTimeScalarMutations
              localTime_SET: LocalTime @deprecated(reason: \\"Please use the generic mutation 'localTime: { set: ... } }' instead.\\")
              pay: ListFloatMutations
              pay_POP: Int @deprecated(reason: \\"Please use the generic mutation 'pay: { pop: ... } }' instead.\\")
              pay_PUSH: [Float!] @deprecated(reason: \\"Please use the generic mutation 'pay: { push: ... } }' instead.\\")
              pay_SET: [Float!] @deprecated(reason: \\"Please use the generic mutation 'pay: { set: ... } }' instead.\\")
              point: PointMutations
              point_SET: PointInput @deprecated(reason: \\"Please use the generic mutation 'point: { set: ... } }' instead.\\")
              time: TimeScalarMutations
              time_SET: Time @deprecated(reason: \\"Please use the generic mutation 'time: { set: ... } }' instead.\\")
            }

            input relTypeWhere {
              AND: [relTypeWhere!]
              NOT: relTypeWhere
              OR: [relTypeWhere!]
              averageRating: FloatScalarFilters
              cartesianPoint: CartesianPointFilters
              createdAt: DateTimeScalarFilters
              date: DateScalarFilters
              duration: DurationScalarFilters
              localDateTime: LocalDateTimeScalarFilters
              localTime: LocalTimeScalarFilters
              pay: FloatListFilters
              point: PointFilters
              time: TimeScalarFilters
            }

            type typeA {
              actedIn(limit: Int, offset: Int, sort: [typeBSort!], where: typeBWhere): [typeB!]!
              actedInConnection(after: String, first: Int, sort: [typeAActedInConnectionSort!], where: typeAActedInConnectionWhere): typeAActedInConnection!
              name: String
            }

            input typeAActedInAggregateInput {
              AND: [typeAActedInAggregateInput!]
              NOT: typeAActedInAggregateInput
              OR: [typeAActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: relTypeAggregationWhereInput
              node: typeAActedInNodeAggregationWhereInput
            }

            input typeAActedInConnectFieldInput {
              connect: [typeBConnectInput!]
              edge: relTypeCreateInput!
              where: typeBConnectWhere
            }

            type typeAActedInConnection {
              aggregate: typeAtypeBActedInAggregateSelection!
              edges: [typeAActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input typeAActedInConnectionAggregateInput {
              AND: [typeAActedInConnectionAggregateInput!]
              NOT: typeAActedInConnectionAggregateInput
              OR: [typeAActedInConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: relTypeAggregationWhereInput
              node: typeAActedInNodeAggregationWhereInput
            }

            input typeAActedInConnectionFilters {
              \\"\\"\\"
              Filter typeAS by aggregating results on related typeAActedInConnections
              \\"\\"\\"
              aggregate: typeAActedInConnectionAggregateInput
              \\"\\"\\"
              Return typeAS where all of the related typeAActedInConnections match this filter
              \\"\\"\\"
              all: typeAActedInConnectionWhere
              \\"\\"\\"
              Return typeAS where none of the related typeAActedInConnections match this filter
              \\"\\"\\"
              none: typeAActedInConnectionWhere
              \\"\\"\\"
              Return typeAS where one of the related typeAActedInConnections match this filter
              \\"\\"\\"
              single: typeAActedInConnectionWhere
              \\"\\"\\"
              Return typeAS where some of the related typeAActedInConnections match this filter
              \\"\\"\\"
              some: typeAActedInConnectionWhere
            }

            input typeAActedInConnectionSort {
              edge: relTypeSort
              node: typeBSort
            }

            input typeAActedInConnectionWhere {
              AND: [typeAActedInConnectionWhere!]
              NOT: typeAActedInConnectionWhere
              OR: [typeAActedInConnectionWhere!]
              edge: relTypeWhere
              node: typeBWhere
            }

            input typeAActedInCreateFieldInput {
              edge: relTypeCreateInput!
              node: typeBCreateInput!
            }

            input typeAActedInDeleteFieldInput {
              delete: typeBDeleteInput
              where: typeAActedInConnectionWhere
            }

            input typeAActedInDisconnectFieldInput {
              disconnect: typeBDisconnectInput
              where: typeAActedInConnectionWhere
            }

            input typeAActedInFieldInput {
              connect: [typeAActedInConnectFieldInput!]
              create: [typeAActedInCreateFieldInput!]
            }

            input typeAActedInNodeAggregationWhereInput {
              AND: [typeAActedInNodeAggregationWhereInput!]
              NOT: typeAActedInNodeAggregationWhereInput
              OR: [typeAActedInNodeAggregationWhereInput!]
              averageRating: FloatScalarAggregationFilters
              averageRating_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { eq: ... } } }' instead.\\")
              averageRating_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { gt: ... } } }' instead.\\")
              averageRating_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { gte: ... } } }' instead.\\")
              averageRating_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { lt: ... } } }' instead.\\")
              averageRating_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { average: { lte: ... } } }' instead.\\")
              averageRating_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { eq: ... } } }' instead.\\")
              averageRating_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { gt: ... } } }' instead.\\")
              averageRating_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { gte: ... } } }' instead.\\")
              averageRating_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { lt: ... } } }' instead.\\")
              averageRating_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { max: { lte: ... } } }' instead.\\")
              averageRating_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { eq: ... } } }' instead.\\")
              averageRating_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { gt: ... } } }' instead.\\")
              averageRating_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { gte: ... } } }' instead.\\")
              averageRating_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { lt: ... } } }' instead.\\")
              averageRating_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { min: { lte: ... } } }' instead.\\")
              averageRating_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { eq: ... } } }' instead.\\")
              averageRating_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { gt: ... } } }' instead.\\")
              averageRating_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { gte: ... } } }' instead.\\")
              averageRating_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { lt: ... } } }' instead.\\")
              averageRating_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'averageRating: { sum: { lte: ... } } }' instead.\\")
              createdAt: DateTimeScalarAggregationFilters
              createdAt_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { eq: ... } } }' instead.\\")
              createdAt_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gt: ... } } }' instead.\\")
              createdAt_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gte: ... } } }' instead.\\")
              createdAt_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lt: ... } } }' instead.\\")
              createdAt_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lte: ... } } }' instead.\\")
              createdAt_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { eq: ... } } }' instead.\\")
              createdAt_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gt: ... } } }' instead.\\")
              createdAt_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gte: ... } } }' instead.\\")
              createdAt_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lt: ... } } }' instead.\\")
              createdAt_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lte: ... } } }' instead.\\")
              duration: DurationScalarAggregationFilters
              duration_AVERAGE_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { eq: ... } } }' instead.\\")
              duration_AVERAGE_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { gt: ... } } }' instead.\\")
              duration_AVERAGE_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { gte: ... } } }' instead.\\")
              duration_AVERAGE_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { lt: ... } } }' instead.\\")
              duration_AVERAGE_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { average: { lte: ... } } }' instead.\\")
              duration_MAX_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { eq: ... } } }' instead.\\")
              duration_MAX_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { gt: ... } } }' instead.\\")
              duration_MAX_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { gte: ... } } }' instead.\\")
              duration_MAX_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { lt: ... } } }' instead.\\")
              duration_MAX_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { max: { lte: ... } } }' instead.\\")
              duration_MIN_EQUAL: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { eq: ... } } }' instead.\\")
              duration_MIN_GT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { gt: ... } } }' instead.\\")
              duration_MIN_GTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { gte: ... } } }' instead.\\")
              duration_MIN_LT: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { lt: ... } } }' instead.\\")
              duration_MIN_LTE: Duration @deprecated(reason: \\"Please use the relevant generic filter 'duration: { min: { lte: ... } } }' instead.\\")
              localDateTime: LocalDateTimeScalarAggregationFilters
              localDateTime_MAX_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { eq: ... } } }' instead.\\")
              localDateTime_MAX_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { gt: ... } } }' instead.\\")
              localDateTime_MAX_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { gte: ... } } }' instead.\\")
              localDateTime_MAX_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { lt: ... } } }' instead.\\")
              localDateTime_MAX_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { max: { lte: ... } } }' instead.\\")
              localDateTime_MIN_EQUAL: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { eq: ... } } }' instead.\\")
              localDateTime_MIN_GT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { gt: ... } } }' instead.\\")
              localDateTime_MIN_GTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { gte: ... } } }' instead.\\")
              localDateTime_MIN_LT: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { lt: ... } } }' instead.\\")
              localDateTime_MIN_LTE: LocalDateTime @deprecated(reason: \\"Please use the relevant generic filter 'localDateTime: { min: { lte: ... } } }' instead.\\")
              localTime: LocalTimeScalarAggregationFilters
              localTime_MAX_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { eq: ... } } }' instead.\\")
              localTime_MAX_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { gt: ... } } }' instead.\\")
              localTime_MAX_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { gte: ... } } }' instead.\\")
              localTime_MAX_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { lt: ... } } }' instead.\\")
              localTime_MAX_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { max: { lte: ... } } }' instead.\\")
              localTime_MIN_EQUAL: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { eq: ... } } }' instead.\\")
              localTime_MIN_GT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { gt: ... } } }' instead.\\")
              localTime_MIN_GTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { gte: ... } } }' instead.\\")
              localTime_MIN_LT: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { lt: ... } } }' instead.\\")
              localTime_MIN_LTE: LocalTime @deprecated(reason: \\"Please use the relevant generic filter 'localTime: { min: { lte: ... } } }' instead.\\")
              time: TimeScalarAggregationFilters
              time_MAX_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { eq: ... } } }' instead.\\")
              time_MAX_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { gt: ... } } }' instead.\\")
              time_MAX_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { gte: ... } } }' instead.\\")
              time_MAX_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { lt: ... } } }' instead.\\")
              time_MAX_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { max: { lte: ... } } }' instead.\\")
              time_MIN_EQUAL: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { eq: ... } } }' instead.\\")
              time_MIN_GT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { gt: ... } } }' instead.\\")
              time_MIN_GTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { gte: ... } } }' instead.\\")
              time_MIN_LT: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { lt: ... } } }' instead.\\")
              time_MIN_LTE: Time @deprecated(reason: \\"Please use the relevant generic filter 'time: { min: { lte: ... } } }' instead.\\")
            }

            type typeAActedInRelationship {
              cursor: String!
              node: typeB!
              properties: relType!
            }

            input typeAActedInUpdateConnectionInput {
              edge: relTypeUpdateInput
              node: typeBUpdateInput
              where: typeAActedInConnectionWhere
            }

            input typeAActedInUpdateFieldInput {
              connect: [typeAActedInConnectFieldInput!]
              create: [typeAActedInCreateFieldInput!]
              delete: [typeAActedInDeleteFieldInput!]
              disconnect: [typeAActedInDisconnectFieldInput!]
              update: typeAActedInUpdateConnectionInput
            }

            type typeAAggregate {
              count: Count!
              node: typeAAggregateNode!
            }

            type typeAAggregateNode {
              name: StringAggregateSelection!
            }

            input typeAConnectInput {
              actedIn: [typeAActedInConnectFieldInput!]
            }

            input typeAConnectWhere {
              node: typeAWhere!
            }

            input typeACreateInput {
              actedIn: typeAActedInFieldInput
              name: String
            }

            input typeADeleteInput {
              actedIn: [typeAActedInDeleteFieldInput!]
            }

            input typeADisconnectInput {
              actedIn: [typeAActedInDisconnectFieldInput!]
            }

            type typeAEdge {
              cursor: String!
              node: typeA!
            }

            input typeARelationshipFilters {
              \\"\\"\\"Filter type where all of the related typeAS match this filter\\"\\"\\"
              all: typeAWhere
              \\"\\"\\"Filter type where none of the related typeAS match this filter\\"\\"\\"
              none: typeAWhere
              \\"\\"\\"Filter type where one of the related typeAS match this filter\\"\\"\\"
              single: typeAWhere
              \\"\\"\\"Filter type where some of the related typeAS match this filter\\"\\"\\"
              some: typeAWhere
            }

            \\"\\"\\"
            Fields to sort TypeAS by. The order in which sorts are applied is not guaranteed when specifying many fields in one typeASort object.
            \\"\\"\\"
            input typeASort {
              name: SortDirection
            }

            input typeAUpdateInput {
              actedIn: [typeAActedInUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input typeAWhere {
              AND: [typeAWhere!]
              NOT: typeAWhere
              OR: [typeAWhere!]
              actedIn: typeBRelationshipFilters
              actedInAggregate: typeAActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
              actedInConnection: typeAActedInConnectionFilters
              \\"\\"\\"
              Return typeAS where all of the related typeAActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: typeAActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return typeAS where none of the related typeAActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: typeAActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return typeAS where one of the related typeAActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: typeAActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return typeAS where some of the related typeAActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: typeAActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return typeAS where all of the related typeBS match this filter\\"\\"\\"
              actedIn_ALL: typeBWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return typeAS where none of the related typeBS match this filter\\"\\"\\"
              actedIn_NONE: typeBWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return typeAS where one of the related typeBS match this filter\\"\\"\\"
              actedIn_SINGLE: typeBWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return typeAS where some of the related typeBS match this filter\\"\\"\\"
              actedIn_SOME: typeBWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              name: StringScalarFilters
            }

            type typeAtypeBActedInAggregateSelection {
              count: CountConnection!
              edge: typeAtypeBActedInEdgeAggregateSelection
              node: typeAtypeBActedInNodeAggregateSelection
            }

            type typeAtypeBActedInEdgeAggregateSelection {
              averageRating: FloatAggregateSelection!
              createdAt: DateTimeAggregateSelection!
              duration: DurationAggregateSelection!
              localDateTime: LocalDateTimeAggregateSelection!
              localTime: LocalTimeAggregateSelection!
              time: TimeAggregateSelection!
            }

            type typeAtypeBActedInNodeAggregateSelection {
              averageRating: FloatAggregateSelection!
              createdAt: DateTimeAggregateSelection!
              duration: DurationAggregateSelection!
              localDateTime: LocalDateTimeAggregateSelection!
              localTime: LocalTimeAggregateSelection!
              time: TimeAggregateSelection!
            }

            type typeB implements interfaceC {
              averageRating: Float!
              cartesianPoint: CartesianPoint
              createdAt: DateTime
              date: Date
              duration: Duration
              id: ID!
              list: [String!]!
              localDateTime: LocalDateTime
              localTime: LocalTime
              point: Point
              ratings: [Float!]!
              rels(limit: Int, offset: Int, sort: [typeASort!], where: typeAWhere): [typeA!]!
              relsConnection(after: String, first: Int, sort: [typeBRelsConnectionSort!], where: typeBRelsConnectionWhere): typeBRelsConnection!
              time: Time
            }

            type typeBAggregate {
              count: Count!
              node: typeBAggregateNode!
            }

            type typeBAggregateNode {
              averageRating: FloatAggregateSelection!
              createdAt: DateTimeAggregateSelection!
              duration: DurationAggregateSelection!
              localDateTime: LocalDateTimeAggregateSelection!
              localTime: LocalTimeAggregateSelection!
              time: TimeAggregateSelection!
            }

            input typeBConnectInput {
              rels: [typeBRelsConnectFieldInput!]
            }

            input typeBConnectWhere {
              node: typeBWhere!
            }

            input typeBCreateInput {
              averageRating: Float!
              cartesianPoint: CartesianPointInput
              createdAt: DateTime
              date: Date
              duration: Duration
              id: ID!
              list: [String!]!
              localDateTime: LocalDateTime
              localTime: LocalTime
              point: PointInput
              ratings: [Float!]!
              rels: typeBRelsFieldInput
              time: Time
            }

            input typeBDeleteInput {
              rels: [typeBRelsDeleteFieldInput!]
            }

            input typeBDisconnectInput {
              rels: [typeBRelsDisconnectFieldInput!]
            }

            type typeBEdge {
              cursor: String!
              node: typeB!
            }

            input typeBRelationshipFilters {
              \\"\\"\\"Filter type where all of the related typeBS match this filter\\"\\"\\"
              all: typeBWhere
              \\"\\"\\"Filter type where none of the related typeBS match this filter\\"\\"\\"
              none: typeBWhere
              \\"\\"\\"Filter type where one of the related typeBS match this filter\\"\\"\\"
              single: typeBWhere
              \\"\\"\\"Filter type where some of the related typeBS match this filter\\"\\"\\"
              some: typeBWhere
            }

            input typeBRelsAggregateInput {
              AND: [typeBRelsAggregateInput!]
              NOT: typeBRelsAggregateInput
              OR: [typeBRelsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: relTypeAggregationWhereInput
              node: typeBRelsNodeAggregationWhereInput
            }

            input typeBRelsConnectFieldInput {
              connect: [typeAConnectInput!]
              edge: relTypeCreateInput!
              where: typeAConnectWhere
            }

            type typeBRelsConnection {
              aggregate: typeBtypeARelsAggregateSelection!
              edges: [typeBRelsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input typeBRelsConnectionAggregateInput {
              AND: [typeBRelsConnectionAggregateInput!]
              NOT: typeBRelsConnectionAggregateInput
              OR: [typeBRelsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: relTypeAggregationWhereInput
              node: typeBRelsNodeAggregationWhereInput
            }

            input typeBRelsConnectionFilters {
              \\"\\"\\"Filter typeBS by aggregating results on related typeBRelsConnections\\"\\"\\"
              aggregate: typeBRelsConnectionAggregateInput
              \\"\\"\\"
              Return typeBS where all of the related typeBRelsConnections match this filter
              \\"\\"\\"
              all: typeBRelsConnectionWhere
              \\"\\"\\"
              Return typeBS where none of the related typeBRelsConnections match this filter
              \\"\\"\\"
              none: typeBRelsConnectionWhere
              \\"\\"\\"
              Return typeBS where one of the related typeBRelsConnections match this filter
              \\"\\"\\"
              single: typeBRelsConnectionWhere
              \\"\\"\\"
              Return typeBS where some of the related typeBRelsConnections match this filter
              \\"\\"\\"
              some: typeBRelsConnectionWhere
            }

            input typeBRelsConnectionSort {
              edge: relTypeSort
              node: typeASort
            }

            input typeBRelsConnectionWhere {
              AND: [typeBRelsConnectionWhere!]
              NOT: typeBRelsConnectionWhere
              OR: [typeBRelsConnectionWhere!]
              edge: relTypeWhere
              node: typeAWhere
            }

            input typeBRelsCreateFieldInput {
              edge: relTypeCreateInput!
              node: typeACreateInput!
            }

            input typeBRelsDeleteFieldInput {
              delete: typeADeleteInput
              where: typeBRelsConnectionWhere
            }

            input typeBRelsDisconnectFieldInput {
              disconnect: typeADisconnectInput
              where: typeBRelsConnectionWhere
            }

            input typeBRelsFieldInput {
              connect: [typeBRelsConnectFieldInput!]
              create: [typeBRelsCreateFieldInput!]
            }

            input typeBRelsNodeAggregationWhereInput {
              AND: [typeBRelsNodeAggregationWhereInput!]
              NOT: typeBRelsNodeAggregationWhereInput
              OR: [typeBRelsNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type typeBRelsRelationship {
              cursor: String!
              node: typeA!
              properties: relType!
            }

            input typeBRelsUpdateConnectionInput {
              edge: relTypeUpdateInput
              node: typeAUpdateInput
              where: typeBRelsConnectionWhere
            }

            input typeBRelsUpdateFieldInput {
              connect: [typeBRelsConnectFieldInput!]
              create: [typeBRelsCreateFieldInput!]
              delete: [typeBRelsDeleteFieldInput!]
              disconnect: [typeBRelsDisconnectFieldInput!]
              update: typeBRelsUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort TypeBS by. The order in which sorts are applied is not guaranteed when specifying many fields in one typeBSort object.
            \\"\\"\\"
            input typeBSort {
              averageRating: SortDirection
              cartesianPoint: SortDirection
              createdAt: SortDirection
              date: SortDirection
              duration: SortDirection
              id: SortDirection
              localDateTime: SortDirection
              localTime: SortDirection
              point: SortDirection
              time: SortDirection
            }

            input typeBUpdateInput {
              averageRating: FloatScalarMutations
              averageRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { add: ... } }' instead.\\")
              averageRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { divide: ... } }' instead.\\")
              averageRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { multiply: ... } }' instead.\\")
              averageRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'averageRating: { set: ... } }' instead.\\")
              averageRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'averageRating: { subtract: ... } }' instead.\\")
              cartesianPoint: CartesianPointMutations
              cartesianPoint_SET: CartesianPointInput @deprecated(reason: \\"Please use the generic mutation 'cartesianPoint: { set: ... } }' instead.\\")
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'createdAt: { set: ... } }' instead.\\")
              date: DateScalarMutations
              date_SET: Date @deprecated(reason: \\"Please use the generic mutation 'date: { set: ... } }' instead.\\")
              duration: DurationScalarMutations
              duration_SET: Duration @deprecated(reason: \\"Please use the generic mutation 'duration: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              list: ListStringMutations
              list_POP: Int @deprecated(reason: \\"Please use the generic mutation 'list: { pop: ... } }' instead.\\")
              list_PUSH: [String!] @deprecated(reason: \\"Please use the generic mutation 'list: { push: ... } }' instead.\\")
              list_SET: [String!] @deprecated(reason: \\"Please use the generic mutation 'list: { set: ... } }' instead.\\")
              localDateTime: LocalDateTimeScalarMutations
              localDateTime_SET: LocalDateTime @deprecated(reason: \\"Please use the generic mutation 'localDateTime: { set: ... } }' instead.\\")
              localTime: LocalTimeScalarMutations
              localTime_SET: LocalTime @deprecated(reason: \\"Please use the generic mutation 'localTime: { set: ... } }' instead.\\")
              point: PointMutations
              point_SET: PointInput @deprecated(reason: \\"Please use the generic mutation 'point: { set: ... } }' instead.\\")
              ratings: ListFloatMutations
              ratings_POP: Int @deprecated(reason: \\"Please use the generic mutation 'ratings: { pop: ... } }' instead.\\")
              ratings_PUSH: [Float!] @deprecated(reason: \\"Please use the generic mutation 'ratings: { push: ... } }' instead.\\")
              ratings_SET: [Float!] @deprecated(reason: \\"Please use the generic mutation 'ratings: { set: ... } }' instead.\\")
              rels: [typeBRelsUpdateFieldInput!]
              time: TimeScalarMutations
              time_SET: Time @deprecated(reason: \\"Please use the generic mutation 'time: { set: ... } }' instead.\\")
            }

            input typeBWhere {
              AND: [typeBWhere!]
              NOT: typeBWhere
              OR: [typeBWhere!]
              averageRating: FloatScalarFilters
              cartesianPoint: CartesianPointFilters
              createdAt: DateTimeScalarFilters
              date: DateScalarFilters
              duration: DurationScalarFilters
              id: IDScalarFilters
              list: StringListFilters
              localDateTime: LocalDateTimeScalarFilters
              localTime: LocalTimeScalarFilters
              point: PointFilters
              ratings: FloatListFilters
              rels: typeARelationshipFilters
              relsAggregate: typeBRelsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the relsConnection filter, please use { relsConnection: { aggregate: {...} } } instead\\")
              relsConnection: typeBRelsConnectionFilters
              \\"\\"\\"
              Return typeBS where all of the related typeBRelsConnections match this filter
              \\"\\"\\"
              relsConnection_ALL: typeBRelsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return typeBS where none of the related typeBRelsConnections match this filter
              \\"\\"\\"
              relsConnection_NONE: typeBRelsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return typeBS where one of the related typeBRelsConnections match this filter
              \\"\\"\\"
              relsConnection_SINGLE: typeBRelsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return typeBS where some of the related typeBRelsConnections match this filter
              \\"\\"\\"
              relsConnection_SOME: typeBRelsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'relsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return typeBS where all of the related typeAS match this filter\\"\\"\\"
              rels_ALL: typeAWhere @deprecated(reason: \\"Please use the relevant generic filter 'rels: { all: ... }' instead.\\")
              \\"\\"\\"Return typeBS where none of the related typeAS match this filter\\"\\"\\"
              rels_NONE: typeAWhere @deprecated(reason: \\"Please use the relevant generic filter 'rels: { none: ... }' instead.\\")
              \\"\\"\\"Return typeBS where one of the related typeAS match this filter\\"\\"\\"
              rels_SINGLE: typeAWhere @deprecated(reason: \\"Please use the relevant generic filter 'rels: {  single: ... }' instead.\\")
              \\"\\"\\"Return typeBS where some of the related typeAS match this filter\\"\\"\\"
              rels_SOME: typeAWhere @deprecated(reason: \\"Please use the relevant generic filter 'rels: {  some: ... }' instead.\\")
              time: TimeScalarFilters
            }

            type typeBtypeARelsAggregateSelection {
              count: CountConnection!
              edge: typeBtypeARelsEdgeAggregateSelection
              node: typeBtypeARelsNodeAggregateSelection
            }

            type typeBtypeARelsEdgeAggregateSelection {
              averageRating: FloatAggregateSelection!
              createdAt: DateTimeAggregateSelection!
              duration: DurationAggregateSelection!
              localDateTime: LocalDateTimeAggregateSelection!
              localTime: LocalTimeAggregateSelection!
              time: TimeAggregateSelection!
            }

            type typeBtypeARelsNodeAggregateSelection {
              name: StringAggregateSelection!
            }"
        `);
    });
});
