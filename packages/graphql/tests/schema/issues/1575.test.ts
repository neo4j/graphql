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

describe("https://github.com/neo4j/graphql/issues/1575", () => {
    test("Properties with same alias value", async () => {
        const typeDefs = /* GraphQL */ `
            type Foo @node {
                point: Point
                geo_point: Point @alias(property: "point")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateFoosMutationResponse {
              foos: [Foo!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Foo {
              geo_point: Point
              point: Point
            }

            type FooAggregateSelection {
              count: Int!
            }

            input FooCreateInput {
              geo_point: PointInput
              point: PointInput
            }

            type FooEdge {
              cursor: String!
              node: Foo!
            }

            \\"\\"\\"
            Fields to sort Foos by. The order in which sorts are applied is not guaranteed when specifying many fields in one FooSort object.
            \\"\\"\\"
            input FooSort {
              geo_point: SortDirection
              point: SortDirection
            }

            input FooUpdateInput {
              geo_point: PointMutations
              geo_point_SET: PointInput @deprecated(reason: \\"Please use the generic mutation 'geo_point: { set: ... } }' instead.\\")
              point: PointMutations
              point_SET: PointInput @deprecated(reason: \\"Please use the generic mutation 'point: { set: ... } }' instead.\\")
            }

            input FooWhere {
              AND: [FooWhere!]
              NOT: FooWhere
              OR: [FooWhere!]
              geo_point: PointFilters
              geo_point_DISTANCE: PointDistance
              geo_point_EQ: PointInput
              geo_point_GT: PointDistance
              geo_point_GTE: PointDistance
              geo_point_IN: [PointInput]
              geo_point_LT: PointDistance
              geo_point_LTE: PointDistance
              point: PointFilters
              point_DISTANCE: PointDistance
              point_EQ: PointInput
              point_GT: PointDistance
              point_GTE: PointDistance
              point_IN: [PointInput]
              point_LT: PointDistance
              point_LTE: PointDistance
            }

            type FoosConnection {
              edges: [FooEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createFoos(input: [FooCreateInput!]!): CreateFoosMutationResponse!
              deleteFoos(where: FooWhere): DeleteInfo!
              updateFoos(update: FooUpdateInput, where: FooWhere): UpdateFoosMutationResponse!
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
              equals: PointDistance
              greaterThan: PointDistance
              greaterThanEquals: PointDistance
              lessThan: PointDistance
              lessThanEquals: PointDistance
            }

            \\"\\"\\"Point filters\\"\\"\\"
            input PointFilters {
              distance: PointDistanceFilters
              equals: PointInput
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
              foos(limit: Int, offset: Int, sort: [FooSort!], where: FooWhere): [Foo!]!
              foosAggregate(where: FooWhere): FooAggregateSelection!
              foosConnection(after: String, first: Int, sort: [FooSort!], where: FooWhere): FoosConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type UpdateFoosMutationResponse {
              foos: [Foo!]!
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
            }"
        `);
    });
});
