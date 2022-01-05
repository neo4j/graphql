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
import { Neo4jGraphQL } from "../../../src";

describe("Point", () => {
    test("Point", () => {
        const typeDefs = gql`
            type Movie {
                filmedAt: Point!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
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

            type DeleteInfo {
              bookmark: String
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

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort]
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
              OR: [MovieWhere!]
              filmedAt: PointInput
              filmedAt_DISTANCE: PointDistance
              filmedAt_GT: PointDistance
              filmedAt_GTE: PointDistance
              filmedAt_IN: [PointInput]
              filmedAt_LT: PointDistance
              filmedAt_LTE: PointDistance
              filmedAt_NOT: PointInput
              filmedAt_NOT_IN: [PointInput]
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            type Point {
              crs: String!
              height: Float
              latitude: Float!
              longitude: Float!
              srid: Int!
            }

            input PointDistance {
              \\"\\"\\"The distance in metres to be used when comparing two points\\"\\"\\"
              distance: Float!
              point: PointInput!
            }

            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
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
            }"
        `);
    });

    test("CartesianPoint", () => {
        const typeDefs = gql`
            type Machine {
                partLocation: CartesianPoint!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CartesianPoint {
              crs: String!
              srid: Int!
              x: Float!
              y: Float!
              z: Float
            }

            input CartesianPointDistance {
              distance: Float!
              point: CartesianPointInput!
            }

            input CartesianPointInput {
              x: Float!
              y: Float!
              z: Float
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMachinesMutationResponse {
              info: CreateInfo!
              machines: [Machine!]!
            }

            type DeleteInfo {
              bookmark: String
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

            input MachineOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MachineSort objects to sort Machines by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MachineSort]
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
              OR: [MachineWhere!]
              partLocation: CartesianPointInput
              partLocation_DISTANCE: CartesianPointDistance
              partLocation_GT: CartesianPointDistance
              partLocation_GTE: CartesianPointDistance
              partLocation_IN: [CartesianPointInput]
              partLocation_LT: CartesianPointDistance
              partLocation_LTE: CartesianPointDistance
              partLocation_NOT: CartesianPointInput
              partLocation_NOT_IN: [CartesianPointInput]
            }

            type Mutation {
              createMachines(input: [MachineCreateInput!]!): CreateMachinesMutationResponse!
              deleteMachines(where: MachineWhere): DeleteInfo!
              updateMachines(update: MachineUpdateInput, where: MachineWhere): UpdateMachinesMutationResponse!
            }

            type Query {
              machines(options: MachineOptions, where: MachineWhere): [Machine!]!
              machinesAggregate(where: MachineWhere): MachineAggregateSelection!
              machinesCount(where: MachineWhere): Int!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type UpdateInfo {
              bookmark: String
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

    test("Points", () => {
        const typeDefs = gql`
            type Movie {
                filmedAt: [Point!]!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
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

            type DeleteInfo {
              bookmark: String
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

            input MovieOptions {
              limit: Int
              offset: Int
            }

            input MovieUpdateInput {
              filmedAt: [PointInput!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              filmedAt: [PointInput!]
              filmedAt_INCLUDES: PointInput
              filmedAt_NOT: [PointInput!]
              filmedAt_NOT_INCLUDES: PointInput
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            type Point {
              crs: String!
              height: Float
              latitude: Float!
              longitude: Float!
              srid: Int!
            }

            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesCount(where: MovieWhere): Int!
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
            }"
        `);
    });

    test("CartesianPoints", () => {
        const typeDefs = gql`
            type Machine {
                partLocations: [CartesianPoint!]!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CartesianPoint {
              crs: String!
              srid: Int!
              x: Float!
              y: Float!
              z: Float
            }

            input CartesianPointInput {
              x: Float!
              y: Float!
              z: Float
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMachinesMutationResponse {
              info: CreateInfo!
              machines: [Machine!]!
            }

            type DeleteInfo {
              bookmark: String
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

            input MachineOptions {
              limit: Int
              offset: Int
            }

            input MachineUpdateInput {
              partLocations: [CartesianPointInput!]
            }

            input MachineWhere {
              AND: [MachineWhere!]
              OR: [MachineWhere!]
              partLocations: [CartesianPointInput!]
              partLocations_INCLUDES: CartesianPointInput
              partLocations_NOT: [CartesianPointInput!]
              partLocations_NOT_INCLUDES: CartesianPointInput
            }

            type Mutation {
              createMachines(input: [MachineCreateInput!]!): CreateMachinesMutationResponse!
              deleteMachines(where: MachineWhere): DeleteInfo!
              updateMachines(update: MachineUpdateInput, where: MachineWhere): UpdateMachinesMutationResponse!
            }

            type Query {
              machines(options: MachineOptions, where: MachineWhere): [Machine!]!
              machinesAggregate(where: MachineWhere): MachineAggregateSelection!
              machinesCount(where: MachineWhere): Int!
            }

            type UpdateInfo {
              bookmark: String
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
