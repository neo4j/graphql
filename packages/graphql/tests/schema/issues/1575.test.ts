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

            type Count {
              nodes: Int!
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

            type FooAggregate {
              count: Count!
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
              geo_point_DISTANCE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter geo_point: { distance: ... }\\")
              geo_point_EQ: PointInput @deprecated(reason: \\"Please use the relevant generic filter geo_point: { eq: ... }\\")
              geo_point_GT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter geo_point: { gt: ... }\\")
              geo_point_GTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter geo_point: { gte: ... }\\")
              geo_point_IN: [PointInput] @deprecated(reason: \\"Please use the relevant generic filter geo_point: { in: ... }\\")
              geo_point_LT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter geo_point: { lt: ... }\\")
              geo_point_LTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter geo_point: { lte: ... }\\")
              point: PointFilters
              point_DISTANCE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter point: { distance: ... }\\")
              point_EQ: PointInput @deprecated(reason: \\"Please use the relevant generic filter point: { eq: ... }\\")
              point_GT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter point: { gt: ... }\\")
              point_GTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter point: { gte: ... }\\")
              point_IN: [PointInput] @deprecated(reason: \\"Please use the relevant generic filter point: { in: ... }\\")
              point_LT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter point: { lt: ... }\\")
              point_LTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter point: { lte: ... }\\")
            }

            type FoosConnection {
              aggregate: FooAggregate!
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
              foos(limit: Int, offset: Int, sort: [FooSort!], where: FooWhere): [Foo!]!
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
