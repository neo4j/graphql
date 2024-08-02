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
import { raiseOnInvalidSchema } from "../../../utils/raise-on-invalid-schema";

describe("@default", () => {
    test("@default should add a default value in mutation inputs", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID! @default(value: "id")
                title: String @default(value: "title")
                year: Int @default(value: 2021)
                length: Float @default(value: 120.5)
                isReleased: Boolean @default(value: true)
                playedCounter: BigInt @default(value: "100")
                duration: Duration @default(value: "PT190M")
                releasedDate: Date @default(value: "2021-01-01")
                releasedTime: Time @default(value: "00:00:00")
                releasedDateTime: DateTime @default(value: "2021-01-01T00:00:00")
                releasedLocalTime: LocalTime @default(value: "00:00:00")
                releasedLocalDateTime: LocalDateTime @default(value: "2015-07-04T19:32:24")
                premiereLocation: Point @default(value: { longitude: 1, latitude: 2 })
                premiereGeoLocation: CartesianPoint @default(value: { x: 1, y: 2 })
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getAuraSchema();
        raiseOnInvalidSchema(schema);
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            input BigIntWhere {
              AND: [BigIntWhere!]
              NOT: BigIntWhere
              OR: [BigIntWhere!]
              equals: BigInt
              gt: BigInt
              gte: BigInt
              in: [BigInt!]
              lt: BigInt
              lte: BigInt
            }

            input BooleanWhere {
              AND: [BooleanWhere!]
              NOT: BooleanWhere
              OR: [BooleanWhere!]
              equals: Boolean
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

            \\"\\"\\"Input type for a cartesian point\\"\\"\\"
            input CartesianPointInput {
              x: Float!
              y: Float!
              z: Float
            }

            \\"\\"\\"A date, represented as a 'yyyy-mm-dd' string\\"\\"\\"
            scalar Date

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            input DateTimeWhere {
              AND: [DateTimeWhere!]
              NOT: DateTimeWhere
              OR: [DateTimeWhere!]
              equals: DateTime
              gt: DateTime
              gte: DateTime
              in: [DateTime!]
              lt: DateTime
              lte: DateTime
            }

            input DateWhere {
              AND: [DateWhere!]
              NOT: DateWhere
              OR: [DateWhere!]
              equals: Date
              gt: Date
              gte: Date
              in: [Date!]
              lt: Date
              lte: Date
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            input DurationWhere {
              AND: [DurationWhere!]
              NOT: DurationWhere
              OR: [DurationWhere!]
              equals: Duration
              gt: Duration
              gte: Duration
              in: [Duration!]
              lt: Duration
              lte: Duration
            }

            input FloatWhere {
              AND: [FloatWhere!]
              NOT: FloatWhere
              OR: [FloatWhere!]
              equals: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            input IDWhere {
              AND: [IDWhere!]
              NOT: IDWhere
              OR: [IDWhere!]
              contains: ID
              endsWith: ID
              equals: ID
              in: [ID!]
              startsWith: ID
            }

            input IntWhere {
              AND: [IntWhere!]
              NOT: IntWhere
              OR: [IntWhere!]
              equals: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            input LocalDateTimeWhere {
              AND: [LocalDateTimeWhere!]
              NOT: LocalDateTimeWhere
              OR: [LocalDateTimeWhere!]
              equals: LocalDateTime
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

            input LocalTimeWhere {
              AND: [LocalTimeWhere!]
              NOT: LocalTimeWhere
              OR: [LocalTimeWhere!]
              equals: LocalTime
              gt: LocalTime
              gte: LocalTime
              in: [LocalTime!]
              lt: LocalTime
              lte: LocalTime
            }

            type Movie {
              duration: Duration
              id: ID!
              isReleased: Boolean
              length: Float
              playedCounter: BigInt
              premiereGeoLocation: CartesianPoint
              premiereLocation: Point
              releasedDate: Date
              releasedDateTime: DateTime
              releasedLocalDateTime: LocalDateTime
              releasedLocalTime: LocalTime
              releasedTime: Time
              title: String
              year: Int
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            input MovieConnectionSort {
              node: MovieSort
            }

            type MovieCreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              duration: Duration = \\"P0M0DT11400S\\"
              id: ID! = \\"id\\"
              isReleased: Boolean = true
              length: Float = 120.5
              playedCounter: BigInt = \\"100\\"
              premiereGeoLocation: CartesianPointInput = {x: 1, y: 2}
              premiereLocation: PointInput = {latitude: 2, longitude: 1}
              releasedDate: Date = \\"2021-01-01\\"
              releasedDateTime: DateTime = \\"2021-01-01T00:00:00.000Z\\"
              releasedLocalDateTime: LocalDateTime = \\"2015-07-04T19:32:24\\"
              releasedLocalTime: LocalTime = \\"00:00:00\\"
              releasedTime: Time = \\"00:00:00Z\\"
              title: String = \\"title\\"
              year: Int = 2021
            }

            type MovieCreateResponse {
              info: MovieCreateInfo
              movies: [Movie!]!
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            type MovieOperation {
              connection(after: String, first: Int, sort: [MovieConnectionSort!]): MovieConnection
            }

            input MovieOperationWhere {
              AND: [MovieOperationWhere!]
              NOT: MovieOperationWhere
              OR: [MovieOperationWhere!]
              node: MovieWhere
            }

            input MovieSort {
              duration: SortDirection
              id: SortDirection
              isReleased: SortDirection
              length: SortDirection
              playedCounter: SortDirection
              releasedDate: SortDirection
              releasedDateTime: SortDirection
              releasedLocalDateTime: SortDirection
              releasedLocalTime: SortDirection
              releasedTime: SortDirection
              title: SortDirection
              year: SortDirection
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              duration: DurationWhere
              id: IDWhere
              isReleased: BooleanWhere
              length: FloatWhere
              playedCounter: BigIntWhere
              releasedDate: DateWhere
              releasedDateTime: DateTimeWhere
              releasedLocalDateTime: LocalDateTimeWhere
              releasedLocalTime: LocalTimeWhere
              releasedTime: TimeWhere
              title: StringWhere
              year: IntWhere
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
            }

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

            \\"\\"\\"Input type for a point\\"\\"\\"
            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            type Query {
              movies(where: MovieOperationWhere): MovieOperation
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              startsWith: String
            }

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            input TimeWhere {
              AND: [TimeWhere!]
              NOT: TimeWhere
              OR: [TimeWhere!]
              equals: Time
              gt: Time
              gte: Time
              in: [Time!]
              lt: Time
              lte: Time
            }"
        `);
    });
    test.todo("@default directive with invalid values");
    test.todo("@default directive with list properties");
    test.todo("@default directive with relationship properties");
    test.todo("@default directive with user defined scalars");
});
