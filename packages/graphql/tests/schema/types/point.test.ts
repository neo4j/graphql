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
              filmedAt: Point!
            }

            type MovieAggregate {
              count: Count!
            }

            input MovieCreateInput {
              filmedAt: PointInput!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              filmedAt: SortDirection
            }

            input MovieUpdateInput {
              filmedAt: PointMutations
              filmedAt_SET: PointInput @deprecated(reason: \\"Please use the generic mutation 'filmedAt: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              filmedAt: PointFilters
              filmedAt_DISTANCE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { distance: ... }\\")
              filmedAt_EQ: PointInput @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { eq: ... }\\")
              filmedAt_GT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { gt: ... }\\")
              filmedAt_GTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { gte: ... }\\")
              filmedAt_IN: [PointInput!] @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { in: ... }\\")
              filmedAt_LT: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { lt: ... }\\")
              filmedAt_LTE: PointDistance @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { lte: ... }\\")
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

            \\"\\"\\"CartesianPoint mutations\\"\\"\\"
            input CartesianPointMutations {
              set: CartesianPointInput
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

            type CreateMachinesMutationResponse {
              info: CreateInfo!
              machines: [Machine!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Machine {
              partLocation: CartesianPoint!
            }

            type MachineAggregate {
              count: Count!
            }

            input MachineCreateInput {
              partLocation: CartesianPointInput!
            }

            type MachineEdge {
              cursor: String!
              node: Machine!
            }

            \\"\\"\\"
            Fields to sort Machines by. The order in which sorts are applied is not guaranteed when specifying many fields in one MachineSort object.
            \\"\\"\\"
            input MachineSort {
              partLocation: SortDirection
            }

            input MachineUpdateInput {
              partLocation: CartesianPointMutations
              partLocation_SET: CartesianPointInput @deprecated(reason: \\"Please use the generic mutation 'partLocation: { set: ... } }' instead.\\")
            }

            input MachineWhere {
              AND: [MachineWhere!]
              NOT: MachineWhere
              OR: [MachineWhere!]
              partLocation: CartesianPointFilters
              partLocation_DISTANCE: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter partLocation: { distance: ... }\\")
              partLocation_EQ: CartesianPointInput @deprecated(reason: \\"Please use the relevant generic filter partLocation: { eq: ... }\\")
              partLocation_GT: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter partLocation: { gt: ... }\\")
              partLocation_GTE: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter partLocation: { gte: ... }\\")
              partLocation_IN: [CartesianPointInput!] @deprecated(reason: \\"Please use the relevant generic filter partLocation: { in: ... }\\")
              partLocation_LT: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter partLocation: { lt: ... }\\")
              partLocation_LTE: CartesianPointDistance @deprecated(reason: \\"Please use the relevant generic filter partLocation: { lte: ... }\\")
            }

            type MachinesConnection {
              aggregate: MachineAggregate!
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
              machines(limit: Int, offset: Int, sort: [MachineSort!], where: MachineWhere): [Machine!]!
              machinesConnection(after: String, first: Int, sort: [MachineSort!], where: MachineWhere): MachinesConnection!
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

            \\"\\"\\"Mutations for a list for PointInput\\"\\"\\"
            input ListPointInputMutations {
              pop: Int
              push: [PointInput!]
              set: [PointInput!]
            }

            type Movie {
              filmedAt: [Point!]!
            }

            type MovieAggregate {
              count: Count!
            }

            input MovieCreateInput {
              filmedAt: [PointInput!]!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieUpdateInput {
              filmedAt: ListPointInputMutations
              filmedAt_POP: Int @deprecated(reason: \\"Please use the generic mutation 'filmedAt: { pop: ... } }' instead.\\")
              filmedAt_PUSH: [PointInput!] @deprecated(reason: \\"Please use the generic mutation 'filmedAt: { push: ... } }' instead.\\")
              filmedAt_SET: [PointInput!] @deprecated(reason: \\"Please use the generic mutation 'filmedAt: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              filmedAt: PointListFilters
              filmedAt_EQ: [PointInput!] @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { eq: ... }\\")
              filmedAt_INCLUDES: PointInput @deprecated(reason: \\"Please use the relevant generic filter filmedAt: { includes: ... }\\")
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

            \\"\\"\\"Point list filters\\"\\"\\"
            input PointListFilters {
              eq: [PointInput!]
              includes: PointInput
            }

            type Query {
              movies(limit: Int, offset: Int, where: MovieWhere): [Movie!]!
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

            \\"\\"\\"CartesianPoint list filters\\"\\"\\"
            input CartesianPointListFilters {
              eq: [CartesianPointInput!]
              includes: CartesianPointInput
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

            type CreateMachinesMutationResponse {
              info: CreateInfo!
              machines: [Machine!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"Mutations for a list for CartesianPointInput\\"\\"\\"
            input ListCartesianPointInputMutations {
              pop: Int
              push: [CartesianPointInput!]
              set: [CartesianPointInput!]
            }

            type Machine {
              partLocations: [CartesianPoint!]!
            }

            type MachineAggregate {
              count: Count!
            }

            input MachineCreateInput {
              partLocations: [CartesianPointInput!]!
            }

            type MachineEdge {
              cursor: String!
              node: Machine!
            }

            input MachineUpdateInput {
              partLocations: ListCartesianPointInputMutations
              partLocations_POP: Int @deprecated(reason: \\"Please use the generic mutation 'partLocations: { pop: ... } }' instead.\\")
              partLocations_PUSH: [CartesianPointInput!] @deprecated(reason: \\"Please use the generic mutation 'partLocations: { push: ... } }' instead.\\")
              partLocations_SET: [CartesianPointInput!] @deprecated(reason: \\"Please use the generic mutation 'partLocations: { set: ... } }' instead.\\")
            }

            input MachineWhere {
              AND: [MachineWhere!]
              NOT: MachineWhere
              OR: [MachineWhere!]
              partLocations: CartesianPointListFilters
              partLocations_EQ: [CartesianPointInput!] @deprecated(reason: \\"Please use the relevant generic filter partLocations: { eq: ... }\\")
              partLocations_INCLUDES: CartesianPointInput @deprecated(reason: \\"Please use the relevant generic filter partLocations: { includes: ... }\\")
            }

            type MachinesConnection {
              aggregate: MachineAggregate!
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
              machines(limit: Int, offset: Int, where: MachineWhere): [Machine!]!
              machinesConnection(after: String, first: Int, where: MachineWhere): MachinesConnection!
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

            type UpdateMachinesMutationResponse {
              info: UpdateInfo!
              machines: [Machine!]!
            }"
        `);
    });
});
