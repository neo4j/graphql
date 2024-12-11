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
import { Neo4jGraphQL } from "../../src";

describe("Algebraic", () => {
    test("Int fields should be extended with Increment/Decrement operators", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                viewers: Int!
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie {
              id: ID
              viewers: Int!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              viewers: IntAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
              viewers: Int!
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
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              viewers: IntScalarMutations
              viewers_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { decrement: ... } }' instead.\\")
              viewers_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { increment: ... } }' instead.\\")
              viewers_SET: Int @deprecated(reason: \\"Please use the generic mutation 'viewers: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              viewers: IntScalarFilters
              viewers_EQ: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

    test("BigInt fields should be extended with Increment/Decrement operators", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                viewers: BigInt!
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
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            type BigIntAggregateSelection {
              average: BigInt
              max: BigInt
              min: BigInt
              sum: BigInt
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

            \\"\\"\\"BigInt mutations\\"\\"\\"
            input BigIntScalarMutations {
              add: BigInt
              set: BigInt
              subtract: BigInt
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

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type Movie {
              id: ID
              viewers: BigInt!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              viewers: BigIntAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
              viewers: BigInt!
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
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              viewers: BigIntScalarMutations
              viewers_DECREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { decrement: ... } }' instead.\\")
              viewers_INCREMENT: BigInt @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { increment: ... } }' instead.\\")
              viewers_SET: BigInt @deprecated(reason: \\"Please use the generic mutation 'viewers: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              viewers: BigIntScalarFilters
              viewers_EQ: BigInt
              viewers_GT: BigInt
              viewers_GTE: BigInt
              viewers_IN: [BigInt!]
              viewers_LT: BigInt
              viewers_LTE: BigInt
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

    test("Float fields should be extended with Add/Subtract/Multiply/Divide operators", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                viewers: Float!
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type Movie {
              id: ID
              viewers: Float!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              viewers: FloatAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
              viewers: Float!
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
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              viewers: FloatScalarMutations
              viewers_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { add: ... } }' instead.\\")
              viewers_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { divide: ... } }' instead.\\")
              viewers_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { multiply: ... } }' instead.\\")
              viewers_SET: Float @deprecated(reason: \\"Please use the generic mutation 'viewers: { set: ... } }' instead.\\")
              viewers_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { subtract: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              viewers: FloatScalarFilters
              viewers_EQ: Float
              viewers_GT: Float
              viewers_GTE: Float
              viewers_IN: [Float!]
              viewers_LT: Float
              viewers_LTE: Float
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

    test("Operators should be presents in nested updates", async () => {
        const typeDefs = gql`
            type Movie @node {
                id: ID
                viewers: Int!
                directedBy: [Director!]! @relationship(type: "DIRECTS", direction: IN)
            }

            type Director @node {
                lastName: String!
                directs: [Movie!]! @relationship(type: "DIRECTS", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateDirectorsMutationResponse {
              directors: [Director!]!
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

            type Director {
              directs(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              directsAggregate(where: MovieWhere): DirectorMovieDirectsAggregationSelection
              directsConnection(after: String, first: Int, sort: [DirectorDirectsConnectionSort!], where: DirectorDirectsConnectionWhere): DirectorDirectsConnection!
              lastName: String!
            }

            type DirectorAggregateSelection {
              count: Int!
              lastName: StringAggregateSelection!
            }

            input DirectorConnectInput {
              directs: [DirectorDirectsConnectFieldInput!]
            }

            input DirectorConnectWhere {
              node: DirectorWhere!
            }

            input DirectorCreateInput {
              directs: DirectorDirectsFieldInput
              lastName: String!
            }

            input DirectorDeleteInput {
              directs: [DirectorDirectsDeleteFieldInput!]
            }

            input DirectorDirectsAggregateInput {
              AND: [DirectorDirectsAggregateInput!]
              NOT: DirectorDirectsAggregateInput
              OR: [DirectorDirectsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: DirectorDirectsNodeAggregationWhereInput
            }

            input DirectorDirectsConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type DirectorDirectsConnection {
              edges: [DirectorDirectsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DirectorDirectsConnectionFilters {
              \\"\\"\\"
              Return Directors where all of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              all: DirectorDirectsConnectionWhere
              \\"\\"\\"
              Return Directors where none of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              none: DirectorDirectsConnectionWhere
              \\"\\"\\"
              Return Directors where one of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              single: DirectorDirectsConnectionWhere
              \\"\\"\\"
              Return Directors where some of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              some: DirectorDirectsConnectionWhere
            }

            input DirectorDirectsConnectionSort {
              node: MovieSort
            }

            input DirectorDirectsConnectionWhere {
              AND: [DirectorDirectsConnectionWhere!]
              NOT: DirectorDirectsConnectionWhere
              OR: [DirectorDirectsConnectionWhere!]
              node: MovieWhere
            }

            input DirectorDirectsCreateFieldInput {
              node: MovieCreateInput!
            }

            input DirectorDirectsDeleteFieldInput {
              delete: MovieDeleteInput
              where: DirectorDirectsConnectionWhere
            }

            input DirectorDirectsDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: DirectorDirectsConnectionWhere
            }

            input DirectorDirectsFieldInput {
              connect: [DirectorDirectsConnectFieldInput!]
              create: [DirectorDirectsCreateFieldInput!]
            }

            input DirectorDirectsNodeAggregationWhereInput {
              AND: [DirectorDirectsNodeAggregationWhereInput!]
              NOT: DirectorDirectsNodeAggregationWhereInput
              OR: [DirectorDirectsNodeAggregationWhereInput!]
              id_MAX_EQUAL: ID
              id_MAX_GT: ID
              id_MAX_GTE: ID
              id_MAX_LT: ID
              id_MAX_LTE: ID
              id_MIN_EQUAL: ID
              id_MIN_GT: ID
              id_MIN_GTE: ID
              id_MIN_LT: ID
              id_MIN_LTE: ID
              viewers_AVERAGE_EQUAL: Float
              viewers_AVERAGE_GT: Float
              viewers_AVERAGE_GTE: Float
              viewers_AVERAGE_LT: Float
              viewers_AVERAGE_LTE: Float
              viewers_MAX_EQUAL: Int
              viewers_MAX_GT: Int
              viewers_MAX_GTE: Int
              viewers_MAX_LT: Int
              viewers_MAX_LTE: Int
              viewers_MIN_EQUAL: Int
              viewers_MIN_GT: Int
              viewers_MIN_GTE: Int
              viewers_MIN_LT: Int
              viewers_MIN_LTE: Int
              viewers_SUM_EQUAL: Int
              viewers_SUM_GT: Int
              viewers_SUM_GTE: Int
              viewers_SUM_LT: Int
              viewers_SUM_LTE: Int
            }

            type DirectorDirectsRelationship {
              cursor: String!
              node: Movie!
            }

            input DirectorDirectsRelationshipFilters {
              \\"\\"\\"Return Directors where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Return Directors where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Return Directors where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Return Directors where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
            }

            input DirectorDirectsUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input DirectorDirectsUpdateFieldInput {
              connect: [DirectorDirectsConnectFieldInput!]
              create: [DirectorDirectsCreateFieldInput!]
              delete: [DirectorDirectsDeleteFieldInput!]
              disconnect: [DirectorDirectsDisconnectFieldInput!]
              update: DirectorDirectsUpdateConnectionInput
              where: DirectorDirectsConnectionWhere
            }

            input DirectorDisconnectInput {
              directs: [DirectorDirectsDisconnectFieldInput!]
            }

            type DirectorEdge {
              cursor: String!
              node: Director!
            }

            type DirectorMovieDirectsAggregationSelection {
              count: Int!
              node: DirectorMovieDirectsNodeAggregateSelection
            }

            type DirectorMovieDirectsNodeAggregateSelection {
              id: IDAggregateSelection!
              viewers: IntAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort Directors by. The order in which sorts are applied is not guaranteed when specifying many fields in one DirectorSort object.
            \\"\\"\\"
            input DirectorSort {
              lastName: SortDirection
            }

            input DirectorUpdateInput {
              directs: [DirectorDirectsUpdateFieldInput!]
              lastName: StringScalarMutations
              lastName_SET: String @deprecated(reason: \\"Please use the generic mutation 'lastName: { set: ... } }' instead.\\")
            }

            input DirectorWhere {
              AND: [DirectorWhere!]
              NOT: DirectorWhere
              OR: [DirectorWhere!]
              directs: DirectorDirectsRelationshipFilters
              directsAggregate: DirectorDirectsAggregateInput
              directsConnection: DirectorDirectsConnectionFilters
              \\"\\"\\"
              Return Directors where all of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_ALL: DirectorDirectsConnectionWhere
              \\"\\"\\"
              Return Directors where none of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_NONE: DirectorDirectsConnectionWhere
              \\"\\"\\"
              Return Directors where one of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_SINGLE: DirectorDirectsConnectionWhere
              \\"\\"\\"
              Return Directors where some of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_SOME: DirectorDirectsConnectionWhere
              \\"\\"\\"Return Directors where all of the related Movies match this filter\\"\\"\\"
              directs_ALL: MovieWhere
              \\"\\"\\"Return Directors where none of the related Movies match this filter\\"\\"\\"
              directs_NONE: MovieWhere
              \\"\\"\\"Return Directors where one of the related Movies match this filter\\"\\"\\"
              directs_SINGLE: MovieWhere
              \\"\\"\\"Return Directors where some of the related Movies match this filter\\"\\"\\"
              directs_SOME: MovieWhere
              lastName: StringScalarFilters
              lastName_CONTAINS: String
              lastName_ENDS_WITH: String
              lastName_EQ: String
              lastName_IN: [String!]
              lastName_STARTS_WITH: String
            }

            type DirectorsConnection {
              edges: [DirectorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie {
              directedBy(limit: Int, offset: Int, sort: [DirectorSort!], where: DirectorWhere): [Director!]!
              directedByAggregate(where: DirectorWhere): MovieDirectorDirectedByAggregationSelection
              directedByConnection(after: String, first: Int, sort: [MovieDirectedByConnectionSort!], where: MovieDirectedByConnectionWhere): MovieDirectedByConnection!
              id: ID
              viewers: Int!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              viewers: IntAggregateSelection!
            }

            input MovieConnectInput {
              directedBy: [MovieDirectedByConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              directedBy: MovieDirectedByFieldInput
              id: ID
              viewers: Int!
            }

            input MovieDeleteInput {
              directedBy: [MovieDirectedByDeleteFieldInput!]
            }

            input MovieDirectedByAggregateInput {
              AND: [MovieDirectedByAggregateInput!]
              NOT: MovieDirectedByAggregateInput
              OR: [MovieDirectedByAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieDirectedByNodeAggregationWhereInput
            }

            input MovieDirectedByConnectFieldInput {
              connect: [DirectorConnectInput!]
              where: DirectorConnectWhere
            }

            type MovieDirectedByConnection {
              edges: [MovieDirectedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieDirectedByConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              all: MovieDirectedByConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              none: MovieDirectedByConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              single: MovieDirectedByConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              some: MovieDirectedByConnectionWhere
            }

            input MovieDirectedByConnectionSort {
              node: DirectorSort
            }

            input MovieDirectedByConnectionWhere {
              AND: [MovieDirectedByConnectionWhere!]
              NOT: MovieDirectedByConnectionWhere
              OR: [MovieDirectedByConnectionWhere!]
              node: DirectorWhere
            }

            input MovieDirectedByCreateFieldInput {
              node: DirectorCreateInput!
            }

            input MovieDirectedByDeleteFieldInput {
              delete: DirectorDeleteInput
              where: MovieDirectedByConnectionWhere
            }

            input MovieDirectedByDisconnectFieldInput {
              disconnect: DirectorDisconnectInput
              where: MovieDirectedByConnectionWhere
            }

            input MovieDirectedByFieldInput {
              connect: [MovieDirectedByConnectFieldInput!]
              create: [MovieDirectedByCreateFieldInput!]
            }

            input MovieDirectedByNodeAggregationWhereInput {
              AND: [MovieDirectedByNodeAggregationWhereInput!]
              NOT: MovieDirectedByNodeAggregationWhereInput
              OR: [MovieDirectedByNodeAggregationWhereInput!]
              lastName_AVERAGE_LENGTH_EQUAL: Float
              lastName_AVERAGE_LENGTH_GT: Float
              lastName_AVERAGE_LENGTH_GTE: Float
              lastName_AVERAGE_LENGTH_LT: Float
              lastName_AVERAGE_LENGTH_LTE: Float
              lastName_LONGEST_LENGTH_EQUAL: Int
              lastName_LONGEST_LENGTH_GT: Int
              lastName_LONGEST_LENGTH_GTE: Int
              lastName_LONGEST_LENGTH_LT: Int
              lastName_LONGEST_LENGTH_LTE: Int
              lastName_SHORTEST_LENGTH_EQUAL: Int
              lastName_SHORTEST_LENGTH_GT: Int
              lastName_SHORTEST_LENGTH_GTE: Int
              lastName_SHORTEST_LENGTH_LT: Int
              lastName_SHORTEST_LENGTH_LTE: Int
            }

            type MovieDirectedByRelationship {
              cursor: String!
              node: Director!
            }

            input MovieDirectedByRelationshipFilters {
              \\"\\"\\"Return Movies where all of the related Directors match this filter\\"\\"\\"
              all: DirectorWhere
              \\"\\"\\"Return Movies where none of the related Directors match this filter\\"\\"\\"
              none: DirectorWhere
              \\"\\"\\"Return Movies where one of the related Directors match this filter\\"\\"\\"
              single: DirectorWhere
              \\"\\"\\"Return Movies where some of the related Directors match this filter\\"\\"\\"
              some: DirectorWhere
            }

            input MovieDirectedByUpdateConnectionInput {
              node: DirectorUpdateInput
            }

            input MovieDirectedByUpdateFieldInput {
              connect: [MovieDirectedByConnectFieldInput!]
              create: [MovieDirectedByCreateFieldInput!]
              delete: [MovieDirectedByDeleteFieldInput!]
              disconnect: [MovieDirectedByDisconnectFieldInput!]
              update: MovieDirectedByUpdateConnectionInput
              where: MovieDirectedByConnectionWhere
            }

            type MovieDirectorDirectedByAggregationSelection {
              count: Int!
              node: MovieDirectorDirectedByNodeAggregateSelection
            }

            type MovieDirectorDirectedByNodeAggregateSelection {
              lastName: StringAggregateSelection!
            }

            input MovieDisconnectInput {
              directedBy: [MovieDirectedByDisconnectFieldInput!]
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
              viewers: SortDirection
            }

            input MovieUpdateInput {
              directedBy: [MovieDirectedByUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              viewers: IntScalarMutations
              viewers_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { decrement: ... } }' instead.\\")
              viewers_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { increment: ... } }' instead.\\")
              viewers_SET: Int @deprecated(reason: \\"Please use the generic mutation 'viewers: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              directedBy: MovieDirectedByRelationshipFilters
              directedByAggregate: MovieDirectedByAggregateInput
              directedByConnection: MovieDirectedByConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_ALL: MovieDirectedByConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_NONE: MovieDirectedByConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_SINGLE: MovieDirectedByConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_SOME: MovieDirectedByConnectionWhere
              \\"\\"\\"Return Movies where all of the related Directors match this filter\\"\\"\\"
              directedBy_ALL: DirectorWhere
              \\"\\"\\"Return Movies where none of the related Directors match this filter\\"\\"\\"
              directedBy_NONE: DirectorWhere
              \\"\\"\\"Return Movies where one of the related Directors match this filter\\"\\"\\"
              directedBy_SINGLE: DirectorWhere
              \\"\\"\\"Return Movies where some of the related Directors match this filter\\"\\"\\"
              directedBy_SOME: DirectorWhere
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              viewers: IntScalarFilters
              viewers_EQ: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createDirectors(input: [DirectorCreateInput!]!): CreateDirectorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteDirectors(delete: DirectorDeleteInput, where: DirectorWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateDirectors(update: DirectorUpdateInput, where: DirectorWhere): UpdateDirectorsMutationResponse!
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
              directors(limit: Int, offset: Int, sort: [DirectorSort!], where: DirectorWhere): [Director!]!
              directorsAggregate(where: DirectorWhere): DirectorAggregateSelection!
              directorsConnection(after: String, first: Int, sort: [DirectorSort!], where: DirectorWhere): DirectorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
            }

            type UpdateDirectorsMutationResponse {
              directors: [Director!]!
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

    test("Should be supported in interfaces", async () => {
        const typeDefs = gql`
            interface Production {
                viewers: Int!
            }

            type Movie implements Production @node {
                id: ID
                viewers: Int!
                workers: [Person!]! @relationship(type: "WORKED_IN", direction: IN)
            }

            type Person @node {
                name: String!
                worksInProduction: [Production!]! @relationship(type: "WORKED_IN", direction: OUT)
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

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
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

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie implements Production {
              id: ID
              viewers: Int!
              workers(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              workersAggregate(where: PersonWhere): MoviePersonWorkersAggregationSelection
              workersConnection(after: String, first: Int, sort: [MovieWorkersConnectionSort!], where: MovieWorkersConnectionWhere): MovieWorkersConnection!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              viewers: IntAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
              viewers: Int!
              workers: MovieWorkersFieldInput
            }

            input MovieDeleteInput {
              workers: [MovieWorkersDeleteFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MoviePersonWorkersAggregationSelection {
              count: Int!
              node: MoviePersonWorkersNodeAggregateSelection
            }

            type MoviePersonWorkersNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              viewers: IntScalarMutations
              viewers_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { decrement: ... } }' instead.\\")
              viewers_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { increment: ... } }' instead.\\")
              viewers_SET: Int @deprecated(reason: \\"Please use the generic mutation 'viewers: { set: ... } }' instead.\\")
              workers: [MovieWorkersUpdateFieldInput!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              viewers: IntScalarFilters
              viewers_EQ: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
              workers: MovieWorkersRelationshipFilters
              workersAggregate: MovieWorkersAggregateInput
              workersConnection: MovieWorkersConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_ALL: MovieWorkersConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_NONE: MovieWorkersConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_SINGLE: MovieWorkersConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_SOME: MovieWorkersConnectionWhere
              \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
              workers_ALL: PersonWhere
              \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
              workers_NONE: PersonWhere
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              workers_SINGLE: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              workers_SOME: PersonWhere
            }

            input MovieWorkersAggregateInput {
              AND: [MovieWorkersAggregateInput!]
              NOT: MovieWorkersAggregateInput
              OR: [MovieWorkersAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieWorkersNodeAggregationWhereInput
            }

            input MovieWorkersConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            type MovieWorkersConnection {
              edges: [MovieWorkersRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieWorkersConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              all: MovieWorkersConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              none: MovieWorkersConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              single: MovieWorkersConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              some: MovieWorkersConnectionWhere
            }

            input MovieWorkersConnectionSort {
              node: PersonSort
            }

            input MovieWorkersConnectionWhere {
              AND: [MovieWorkersConnectionWhere!]
              NOT: MovieWorkersConnectionWhere
              OR: [MovieWorkersConnectionWhere!]
              node: PersonWhere
            }

            input MovieWorkersCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieWorkersDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieWorkersConnectionWhere
            }

            input MovieWorkersDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieWorkersConnectionWhere
            }

            input MovieWorkersFieldInput {
              connect: [MovieWorkersConnectFieldInput!]
              create: [MovieWorkersCreateFieldInput!]
            }

            input MovieWorkersNodeAggregationWhereInput {
              AND: [MovieWorkersNodeAggregationWhereInput!]
              NOT: MovieWorkersNodeAggregationWhereInput
              OR: [MovieWorkersNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type MovieWorkersRelationship {
              cursor: String!
              node: Person!
            }

            input MovieWorkersRelationshipFilters {
              \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
              all: PersonWhere
              \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
              none: PersonWhere
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              single: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              some: PersonWhere
            }

            input MovieWorkersUpdateConnectionInput {
              node: PersonUpdateInput
            }

            input MovieWorkersUpdateFieldInput {
              connect: [MovieWorkersConnectFieldInput!]
              create: [MovieWorkersCreateFieldInput!]
              delete: [MovieWorkersDeleteFieldInput!]
              disconnect: [MovieWorkersDisconnectFieldInput!]
              update: MovieWorkersUpdateConnectionInput
              where: MovieWorkersConnectionWhere
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person {
              name: String!
              worksInProduction(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              worksInProductionAggregate(where: ProductionWhere): PersonProductionWorksInProductionAggregationSelection
              worksInProductionConnection(after: String, first: Int, sort: [PersonWorksInProductionConnectionSort!], where: PersonWorksInProductionConnectionWhere): PersonWorksInProductionConnection!
            }

            type PersonAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input PersonConnectInput {
              worksInProduction: [PersonWorksInProductionConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              name: String!
              worksInProduction: PersonWorksInProductionFieldInput
            }

            input PersonDeleteInput {
              worksInProduction: [PersonWorksInProductionDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              worksInProduction: [PersonWorksInProductionDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonProductionWorksInProductionAggregationSelection {
              count: Int!
              node: PersonProductionWorksInProductionNodeAggregateSelection
            }

            type PersonProductionWorksInProductionNodeAggregateSelection {
              viewers: IntAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              name: SortDirection
            }

            input PersonUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              worksInProduction: [PersonWorksInProductionUpdateFieldInput!]
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              worksInProduction: PersonWorksInProductionRelationshipFilters
              worksInProductionAggregate: PersonWorksInProductionAggregateInput
              worksInProductionConnection: PersonWorksInProductionConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_ALL: PersonWorksInProductionConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_NONE: PersonWorksInProductionConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_SINGLE: PersonWorksInProductionConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_SOME: PersonWorksInProductionConnectionWhere
              \\"\\"\\"Return People where all of the related Productions match this filter\\"\\"\\"
              worksInProduction_ALL: ProductionWhere
              \\"\\"\\"Return People where none of the related Productions match this filter\\"\\"\\"
              worksInProduction_NONE: ProductionWhere
              \\"\\"\\"Return People where one of the related Productions match this filter\\"\\"\\"
              worksInProduction_SINGLE: ProductionWhere
              \\"\\"\\"Return People where some of the related Productions match this filter\\"\\"\\"
              worksInProduction_SOME: ProductionWhere
            }

            input PersonWorksInProductionAggregateInput {
              AND: [PersonWorksInProductionAggregateInput!]
              NOT: PersonWorksInProductionAggregateInput
              OR: [PersonWorksInProductionAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PersonWorksInProductionNodeAggregationWhereInput
            }

            input PersonWorksInProductionConnectFieldInput {
              where: ProductionConnectWhere
            }

            type PersonWorksInProductionConnection {
              edges: [PersonWorksInProductionRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonWorksInProductionConnectionFilters {
              \\"\\"\\"
              Return People where all of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              all: PersonWorksInProductionConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              none: PersonWorksInProductionConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              single: PersonWorksInProductionConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              some: PersonWorksInProductionConnectionWhere
            }

            input PersonWorksInProductionConnectionSort {
              node: ProductionSort
            }

            input PersonWorksInProductionConnectionWhere {
              AND: [PersonWorksInProductionConnectionWhere!]
              NOT: PersonWorksInProductionConnectionWhere
              OR: [PersonWorksInProductionConnectionWhere!]
              node: ProductionWhere
            }

            input PersonWorksInProductionCreateFieldInput {
              node: ProductionCreateInput!
            }

            input PersonWorksInProductionDeleteFieldInput {
              where: PersonWorksInProductionConnectionWhere
            }

            input PersonWorksInProductionDisconnectFieldInput {
              where: PersonWorksInProductionConnectionWhere
            }

            input PersonWorksInProductionFieldInput {
              connect: [PersonWorksInProductionConnectFieldInput!]
              create: [PersonWorksInProductionCreateFieldInput!]
            }

            input PersonWorksInProductionNodeAggregationWhereInput {
              AND: [PersonWorksInProductionNodeAggregationWhereInput!]
              NOT: PersonWorksInProductionNodeAggregationWhereInput
              OR: [PersonWorksInProductionNodeAggregationWhereInput!]
              viewers_AVERAGE_EQUAL: Float
              viewers_AVERAGE_GT: Float
              viewers_AVERAGE_GTE: Float
              viewers_AVERAGE_LT: Float
              viewers_AVERAGE_LTE: Float
              viewers_MAX_EQUAL: Int
              viewers_MAX_GT: Int
              viewers_MAX_GTE: Int
              viewers_MAX_LT: Int
              viewers_MAX_LTE: Int
              viewers_MIN_EQUAL: Int
              viewers_MIN_GT: Int
              viewers_MIN_GTE: Int
              viewers_MIN_LT: Int
              viewers_MIN_LTE: Int
              viewers_SUM_EQUAL: Int
              viewers_SUM_GT: Int
              viewers_SUM_GTE: Int
              viewers_SUM_LT: Int
              viewers_SUM_LTE: Int
            }

            type PersonWorksInProductionRelationship {
              cursor: String!
              node: Production!
            }

            input PersonWorksInProductionRelationshipFilters {
              \\"\\"\\"Return People where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Return People where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Return People where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Return People where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            input PersonWorksInProductionUpdateConnectionInput {
              node: ProductionUpdateInput
            }

            input PersonWorksInProductionUpdateFieldInput {
              connect: [PersonWorksInProductionConnectFieldInput!]
              create: [PersonWorksInProductionCreateFieldInput!]
              delete: [PersonWorksInProductionDeleteFieldInput!]
              disconnect: [PersonWorksInProductionDisconnectFieldInput!]
              update: PersonWorksInProductionUpdateConnectionInput
              where: PersonWorksInProductionConnectionWhere
            }

            interface Production {
              viewers: Int!
            }

            type ProductionAggregateSelection {
              count: Int!
              viewers: IntAggregateSelection!
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              viewers: SortDirection
            }

            input ProductionUpdateInput {
              viewers: IntScalarMutations
              viewers_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { decrement: ... } }' instead.\\")
              viewers_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'viewers: { increment: ... } }' instead.\\")
              viewers_SET: Int @deprecated(reason: \\"Please use the generic mutation 'viewers: { set: ... } }' instead.\\")
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              typename_IN: [ProductionImplementation!]
              viewers: IntScalarFilters
              viewers_EQ: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
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
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
              matches: String
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
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }"
        `);
    });

    test("Should be supported in Relationship properties", async () => {
        const typeDefs = gql`
            type Person @node {
                name: String!
                actedInMovies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type Movie @node {
                title: String!
                actors: [Person!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ActedIn @relationshipProperties {
                roles: [String!]
                pay: Float
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
            The edge properties for the following fields:
            * Person.actedInMovies
            * Movie.actors
            \\"\\"\\"
            type ActedIn {
              pay: Float
              roles: [String!]
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              pay_AVERAGE_EQUAL: Float
              pay_AVERAGE_GT: Float
              pay_AVERAGE_GTE: Float
              pay_AVERAGE_LT: Float
              pay_AVERAGE_LTE: Float
              pay_MAX_EQUAL: Float
              pay_MAX_GT: Float
              pay_MAX_GTE: Float
              pay_MAX_LT: Float
              pay_MAX_LTE: Float
              pay_MIN_EQUAL: Float
              pay_MIN_GT: Float
              pay_MIN_GTE: Float
              pay_MIN_LT: Float
              pay_MIN_LTE: Float
              pay_SUM_EQUAL: Float
              pay_SUM_GT: Float
              pay_SUM_GTE: Float
              pay_SUM_LT: Float
              pay_SUM_LTE: Float
            }

            input ActedInCreateInput {
              pay: Float
              roles: [String!]
            }

            input ActedInSort {
              pay: SortDirection
              roles: SortDirection
            }

            input ActedInUpdateInput {
              pay: FloatScalarMutations
              pay_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'pay: { add: ... } }' instead.\\")
              pay_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'pay: { divide: ... } }' instead.\\")
              pay_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'pay: { multiply: ... } }' instead.\\")
              pay_SET: Float @deprecated(reason: \\"Please use the generic mutation 'pay: { set: ... } }' instead.\\")
              pay_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'pay: { subtract: ... } }' instead.\\")
              roles: ListStringMutations
              roles_POP: Int @deprecated(reason: \\"Please use the generic mutation 'roles: { pop: ... } }' instead.\\")
              roles_PUSH: [String!] @deprecated(reason: \\"Please use the generic mutation 'roles: { push: ... } }' instead.\\")
              roles_SET: [String!] @deprecated(reason: \\"Please use the generic mutation 'roles: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              pay: FloatScalarFilters
              pay_EQ: Float
              pay_GT: Float
              pay_GTE: Float
              pay_IN: [Float]
              pay_LT: Float
              pay_LTE: Float
              roles: StringListFilters
              roles_EQ: [String!]
              roles_INCLUDES: String
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

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
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

            \\"\\"\\"Mutations for a list for String\\"\\"\\"
            input ListStringMutations {
              pop: Int
              push: [String!]
              set: [String!]
            }

            type Movie {
              actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              actorsAggregate(where: PersonWhere): MoviePersonActorsAggregationSelection
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              title: String!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [PersonConnectInput!]
              edge: ActedInCreateInput
              where: PersonConnectWhere
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              all: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              none: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              single: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              some: MovieActorsConnectionWhere
            }

            input MovieActorsConnectionSort {
              edge: ActedInSort
              node: PersonSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              edge: ActedInWhere
              node: PersonWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput
              node: PersonCreateInput!
            }

            input MovieActorsDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
            }

            input MovieActorsNodeAggregationWhereInput {
              AND: [MovieActorsNodeAggregationWhereInput!]
              NOT: MovieActorsNodeAggregationWhereInput
              OR: [MovieActorsNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Person!
              properties: ActedIn!
            }

            input MovieActorsRelationshipFilters {
              \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
              all: PersonWhere
              \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
              none: PersonWhere
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              single: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              some: PersonWhere
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: PersonUpdateInput
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [MovieActorsDeleteFieldInput!]
              disconnect: [MovieActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
              where: MovieActorsConnectionWhere
            }

            type MovieAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              title: String!
            }

            input MovieDeleteInput {
              actors: [MovieActorsDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              actors: [MovieActorsDisconnectFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MoviePersonActorsAggregationSelection {
              count: Int!
              edge: MoviePersonActorsEdgeAggregateSelection
              node: MoviePersonActorsNodeAggregateSelection
            }

            type MoviePersonActorsEdgeAggregateSelection {
              pay: FloatAggregateSelection!
            }

            type MoviePersonActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: MovieActorsRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: MovieActorsConnectionWhere
              \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
              actors_ALL: PersonWhere
              \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
              actors_NONE: PersonWhere
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              actors_SINGLE: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              actors_SOME: PersonWhere
              title: StringScalarFilters
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person {
              actedInMovies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              actedInMoviesAggregate(where: MovieWhere): PersonMovieActedInMoviesAggregationSelection
              actedInMoviesConnection(after: String, first: Int, sort: [PersonActedInMoviesConnectionSort!], where: PersonActedInMoviesConnectionWhere): PersonActedInMoviesConnection!
              name: String!
            }

            input PersonActedInMoviesAggregateInput {
              AND: [PersonActedInMoviesAggregateInput!]
              NOT: PersonActedInMoviesAggregateInput
              OR: [PersonActedInMoviesAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: PersonActedInMoviesNodeAggregationWhereInput
            }

            input PersonActedInMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ActedInCreateInput
              where: MovieConnectWhere
            }

            type PersonActedInMoviesConnection {
              edges: [PersonActedInMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonActedInMoviesConnectionFilters {
              \\"\\"\\"
              Return People where all of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              all: PersonActedInMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              none: PersonActedInMoviesConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              single: PersonActedInMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              some: PersonActedInMoviesConnectionWhere
            }

            input PersonActedInMoviesConnectionSort {
              edge: ActedInSort
              node: MovieSort
            }

            input PersonActedInMoviesConnectionWhere {
              AND: [PersonActedInMoviesConnectionWhere!]
              NOT: PersonActedInMoviesConnectionWhere
              OR: [PersonActedInMoviesConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input PersonActedInMoviesCreateFieldInput {
              edge: ActedInCreateInput
              node: MovieCreateInput!
            }

            input PersonActedInMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonActedInMoviesConnectionWhere
            }

            input PersonActedInMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonActedInMoviesConnectionWhere
            }

            input PersonActedInMoviesFieldInput {
              connect: [PersonActedInMoviesConnectFieldInput!]
              create: [PersonActedInMoviesCreateFieldInput!]
            }

            input PersonActedInMoviesNodeAggregationWhereInput {
              AND: [PersonActedInMoviesNodeAggregationWhereInput!]
              NOT: PersonActedInMoviesNodeAggregationWhereInput
              OR: [PersonActedInMoviesNodeAggregationWhereInput!]
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
            }

            type PersonActedInMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input PersonActedInMoviesRelationshipFilters {
              \\"\\"\\"Return People where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Return People where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
            }

            input PersonActedInMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
            }

            input PersonActedInMoviesUpdateFieldInput {
              connect: [PersonActedInMoviesConnectFieldInput!]
              create: [PersonActedInMoviesCreateFieldInput!]
              delete: [PersonActedInMoviesDeleteFieldInput!]
              disconnect: [PersonActedInMoviesDisconnectFieldInput!]
              update: PersonActedInMoviesUpdateConnectionInput
              where: PersonActedInMoviesConnectionWhere
            }

            type PersonAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input PersonConnectInput {
              actedInMovies: [PersonActedInMoviesConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              actedInMovies: PersonActedInMoviesFieldInput
              name: String!
            }

            input PersonDeleteInput {
              actedInMovies: [PersonActedInMoviesDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              actedInMovies: [PersonActedInMoviesDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieActedInMoviesAggregationSelection {
              count: Int!
              edge: PersonMovieActedInMoviesEdgeAggregateSelection
              node: PersonMovieActedInMoviesNodeAggregateSelection
            }

            type PersonMovieActedInMoviesEdgeAggregateSelection {
              pay: FloatAggregateSelection!
            }

            type PersonMovieActedInMoviesNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              name: SortDirection
            }

            input PersonUpdateInput {
              actedInMovies: [PersonActedInMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              actedInMovies: PersonActedInMoviesRelationshipFilters
              actedInMoviesAggregate: PersonActedInMoviesAggregateInput
              actedInMoviesConnection: PersonActedInMoviesConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_ALL: PersonActedInMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_NONE: PersonActedInMoviesConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_SINGLE: PersonActedInMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_SOME: PersonActedInMoviesConnectionWhere
              \\"\\"\\"Return People where all of the related Movies match this filter\\"\\"\\"
              actedInMovies_ALL: MovieWhere
              \\"\\"\\"Return People where none of the related Movies match this filter\\"\\"\\"
              actedInMovies_NONE: MovieWhere
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              actedInMovies_SINGLE: MovieWhere
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              actedInMovies_SOME: MovieWhere
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type Query {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
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
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
              matches: String
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
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }"
        `);
    });
});
