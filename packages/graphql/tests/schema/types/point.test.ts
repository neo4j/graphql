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

describe("Point", () => {
    test("Point", async () => {
        const typeDefs = gql`
            type Movie @node {
                filmedAt: Point!
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

            type Movie {
              filmedAt: Point!
            }

            type MovieAggregateSelection {
              count: Int!
            }

            input MovieCreateInput {
              filmedAt: PointInput!
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
              filmedAt: SortDirection
            }

            input MovieUpdateInput {
              filmedAt: PointInput
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              filmedAt: PointInput @deprecated(reason: \\"Please use the explicit _EQ version\\")
              filmedAt_DISTANCE: PointDistance
              filmedAt_EQ: PointInput
              filmedAt_GT: PointDistance
              filmedAt_GTE: PointDistance
              filmedAt_IN: [PointInput!]
              filmedAt_LT: PointDistance
              filmedAt_LTE: PointDistance
              filmedAt_NOT: PointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              filmedAt_NOT_IN: [PointInput!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

    test("CartesianPoint", async () => {
        const typeDefs = gql`
            type Machine @node {
                partLocation: CartesianPoint!
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMachinesMutationResponse {
              info: CreateInfo!
              machines: [Machine!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Machine {
              partLocation: CartesianPoint!
            }

            type MachineAggregateSelection {
              count: Int!
            }

            input MachineCreateInput {
              partLocation: CartesianPointInput!
            }

            type MachineEdge {
              cursor: String!
              node: Machine!
            }

            input MachineOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MachineSort objects to sort Machines by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MachineSort!]
            }

            \\"\\"\\"
            Fields to sort Machines by. The order in which sorts are applied is not guaranteed when specifying many fields in one MachineSort object.
            \\"\\"\\"
            input MachineSort {
              partLocation: SortDirection
            }

            input MachineUpdateInput {
              partLocation: CartesianPointInput
            }

            input MachineWhere {
              AND: [MachineWhere!]
              NOT: MachineWhere
              OR: [MachineWhere!]
              partLocation: CartesianPointInput @deprecated(reason: \\"Please use the explicit _EQ version\\")
              partLocation_DISTANCE: CartesianPointDistance
              partLocation_EQ: CartesianPointInput
              partLocation_GT: CartesianPointDistance
              partLocation_GTE: CartesianPointDistance
              partLocation_IN: [CartesianPointInput!]
              partLocation_LT: CartesianPointDistance
              partLocation_LTE: CartesianPointDistance
              partLocation_NOT: CartesianPointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              partLocation_NOT_IN: [CartesianPointInput!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type MachinesConnection {
              edges: [MachineEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMachines(input: [MachineCreateInput!]!): CreateMachinesMutationResponse!
              deleteMachines(where: MachineWhere): DeleteInfo!
              updateMachines(update: MachineUpdateInput, where: MachineWhere): UpdateMachinesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              machines(options: MachineOptions, where: MachineWhere): [Machine!]!
              machinesAggregate(where: MachineWhere): MachineAggregateSelection!
              machinesConnection(after: String, first: Int, sort: [MachineSort], where: MachineWhere): MachinesConnection!
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMachinesMutationResponse {
              info: UpdateInfo!
              machines: [Machine!]!
            }"
        `);
    });

    test("Points", async () => {
        const typeDefs = gql`
            type Movie @node {
                filmedAt: [Point!]!
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

            type Movie {
              filmedAt: [Point!]!
            }

            type MovieAggregateSelection {
              count: Int!
            }

            input MovieCreateInput {
              filmedAt: [PointInput!]!
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
              filmedAt: [PointInput!]
              filmedAt_POP: Int
              filmedAt_PUSH: [PointInput!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              filmedAt: [PointInput!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              filmedAt_EQ: [PointInput!]
              filmedAt_INCLUDES: PointInput
              filmedAt_NOT: [PointInput!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              filmedAt_NOT_INCLUDES: PointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, where: MovieWhere): MoviesConnection!
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

    test("CartesianPoints", async () => {
        const typeDefs = gql`
            type Machine @node {
                partLocations: [CartesianPoint!]!
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMachinesMutationResponse {
              info: CreateInfo!
              machines: [Machine!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Machine {
              partLocations: [CartesianPoint!]!
            }

            type MachineAggregateSelection {
              count: Int!
            }

            input MachineCreateInput {
              partLocations: [CartesianPointInput!]!
            }

            type MachineEdge {
              cursor: String!
              node: Machine!
            }

            input MachineOptions {
              limit: Int
              offset: Int
            }

            input MachineUpdateInput {
              partLocations: [CartesianPointInput!]
              partLocations_POP: Int
              partLocations_PUSH: [CartesianPointInput!]
            }

            input MachineWhere {
              AND: [MachineWhere!]
              NOT: MachineWhere
              OR: [MachineWhere!]
              partLocations: [CartesianPointInput!] @deprecated(reason: \\"Please use the explicit _EQ version\\")
              partLocations_EQ: [CartesianPointInput!]
              partLocations_INCLUDES: CartesianPointInput
              partLocations_NOT: [CartesianPointInput!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              partLocations_NOT_INCLUDES: CartesianPointInput @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type MachinesConnection {
              edges: [MachineEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMachines(input: [MachineCreateInput!]!): CreateMachinesMutationResponse!
              deleteMachines(where: MachineWhere): DeleteInfo!
              updateMachines(update: MachineUpdateInput, where: MachineWhere): UpdateMachinesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              machines(options: MachineOptions, where: MachineWhere): [Machine!]!
              machinesAggregate(where: MachineWhere): MachineAggregateSelection!
              machinesConnection(after: String, first: Int, where: MachineWhere): MachinesConnection!
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

            type UpdateMachinesMutationResponse {
              info: UpdateInfo!
              machines: [Machine!]!
            }"
        `);
    });
});
