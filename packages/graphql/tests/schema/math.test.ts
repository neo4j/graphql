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

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              viewers: IntScalarFilters
              viewers_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { eq: ... }\\")
              viewers_GT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gt: ... }\\")
              viewers_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gte: ... }\\")
              viewers_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter viewers: { in: ... }\\")
              viewers_LT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lt: ... }\\")
              viewers_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lte: ... }\\")
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

            type Movie {
              id: ID
              viewers: BigInt!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              viewers: BigIntScalarFilters
              viewers_EQ: BigInt @deprecated(reason: \\"Please use the relevant generic filter viewers: { eq: ... }\\")
              viewers_GT: BigInt @deprecated(reason: \\"Please use the relevant generic filter viewers: { gt: ... }\\")
              viewers_GTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter viewers: { gte: ... }\\")
              viewers_IN: [BigInt!] @deprecated(reason: \\"Please use the relevant generic filter viewers: { in: ... }\\")
              viewers_LT: BigInt @deprecated(reason: \\"Please use the relevant generic filter viewers: { lt: ... }\\")
              viewers_LTE: BigInt @deprecated(reason: \\"Please use the relevant generic filter viewers: { lte: ... }\\")
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

            type Movie {
              id: ID
              viewers: Float!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              viewers: FloatScalarFilters
              viewers_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter viewers: { eq: ... }\\")
              viewers_GT: Float @deprecated(reason: \\"Please use the relevant generic filter viewers: { gt: ... }\\")
              viewers_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter viewers: { gte: ... }\\")
              viewers_IN: [Float!] @deprecated(reason: \\"Please use the relevant generic filter viewers: { in: ... }\\")
              viewers_LT: Float @deprecated(reason: \\"Please use the relevant generic filter viewers: { lt: ... }\\")
              viewers_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter viewers: { lte: ... }\\")
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
              directsConnection(after: String, first: Int, sort: [DirectorDirectsConnectionSort!], where: DirectorDirectsConnectionWhere): DirectorDirectsConnection!
              lastName: String!
            }

            type DirectorAggregate {
              count: Count!
              node: DirectorAggregateNode!
            }

            type DirectorAggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: DirectorDirectsNodeAggregationWhereInput
            }

            input DirectorDirectsConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type DirectorDirectsConnection {
              aggregate: DirectorMovieDirectsAggregateSelection!
              edges: [DirectorDirectsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DirectorDirectsConnectionAggregateInput {
              AND: [DirectorDirectsConnectionAggregateInput!]
              NOT: DirectorDirectsConnectionAggregateInput
              OR: [DirectorDirectsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: DirectorDirectsNodeAggregationWhereInput
            }

            input DirectorDirectsConnectionFilters {
              \\"\\"\\"
              Filter Directors by aggregating results on related DirectorDirectsConnections
              \\"\\"\\"
              aggregate: DirectorDirectsConnectionAggregateInput
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
              viewers: IntScalarAggregationFilters
              viewers_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { eq: ... } } }' instead.\\")
              viewers_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { gt: ... } } }' instead.\\")
              viewers_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { gte: ... } } }' instead.\\")
              viewers_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { lt: ... } } }' instead.\\")
              viewers_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { lte: ... } } }' instead.\\")
              viewers_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { eq: ... } } }' instead.\\")
              viewers_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { gt: ... } } }' instead.\\")
              viewers_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { gte: ... } } }' instead.\\")
              viewers_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { lt: ... } } }' instead.\\")
              viewers_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { lte: ... } } }' instead.\\")
              viewers_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { eq: ... } } }' instead.\\")
              viewers_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { gt: ... } } }' instead.\\")
              viewers_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { gte: ... } } }' instead.\\")
              viewers_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { lt: ... } } }' instead.\\")
              viewers_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { lte: ... } } }' instead.\\")
              viewers_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { eq: ... } } }' instead.\\")
              viewers_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { gt: ... } } }' instead.\\")
              viewers_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { gte: ... } } }' instead.\\")
              viewers_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { lt: ... } } }' instead.\\")
              viewers_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { lte: ... } } }' instead.\\")
            }

            type DirectorDirectsRelationship {
              cursor: String!
              node: Movie!
            }

            input DirectorDirectsUpdateConnectionInput {
              node: MovieUpdateInput
              where: DirectorDirectsConnectionWhere
            }

            input DirectorDirectsUpdateFieldInput {
              connect: [DirectorDirectsConnectFieldInput!]
              create: [DirectorDirectsCreateFieldInput!]
              delete: [DirectorDirectsDeleteFieldInput!]
              disconnect: [DirectorDirectsDisconnectFieldInput!]
              update: DirectorDirectsUpdateConnectionInput
            }

            input DirectorDisconnectInput {
              directs: [DirectorDirectsDisconnectFieldInput!]
            }

            type DirectorEdge {
              cursor: String!
              node: Director!
            }

            type DirectorMovieDirectsAggregateSelection {
              count: CountConnection!
              node: DirectorMovieDirectsNodeAggregateSelection
            }

            type DirectorMovieDirectsNodeAggregateSelection {
              viewers: IntAggregateSelection!
            }

            input DirectorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Directors match this filter\\"\\"\\"
              all: DirectorWhere
              \\"\\"\\"Filter type where none of the related Directors match this filter\\"\\"\\"
              none: DirectorWhere
              \\"\\"\\"Filter type where one of the related Directors match this filter\\"\\"\\"
              single: DirectorWhere
              \\"\\"\\"Filter type where some of the related Directors match this filter\\"\\"\\"
              some: DirectorWhere
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
              directs: MovieRelationshipFilters
              directsAggregate: DirectorDirectsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the directsConnection filter, please use { directsConnection: { aggregate: {...} } } instead\\")
              directsConnection: DirectorDirectsConnectionFilters
              \\"\\"\\"
              Return Directors where all of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_ALL: DirectorDirectsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Directors where none of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_NONE: DirectorDirectsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Directors where one of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_SINGLE: DirectorDirectsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Directors where some of the related DirectorDirectsConnections match this filter
              \\"\\"\\"
              directsConnection_SOME: DirectorDirectsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Directors where all of the related Movies match this filter\\"\\"\\"
              directs_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'directs: { all: ... }' instead.\\")
              \\"\\"\\"Return Directors where none of the related Movies match this filter\\"\\"\\"
              directs_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'directs: { none: ... }' instead.\\")
              \\"\\"\\"Return Directors where one of the related Movies match this filter\\"\\"\\"
              directs_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'directs: {  single: ... }' instead.\\")
              \\"\\"\\"Return Directors where some of the related Movies match this filter\\"\\"\\"
              directs_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'directs: {  some: ... }' instead.\\")
              lastName: StringScalarFilters
              lastName_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter lastName: { contains: ... }\\")
              lastName_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter lastName: { endsWith: ... }\\")
              lastName_EQ: String @deprecated(reason: \\"Please use the relevant generic filter lastName: { eq: ... }\\")
              lastName_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter lastName: { in: ... }\\")
              lastName_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter lastName: { startsWith: ... }\\")
            }

            type DirectorsConnection {
              aggregate: DirectorAggregate!
              edges: [DirectorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
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
              directedByConnection(after: String, first: Int, sort: [MovieDirectedByConnectionSort!], where: MovieDirectedByConnectionWhere): MovieDirectedByConnection!
              id: ID
              viewers: Int!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: MovieDirectedByNodeAggregationWhereInput
            }

            input MovieDirectedByConnectFieldInput {
              connect: [DirectorConnectInput!]
              where: DirectorConnectWhere
            }

            type MovieDirectedByConnection {
              aggregate: MovieDirectorDirectedByAggregateSelection!
              edges: [MovieDirectedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieDirectedByConnectionAggregateInput {
              AND: [MovieDirectedByConnectionAggregateInput!]
              NOT: MovieDirectedByConnectionAggregateInput
              OR: [MovieDirectedByConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: MovieDirectedByNodeAggregationWhereInput
            }

            input MovieDirectedByConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related MovieDirectedByConnections
              \\"\\"\\"
              aggregate: MovieDirectedByConnectionAggregateInput
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
              lastName: StringScalarAggregationFilters
              lastName_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { averageLength: { eq: ... } } }' instead.\\")
              lastName_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { averageLength: { gt: ... } } }' instead.\\")
              lastName_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { averageLength: { gte: ... } } }' instead.\\")
              lastName_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { averageLength: { lt: ... } } }' instead.\\")
              lastName_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { averageLength: { lte: ... } } }' instead.\\")
              lastName_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { longestLength: { eq: ... } } }' instead.\\")
              lastName_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { longestLength: { gt: ... } } }' instead.\\")
              lastName_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { longestLength: { gte: ... } } }' instead.\\")
              lastName_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { longestLength: { lt: ... } } }' instead.\\")
              lastName_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { longestLength: { lte: ... } } }' instead.\\")
              lastName_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { shortestLength: { eq: ... } } }' instead.\\")
              lastName_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { shortestLength: { gt: ... } } }' instead.\\")
              lastName_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { shortestLength: { gte: ... } } }' instead.\\")
              lastName_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { shortestLength: { lt: ... } } }' instead.\\")
              lastName_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'lastName: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type MovieDirectedByRelationship {
              cursor: String!
              node: Director!
            }

            input MovieDirectedByUpdateConnectionInput {
              node: DirectorUpdateInput
              where: MovieDirectedByConnectionWhere
            }

            input MovieDirectedByUpdateFieldInput {
              connect: [MovieDirectedByConnectFieldInput!]
              create: [MovieDirectedByCreateFieldInput!]
              delete: [MovieDirectedByDeleteFieldInput!]
              disconnect: [MovieDirectedByDisconnectFieldInput!]
              update: MovieDirectedByUpdateConnectionInput
            }

            type MovieDirectorDirectedByAggregateSelection {
              count: CountConnection!
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

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
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
              directedBy: DirectorRelationshipFilters
              directedByAggregate: MovieDirectedByAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the directedByConnection filter, please use { directedByConnection: { aggregate: {...} } } instead\\")
              directedByConnection: MovieDirectedByConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_ALL: MovieDirectedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedByConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_NONE: MovieDirectedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedByConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_SINGLE: MovieDirectedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedByConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieDirectedByConnections match this filter
              \\"\\"\\"
              directedByConnection_SOME: MovieDirectedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedByConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Directors match this filter\\"\\"\\"
              directedBy_ALL: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedBy: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Directors match this filter\\"\\"\\"
              directedBy_NONE: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedBy: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Directors match this filter\\"\\"\\"
              directedBy_SINGLE: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedBy: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Directors match this filter\\"\\"\\"
              directedBy_SOME: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directedBy: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              viewers: IntScalarFilters
              viewers_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { eq: ... }\\")
              viewers_GT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gt: ... }\\")
              viewers_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gte: ... }\\")
              viewers_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter viewers: { in: ... }\\")
              viewers_LT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lt: ... }\\")
              viewers_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lte: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              directorsConnection(after: String, first: Int, sort: [DirectorSort!], where: DirectorWhere): DirectorsConnection!
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

            type StringAggregateSelection {
              longest: String
              shortest: String
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
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
              workersConnection(after: String, first: Int, sort: [MovieWorkersConnectionSort!], where: MovieWorkersConnectionWhere): MovieWorkersConnection!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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

            type MoviePersonWorkersAggregateSelection {
              count: CountConnection!
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
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              viewers: IntScalarFilters
              viewers_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { eq: ... }\\")
              viewers_GT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gt: ... }\\")
              viewers_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gte: ... }\\")
              viewers_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter viewers: { in: ... }\\")
              viewers_LT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lt: ... }\\")
              viewers_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lte: ... }\\")
              workers: PersonRelationshipFilters
              workersAggregate: MovieWorkersAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the workersConnection filter, please use { workersConnection: { aggregate: {...} } } instead\\")
              workersConnection: MovieWorkersConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_ALL: MovieWorkersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'workersConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_NONE: MovieWorkersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'workersConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_SINGLE: MovieWorkersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'workersConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieWorkersConnections match this filter
              \\"\\"\\"
              workersConnection_SOME: MovieWorkersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'workersConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
              workers_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'workers: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
              workers_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'workers: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              workers_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'workers: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              workers_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'workers: {  some: ... }' instead.\\")
            }

            input MovieWorkersAggregateInput {
              AND: [MovieWorkersAggregateInput!]
              NOT: MovieWorkersAggregateInput
              OR: [MovieWorkersAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: MovieWorkersNodeAggregationWhereInput
            }

            input MovieWorkersConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            type MovieWorkersConnection {
              aggregate: MoviePersonWorkersAggregateSelection!
              edges: [MovieWorkersRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieWorkersConnectionAggregateInput {
              AND: [MovieWorkersConnectionAggregateInput!]
              NOT: MovieWorkersConnectionAggregateInput
              OR: [MovieWorkersConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: MovieWorkersNodeAggregationWhereInput
            }

            input MovieWorkersConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related MovieWorkersConnections
              \\"\\"\\"
              aggregate: MovieWorkersConnectionAggregateInput
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

            type MovieWorkersRelationship {
              cursor: String!
              node: Person!
            }

            input MovieWorkersUpdateConnectionInput {
              node: PersonUpdateInput
              where: MovieWorkersConnectionWhere
            }

            input MovieWorkersUpdateFieldInput {
              connect: [MovieWorkersConnectFieldInput!]
              create: [MovieWorkersCreateFieldInput!]
              delete: [MovieWorkersDeleteFieldInput!]
              disconnect: [MovieWorkersDisconnectFieldInput!]
              update: MovieWorkersUpdateConnectionInput
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              aggregate: PersonAggregate!
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person {
              name: String!
              worksInProduction(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              worksInProductionConnection(after: String, first: Int, sort: [PersonWorksInProductionConnectionSort!], where: PersonWorksInProductionConnectionWhere): PersonWorksInProductionConnection!
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
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

            type PersonProductionWorksInProductionAggregateSelection {
              count: CountConnection!
              node: PersonProductionWorksInProductionNodeAggregateSelection
            }

            type PersonProductionWorksInProductionNodeAggregateSelection {
              viewers: IntAggregateSelection!
            }

            input PersonRelationshipFilters {
              \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
              all: PersonWhere
              \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
              none: PersonWhere
              \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
              single: PersonWhere
              \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
              some: PersonWhere
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
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              worksInProduction: ProductionRelationshipFilters
              worksInProductionAggregate: PersonWorksInProductionAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the worksInProductionConnection filter, please use { worksInProductionConnection: { aggregate: {...} } } instead\\")
              worksInProductionConnection: PersonWorksInProductionConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_ALL: PersonWorksInProductionConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProductionConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_NONE: PersonWorksInProductionConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProductionConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_SINGLE: PersonWorksInProductionConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProductionConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related PersonWorksInProductionConnections match this filter
              \\"\\"\\"
              worksInProductionConnection_SOME: PersonWorksInProductionConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProductionConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related Productions match this filter\\"\\"\\"
              worksInProduction_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProduction: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related Productions match this filter\\"\\"\\"
              worksInProduction_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProduction: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related Productions match this filter\\"\\"\\"
              worksInProduction_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProduction: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related Productions match this filter\\"\\"\\"
              worksInProduction_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'worksInProduction: {  some: ... }' instead.\\")
            }

            input PersonWorksInProductionAggregateInput {
              AND: [PersonWorksInProductionAggregateInput!]
              NOT: PersonWorksInProductionAggregateInput
              OR: [PersonWorksInProductionAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: PersonWorksInProductionNodeAggregationWhereInput
            }

            input PersonWorksInProductionConnectFieldInput {
              where: ProductionConnectWhere
            }

            type PersonWorksInProductionConnection {
              aggregate: PersonProductionWorksInProductionAggregateSelection!
              edges: [PersonWorksInProductionRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonWorksInProductionConnectionAggregateInput {
              AND: [PersonWorksInProductionConnectionAggregateInput!]
              NOT: PersonWorksInProductionConnectionAggregateInput
              OR: [PersonWorksInProductionConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: PersonWorksInProductionNodeAggregationWhereInput
            }

            input PersonWorksInProductionConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related PersonWorksInProductionConnections
              \\"\\"\\"
              aggregate: PersonWorksInProductionConnectionAggregateInput
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
              viewers: IntScalarAggregationFilters
              viewers_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { eq: ... } } }' instead.\\")
              viewers_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { gt: ... } } }' instead.\\")
              viewers_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { gte: ... } } }' instead.\\")
              viewers_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { lt: ... } } }' instead.\\")
              viewers_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { average: { lte: ... } } }' instead.\\")
              viewers_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { eq: ... } } }' instead.\\")
              viewers_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { gt: ... } } }' instead.\\")
              viewers_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { gte: ... } } }' instead.\\")
              viewers_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { lt: ... } } }' instead.\\")
              viewers_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { max: { lte: ... } } }' instead.\\")
              viewers_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { eq: ... } } }' instead.\\")
              viewers_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { gt: ... } } }' instead.\\")
              viewers_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { gte: ... } } }' instead.\\")
              viewers_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { lt: ... } } }' instead.\\")
              viewers_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { min: { lte: ... } } }' instead.\\")
              viewers_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { eq: ... } } }' instead.\\")
              viewers_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { gt: ... } } }' instead.\\")
              viewers_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { gte: ... } } }' instead.\\")
              viewers_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { lt: ... } } }' instead.\\")
              viewers_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'viewers: { sum: { lte: ... } } }' instead.\\")
            }

            type PersonWorksInProductionRelationship {
              cursor: String!
              node: Production!
            }

            input PersonWorksInProductionUpdateConnectionInput {
              node: ProductionUpdateInput
              where: PersonWorksInProductionConnectionWhere
            }

            input PersonWorksInProductionUpdateFieldInput {
              connect: [PersonWorksInProductionConnectFieldInput!]
              create: [PersonWorksInProductionCreateFieldInput!]
              delete: [PersonWorksInProductionDeleteFieldInput!]
              disconnect: [PersonWorksInProductionDisconnectFieldInput!]
              update: PersonWorksInProductionUpdateConnectionInput
            }

            interface Production {
              viewers: Int!
            }

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
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

            input ProductionRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Filter type where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Filter type where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Filter type where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
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
              typename: [ProductionImplementation!]
              viewers: IntScalarFilters
              viewers_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { eq: ... }\\")
              viewers_GT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gt: ... }\\")
              viewers_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { gte: ... }\\")
              viewers_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter viewers: { in: ... }\\")
              viewers_LT: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lt: ... }\\")
              viewers_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter viewers: { lte: ... }\\")
            }

            type ProductionsConnection {
              aggregate: ProductionAggregate!
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
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
              pay: FloatScalarAggregationFilters
              pay_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { average: { eq: ... } } }' instead.\\")
              pay_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { average: { gt: ... } } }' instead.\\")
              pay_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { average: { gte: ... } } }' instead.\\")
              pay_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { average: { lt: ... } } }' instead.\\")
              pay_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { average: { lte: ... } } }' instead.\\")
              pay_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { max: { eq: ... } } }' instead.\\")
              pay_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { max: { gt: ... } } }' instead.\\")
              pay_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { max: { gte: ... } } }' instead.\\")
              pay_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { max: { lt: ... } } }' instead.\\")
              pay_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { max: { lte: ... } } }' instead.\\")
              pay_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { min: { eq: ... } } }' instead.\\")
              pay_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { min: { gt: ... } } }' instead.\\")
              pay_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { min: { gte: ... } } }' instead.\\")
              pay_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { min: { lt: ... } } }' instead.\\")
              pay_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { min: { lte: ... } } }' instead.\\")
              pay_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { sum: { eq: ... } } }' instead.\\")
              pay_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { sum: { gt: ... } } }' instead.\\")
              pay_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { sum: { gte: ... } } }' instead.\\")
              pay_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { sum: { lt: ... } } }' instead.\\")
              pay_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'pay: { sum: { lte: ... } } }' instead.\\")
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
              pay_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter pay: { eq: ... }\\")
              pay_GT: Float @deprecated(reason: \\"Please use the relevant generic filter pay: { gt: ... }\\")
              pay_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter pay: { gte: ... }\\")
              pay_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter pay: { in: ... }\\")
              pay_LT: Float @deprecated(reason: \\"Please use the relevant generic filter pay: { lt: ... }\\")
              pay_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter pay: { lte: ... }\\")
              roles: StringListFilters
              roles_EQ: [String!] @deprecated(reason: \\"Please use the relevant generic filter roles: { eq: ... }\\")
              roles_INCLUDES: String @deprecated(reason: \\"Please use the relevant generic filter roles: { includes: ... }\\")
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

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Mutations for a list for String\\"\\"\\"
            input ListStringMutations {
              pop: Int
              push: [String!]
              set: [String!]
            }

            type Movie {
              actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              title: String!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [PersonConnectInput!]
              edge: ActedInCreateInput
              where: PersonConnectWhere
            }

            type MovieActorsConnection {
              aggregate: MoviePersonActorsAggregateSelection!
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionAggregateInput {
              AND: [MovieActorsConnectionAggregateInput!]
              NOT: MovieActorsConnectionAggregateInput
              OR: [MovieActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
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

            type MovieActorsRelationship {
              cursor: String!
              node: Person!
              properties: ActedIn!
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: PersonUpdateInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [MovieActorsDeleteFieldInput!]
              disconnect: [MovieActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
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

            type MoviePersonActorsAggregateSelection {
              count: CountConnection!
              edge: MoviePersonActorsEdgeAggregateSelection
              node: MoviePersonActorsNodeAggregateSelection
            }

            type MoviePersonActorsEdgeAggregateSelection {
              pay: FloatAggregateSelection!
            }

            type MoviePersonActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
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
              actors: PersonRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
              actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
              actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              aggregate: PersonAggregate!
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person {
              actedInMovies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              actedInMoviesConnection(after: String, first: Int, sort: [PersonActedInMoviesConnectionSort!], where: PersonActedInMoviesConnectionWhere): PersonActedInMoviesConnection!
              name: String!
            }

            input PersonActedInMoviesAggregateInput {
              AND: [PersonActedInMoviesAggregateInput!]
              NOT: PersonActedInMoviesAggregateInput
              OR: [PersonActedInMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: PersonActedInMoviesNodeAggregationWhereInput
            }

            input PersonActedInMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ActedInCreateInput
              where: MovieConnectWhere
            }

            type PersonActedInMoviesConnection {
              aggregate: PersonMovieActedInMoviesAggregateSelection!
              edges: [PersonActedInMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonActedInMoviesConnectionAggregateInput {
              AND: [PersonActedInMoviesConnectionAggregateInput!]
              NOT: PersonActedInMoviesConnectionAggregateInput
              OR: [PersonActedInMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: PersonActedInMoviesNodeAggregationWhereInput
            }

            input PersonActedInMoviesConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related PersonActedInMoviesConnections
              \\"\\"\\"
              aggregate: PersonActedInMoviesConnectionAggregateInput
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
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type PersonActedInMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input PersonActedInMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
              where: PersonActedInMoviesConnectionWhere
            }

            input PersonActedInMoviesUpdateFieldInput {
              connect: [PersonActedInMoviesConnectFieldInput!]
              create: [PersonActedInMoviesCreateFieldInput!]
              delete: [PersonActedInMoviesDeleteFieldInput!]
              disconnect: [PersonActedInMoviesDisconnectFieldInput!]
              update: PersonActedInMoviesUpdateConnectionInput
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
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

            type PersonMovieActedInMoviesAggregateSelection {
              count: CountConnection!
              edge: PersonMovieActedInMoviesEdgeAggregateSelection
              node: PersonMovieActedInMoviesNodeAggregateSelection
            }

            type PersonMovieActedInMoviesEdgeAggregateSelection {
              pay: FloatAggregateSelection!
            }

            type PersonMovieActedInMoviesNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            input PersonRelationshipFilters {
              \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
              all: PersonWhere
              \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
              none: PersonWhere
              \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
              single: PersonWhere
              \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
              some: PersonWhere
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
              actedInMovies: MovieRelationshipFilters
              actedInMoviesAggregate: PersonActedInMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInMoviesConnection filter, please use { actedInMoviesConnection: { aggregate: {...} } } instead\\")
              actedInMoviesConnection: PersonActedInMoviesConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_ALL: PersonActedInMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMoviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_NONE: PersonActedInMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMoviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_SINGLE: PersonActedInMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMoviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related PersonActedInMoviesConnections match this filter
              \\"\\"\\"
              actedInMoviesConnection_SOME: PersonActedInMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMoviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related Movies match this filter\\"\\"\\"
              actedInMovies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMovies: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related Movies match this filter\\"\\"\\"
              actedInMovies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMovies: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              actedInMovies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMovies: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              actedInMovies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInMovies: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type Query {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
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
