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

describe("Algebraic", () => {
    test("Int fields should be extended with Increment/Decrement operators", async () => {
        const typeDefs = gql`
            type Movie {
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              viewers: Int
              viewers_DECREMENT: Int
              viewers_INCREMENT: Int
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
              viewers: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
              viewers_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              viewers_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

    test("BigInt fields should be extended with Increment/Decrement operators", async () => {
        const typeDefs = gql`
            type Movie {
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
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              viewers: BigInt
              viewers_DECREMENT: BigInt
              viewers_INCREMENT: BigInt
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
              viewers: BigInt
              viewers_GT: BigInt
              viewers_GTE: BigInt
              viewers_IN: [BigInt!]
              viewers_LT: BigInt
              viewers_LTE: BigInt
              viewers_NOT: BigInt @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              viewers_NOT_IN: [BigInt!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

    test("Float fields should be extended with Add/Subtract/Multiply/Divide operators", async () => {
        const typeDefs = gql`
            type Movie {
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
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
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              viewers: Float
              viewers_ADD: Float
              viewers_DIVIDE: Float
              viewers_MULTIPLY: Float
              viewers_SUBTRACT: Float
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
              viewers: Float
              viewers_GT: Float
              viewers_GTE: Float
              viewers_IN: [Float!]
              viewers_LT: Float
              viewers_LTE: Float
              viewers_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              viewers_NOT_IN: [Float!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

    test("Operators should be presents in nested updates", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                viewers: Int!
                directedBy: Director @relationship(type: "DIRECTS", direction: IN)
            }

            type Director {
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

            type Director {
              directs(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              directsAggregate(directed: Boolean = true, where: MovieWhere): DirectorMovieDirectsAggregationSelection
              directsConnection(after: String, directed: Boolean = true, first: Int, sort: [DirectorDirectsConnectionSort!], where: DirectorDirectsConnectionWhere): DirectorDirectsConnection!
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
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: DirectorDirectsNodeAggregationWhereInput
            }

            input DirectorDirectsConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type DirectorDirectsConnection {
              edges: [DirectorDirectsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DirectorDirectsConnectionSort {
              node: MovieSort
            }

            input DirectorDirectsConnectionWhere {
              AND: [DirectorDirectsConnectionWhere!]
              NOT: DirectorDirectsConnectionWhere
              OR: [DirectorDirectsConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_AVERAGE_EQUAL: Float
              viewers_AVERAGE_GT: Float
              viewers_AVERAGE_GTE: Float
              viewers_AVERAGE_LT: Float
              viewers_AVERAGE_LTE: Float
              viewers_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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

            input DirectorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more DirectorSort objects to sort Directors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [DirectorSort!]
            }

            input DirectorRelationInput {
              directs: [DirectorDirectsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Directors by. The order in which sorts are applied is not guaranteed when specifying many fields in one DirectorSort object.
            \\"\\"\\"
            input DirectorSort {
              lastName: SortDirection
            }

            input DirectorUpdateInput {
              directs: [DirectorDirectsUpdateFieldInput!]
              lastName: String
            }

            input DirectorWhere {
              AND: [DirectorWhere!]
              NOT: DirectorWhere
              OR: [DirectorWhere!]
              directs: MovieWhere @deprecated(reason: \\"Use \`directs_SOME\` instead.\\")
              directsAggregate: DirectorDirectsAggregateInput
              directsConnection: DirectorDirectsConnectionWhere @deprecated(reason: \\"Use \`directsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Directors where all of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_ALL: DirectorDirectsConnectionWhere
              \\"\\"\\"
              Return Directors where none of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_NONE: DirectorDirectsConnectionWhere
              directsConnection_NOT: DirectorDirectsConnectionWhere @deprecated(reason: \\"Use \`directsConnection_NONE\` instead.\\")
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
              directs_NOT: MovieWhere @deprecated(reason: \\"Use \`directs_NONE\` instead.\\")
              \\"\\"\\"Return Directors where one of the related Movies match this filter\\"\\"\\"
              directs_SINGLE: MovieWhere
              \\"\\"\\"Return Directors where some of the related Movies match this filter\\"\\"\\"
              directs_SOME: MovieWhere
              lastName: String
              lastName_CONTAINS: String
              lastName_ENDS_WITH: String
              lastName_IN: [String!]
              lastName_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              lastName_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              lastName_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              lastName_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              lastName_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              directedBy(directed: Boolean = true, options: DirectorOptions, where: DirectorWhere): Director
              directedByAggregate(directed: Boolean = true, where: DirectorWhere): MovieDirectorDirectedByAggregationSelection
              directedByConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieDirectedByConnectionSort!], where: MovieDirectedByConnectionWhere): MovieDirectedByConnection!
              id: ID
              viewers: Int!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              viewers: IntAggregateSelection!
            }

            input MovieConnectInput {
              directedBy: MovieDirectedByConnectFieldInput
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
              directedBy: MovieDirectedByDeleteFieldInput
            }

            input MovieDirectedByAggregateInput {
              AND: [MovieDirectedByAggregateInput!]
              NOT: MovieDirectedByAggregateInput
              OR: [MovieDirectedByAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieDirectedByNodeAggregationWhereInput
            }

            input MovieDirectedByConnectFieldInput {
              connect: DirectorConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: DirectorConnectWhere
            }

            type MovieDirectedByConnection {
              edges: [MovieDirectedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieDirectedByConnectionSort {
              node: DirectorSort
            }

            input MovieDirectedByConnectionWhere {
              AND: [MovieDirectedByConnectionWhere!]
              NOT: MovieDirectedByConnectionWhere
              OR: [MovieDirectedByConnectionWhere!]
              node: DirectorWhere
              node_NOT: DirectorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              connect: MovieDirectedByConnectFieldInput
              create: MovieDirectedByCreateFieldInput
            }

            input MovieDirectedByNodeAggregationWhereInput {
              AND: [MovieDirectedByNodeAggregationWhereInput!]
              NOT: MovieDirectedByNodeAggregationWhereInput
              OR: [MovieDirectedByNodeAggregationWhereInput!]
              lastName_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_AVERAGE_LENGTH_EQUAL: Float
              lastName_AVERAGE_LENGTH_GT: Float
              lastName_AVERAGE_LENGTH_GTE: Float
              lastName_AVERAGE_LENGTH_LT: Float
              lastName_AVERAGE_LENGTH_LTE: Float
              lastName_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              lastName_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              lastName_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              lastName_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_LONGEST_LENGTH_EQUAL: Int
              lastName_LONGEST_LENGTH_GT: Int
              lastName_LONGEST_LENGTH_GTE: Int
              lastName_LONGEST_LENGTH_LT: Int
              lastName_LONGEST_LENGTH_LTE: Int
              lastName_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              lastName_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              lastName_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_SHORTEST_LENGTH_EQUAL: Int
              lastName_SHORTEST_LENGTH_GT: Int
              lastName_SHORTEST_LENGTH_GTE: Int
              lastName_SHORTEST_LENGTH_LT: Int
              lastName_SHORTEST_LENGTH_LTE: Int
              lastName_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              lastName_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type MovieDirectedByRelationship {
              cursor: String!
              node: Director!
            }

            input MovieDirectedByUpdateConnectionInput {
              node: DirectorUpdateInput
            }

            input MovieDirectedByUpdateFieldInput {
              connect: MovieDirectedByConnectFieldInput
              create: MovieDirectedByCreateFieldInput
              delete: MovieDirectedByDeleteFieldInput
              disconnect: MovieDirectedByDisconnectFieldInput
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
              directedBy: MovieDirectedByDisconnectFieldInput
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

            input MovieRelationInput {
              directedBy: MovieDirectedByCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              viewers: SortDirection
            }

            input MovieUpdateInput {
              directedBy: MovieDirectedByUpdateFieldInput
              id: ID
              viewers: Int
              viewers_DECREMENT: Int
              viewers_INCREMENT: Int
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              directedBy: DirectorWhere
              directedByAggregate: MovieDirectedByAggregateInput
              directedByConnection: MovieDirectedByConnectionWhere
              directedByConnection_NOT: MovieDirectedByConnectionWhere
              directedBy_NOT: DirectorWhere
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
              viewers: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
              viewers_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              viewers_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              updateDirectors(connect: DirectorConnectInput, create: DirectorRelationInput, delete: DirectorDeleteInput, disconnect: DirectorDisconnectInput, update: DirectorUpdateInput, where: DirectorWhere): UpdateDirectorsMutationResponse!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              directors(options: DirectorOptions, where: DirectorWhere): [Director!]!
              directorsAggregate(where: DirectorWhere): DirectorAggregateSelection!
              directorsConnection(after: String, first: Int, sort: [DirectorSort], where: DirectorWhere): DirectorsConnection!
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

            type UpdateDirectorsMutationResponse {
              directors: [Director!]!
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

    test("Should be supported in interfaces", async () => {
        const typeDefs = gql`
            interface Production {
                viewers: Int!
            }

            type Movie implements Production {
                id: ID
                viewers: Int!
                workers: [Person!]! @relationship(type: "WORKED_IN", direction: IN)
            }

            type Person {
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              id: ID
              viewers: Int!
              workers(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
              workersAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonWorkersAggregationSelection
              workersConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieWorkersConnectionSort!], where: MovieWorkersConnectionWhere): MovieWorkersConnection!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              viewers: IntAggregateSelection!
            }

            input MovieConnectInput {
              workers: [MovieWorkersConnectFieldInput!]
            }

            input MovieCreateInput {
              id: ID
              viewers: Int!
              workers: MovieWorkersFieldInput
            }

            input MovieDeleteInput {
              workers: [MovieWorkersDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              workers: [MovieWorkersDisconnectFieldInput!]
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

            type MoviePersonWorkersAggregationSelection {
              count: Int!
              node: MoviePersonWorkersNodeAggregateSelection
            }

            type MoviePersonWorkersNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieRelationInput {
              workers: [MovieWorkersCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              viewers: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              viewers: Int
              viewers_DECREMENT: Int
              viewers_INCREMENT: Int
              workers: [MovieWorkersUpdateFieldInput!]
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
              viewers: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
              viewers_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              viewers_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              workers: PersonWhere @deprecated(reason: \\"Use \`workers_SOME\` instead.\\")
              workersAggregate: MovieWorkersAggregateInput
              workersConnection: MovieWorkersConnectionWhere @deprecated(reason: \\"Use \`workersConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_ALL: MovieWorkersConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_NONE: MovieWorkersConnectionWhere
              workersConnection_NOT: MovieWorkersConnectionWhere @deprecated(reason: \\"Use \`workersConnection_NONE\` instead.\\")
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
              workers_NOT: PersonWhere @deprecated(reason: \\"Use \`workers_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              workers_SINGLE: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              workers_SOME: PersonWhere
            }

            input MovieWorkersAggregateInput {
              AND: [MovieWorkersAggregateInput!]
              NOT: MovieWorkersAggregateInput
              OR: [MovieWorkersAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieWorkersNodeAggregationWhereInput
            }

            input MovieWorkersConnectFieldInput {
              connect: [PersonConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: PersonConnectWhere
            }

            type MovieWorkersConnection {
              edges: [MovieWorkersRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieWorkersConnectionSort {
              node: PersonSort
            }

            input MovieWorkersConnectionWhere {
              AND: [MovieWorkersConnectionWhere!]
              NOT: MovieWorkersConnectionWhere
              OR: [MovieWorkersConnectionWhere!]
              node: PersonWhere
              node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type MovieWorkersRelationship {
              cursor: String!
              node: Person!
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
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(connect: PersonConnectInput, create: PersonRelationInput, delete: PersonDeleteInput, disconnect: PersonDisconnectInput, update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
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
              worksInProduction(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              worksInProductionAggregate(directed: Boolean = true, where: ProductionWhere): PersonProductionWorksInProductionAggregationSelection
              worksInProductionConnection(after: String, directed: Boolean = true, first: Int, sort: [PersonWorksInProductionConnectionSort!], where: PersonWorksInProductionConnectionWhere): PersonWorksInProductionConnection!
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

            input PersonOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PersonSort!]
            }

            type PersonProductionWorksInProductionAggregationSelection {
              count: Int!
              node: PersonProductionWorksInProductionNodeAggregateSelection
            }

            type PersonProductionWorksInProductionNodeAggregateSelection {
              viewers: IntAggregateSelection!
            }

            input PersonRelationInput {
              worksInProduction: [PersonWorksInProductionCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              name: SortDirection
            }

            input PersonUpdateInput {
              name: String
              worksInProduction: [PersonWorksInProductionUpdateFieldInput!]
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              worksInProduction: ProductionWhere @deprecated(reason: \\"Use \`worksInProduction_SOME\` instead.\\")
              worksInProductionAggregate: PersonWorksInProductionAggregateInput
              worksInProductionConnection: PersonWorksInProductionConnectionWhere @deprecated(reason: \\"Use \`worksInProductionConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return People where all of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_ALL: PersonWorksInProductionConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_NONE: PersonWorksInProductionConnectionWhere
              worksInProductionConnection_NOT: PersonWorksInProductionConnectionWhere @deprecated(reason: \\"Use \`worksInProductionConnection_NONE\` instead.\\")
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
              worksInProduction_NOT: ProductionWhere @deprecated(reason: \\"Use \`worksInProduction_NONE\` instead.\\")
              \\"\\"\\"Return People where one of the related Productions match this filter\\"\\"\\"
              worksInProduction_SINGLE: ProductionWhere
              \\"\\"\\"Return People where some of the related Productions match this filter\\"\\"\\"
              worksInProduction_SOME: ProductionWhere
            }

            input PersonWorksInProductionAggregateInput {
              AND: [PersonWorksInProductionAggregateInput!]
              NOT: PersonWorksInProductionAggregateInput
              OR: [PersonWorksInProductionAggregateInput!]
              count: Int
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

            input PersonWorksInProductionConnectionSort {
              node: ProductionSort
            }

            input PersonWorksInProductionConnectionWhere {
              AND: [PersonWorksInProductionConnectionWhere!]
              NOT: PersonWorksInProductionConnectionWhere
              OR: [PersonWorksInProductionConnectionWhere!]
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              viewers_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              viewers_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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

            input ProductionOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ProductionSort objects to sort Productions by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ProductionSort]
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              viewers: SortDirection
            }

            input ProductionUpdateInput {
              viewers: Int
              viewers_DECREMENT: Int
              viewers_INCREMENT: Int
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              typename_IN: [ProductionImplementation!]
              viewers: Int
              viewers_GT: Int
              viewers_GTE: Int
              viewers_IN: [Int!]
              viewers_LT: Int
              viewers_LTE: Int
              viewers_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              viewers_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
              productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
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
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }"
        `);
    });

    test("Should be supported in Relationship properties", async () => {
        const typeDefs = gql`
            type Person {
                name: String!
                actedInMovies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type Movie {
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
              pay_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              pay_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              pay_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              pay_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              pay_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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
              pay: Float
              pay_ADD: Float
              pay_DIVIDE: Float
              pay_MULTIPLY: Float
              pay_SUBTRACT: Float
              roles: [String!]
              roles_POP: Int
              roles_PUSH: [String!]
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              pay: Float
              pay_GT: Float
              pay_GTE: Float
              pay_IN: [Float]
              pay_LT: Float
              pay_LTE: Float
              pay_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              pay_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              roles: [String!]
              roles_INCLUDES: String
              roles_NOT: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              roles_NOT_INCLUDES: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type Movie {
              actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
              actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              title: String!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: Int
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
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: PersonConnectWhere
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: PersonWhere
              node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Person!
              properties: ActedIn!
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

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
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

            input MovieRelationInput {
              actors: [MovieActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere
              actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
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
              actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              actors_SINGLE: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              actors_SOME: PersonWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(connect: PersonConnectInput, create: PersonRelationInput, delete: PersonDeleteInput, disconnect: PersonDisconnectInput, update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
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
              actedInMovies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              actedInMoviesAggregate(directed: Boolean = true, where: MovieWhere): PersonMovieActedInMoviesAggregationSelection
              actedInMoviesConnection(after: String, directed: Boolean = true, first: Int, sort: [PersonActedInMoviesConnectionSort!], where: PersonActedInMoviesConnectionWhere): PersonActedInMoviesConnection!
              name: String!
            }

            input PersonActedInMoviesAggregateInput {
              AND: [PersonActedInMoviesAggregateInput!]
              NOT: PersonActedInMoviesAggregateInput
              OR: [PersonActedInMoviesAggregateInput!]
              count: Int
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
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type PersonActedInMoviesConnection {
              edges: [PersonActedInMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
              title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type PersonActedInMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
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

            input PersonOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PersonSort!]
            }

            input PersonRelationInput {
              actedInMovies: [PersonActedInMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              name: SortDirection
            }

            input PersonUpdateInput {
              actedInMovies: [PersonActedInMoviesUpdateFieldInput!]
              name: String
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              actedInMovies: MovieWhere @deprecated(reason: \\"Use \`actedInMovies_SOME\` instead.\\")
              actedInMoviesAggregate: PersonActedInMoviesAggregateInput
              actedInMoviesConnection: PersonActedInMoviesConnectionWhere @deprecated(reason: \\"Use \`actedInMoviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return People where all of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_ALL: PersonActedInMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_NONE: PersonActedInMoviesConnectionWhere
              actedInMoviesConnection_NOT: PersonActedInMoviesConnectionWhere @deprecated(reason: \\"Use \`actedInMoviesConnection_NONE\` instead.\\")
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
              actedInMovies_NOT: MovieWhere @deprecated(reason: \\"Use \`actedInMovies_NONE\` instead.\\")
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              actedInMovies_SINGLE: MovieWhere
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              actedInMovies_SOME: MovieWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }"
        `);
    });
});
