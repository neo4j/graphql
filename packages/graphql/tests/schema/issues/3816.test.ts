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

describe("https://github.com/neo4j/graphql/issues/3816", () => {
    test("Combination of nested operations in reported issue", async () => {
        const typeDefs = gql`
            type Movie @node {
                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT, nestedOperations: [CONNECT, DISCONNECT])
            }

            type Genre @node {
                name: String!
                movies: [Movie!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
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

            type Genre {
              movies(directed: Boolean = true, limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): GenreMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreMoviesConnectionSort!], where: GenreMoviesConnectionWhere): GenreMoviesConnection!
              name: String!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input GenreConnectInput {
              movies: [GenreMoviesConnectFieldInput!]
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              movies: GenreMoviesFieldInput
              name: String!
            }

            input GenreDeleteInput {
              movies: [GenreMoviesDeleteFieldInput!]
            }

            input GenreDisconnectInput {
              movies: [GenreMoviesDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreMovieMoviesAggregationSelection {
              count: Int!
              node: GenreMovieMoviesNodeAggregateSelection
            }

            type GenreMovieMoviesNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input GenreMoviesAggregateInput {
              AND: [GenreMoviesAggregateInput!]
              NOT: GenreMoviesAggregateInput
              OR: [GenreMoviesAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreMoviesNodeAggregationWhereInput
            }

            input GenreMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type GenreMoviesConnection {
              edges: [GenreMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreMoviesConnectionSort {
              node: MovieSort
            }

            input GenreMoviesConnectionWhere {
              AND: [GenreMoviesConnectionWhere!]
              NOT: GenreMoviesConnectionWhere
              OR: [GenreMoviesConnectionWhere!]
              node: MovieWhere
            }

            input GenreMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input GenreMoviesDeleteFieldInput {
              where: GenreMoviesConnectionWhere
            }

            input GenreMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: GenreMoviesConnectionWhere
            }

            input GenreMoviesFieldInput {
              connect: [GenreMoviesConnectFieldInput!]
              create: [GenreMoviesCreateFieldInput!]
            }

            input GenreMoviesNodeAggregationWhereInput {
              AND: [GenreMoviesNodeAggregationWhereInput!]
              NOT: GenreMoviesNodeAggregationWhereInput
              OR: [GenreMoviesNodeAggregationWhereInput!]
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

            type GenreMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input GenreMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input GenreMoviesUpdateFieldInput {
              connect: [GenreMoviesConnectFieldInput!]
              create: [GenreMoviesCreateFieldInput!]
              delete: [GenreMoviesDeleteFieldInput!]
              disconnect: [GenreMoviesDisconnectFieldInput!]
              update: GenreMoviesUpdateConnectionInput
              where: GenreMoviesConnectionWhere
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreRelationInput {
              movies: [GenreMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreUpdateInput {
              movies: [GenreMoviesUpdateFieldInput!]
              name: String
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: GenreMoviesAggregateInput
              moviesConnection: GenreMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Genres where all of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: GenreMoviesConnectionWhere
              \\"\\"\\"Return Genres where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Genres where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              \\"\\"\\"Return Genres where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Genres where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie {
              genre(directed: Boolean = true, limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input MovieConnectInput {
              genre: MovieGenreConnectFieldInput
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              genre: MovieGenreFieldInput
              name: String!
            }

            input MovieDisconnectInput {
              genre: MovieGenreDisconnectFieldInput
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: GenreConnectWhere
            }

            type MovieGenreConnection {
              edges: [MovieGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenreConnectionSort {
              node: GenreSort
            }

            input MovieGenreConnectionWhere {
              AND: [MovieGenreConnectionWhere!]
              NOT: MovieGenreConnectionWhere
              OR: [MovieGenreConnectionWhere!]
              node: GenreWhere
            }

            input MovieGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreFieldInput {
              connect: MovieGenreConnectFieldInput
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
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

            type MovieGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input MovieGenreUpdateFieldInput {
              connect: MovieGenreConnectFieldInput
              disconnect: MovieGenreDisconnectFieldInput
              where: MovieGenreConnectionWhere
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
              name: SortDirection
            }

            input MovieUpdateInput {
              genre: MovieGenreUpdateFieldInput
              name: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreWhere
              genreAggregate: MovieGenreAggregateInput
              genreConnection: MovieGenreConnectionWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateGenres(connect: GenreConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: GenreRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: GenreDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: GenreDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              genres(limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
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

    test("No nested operations in one type", async () => {
        const typeDefs = gql`
            type Movie @node {
                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT, nestedOperations: [])
            }

            type Genre @node {
                name: String!
                movies: [Movie!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
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

            type Genre {
              movies(directed: Boolean = true, limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): GenreMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreMoviesConnectionSort!], where: GenreMoviesConnectionWhere): GenreMoviesConnection!
              name: String!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input GenreConnectInput {
              movies: [GenreMoviesConnectFieldInput!]
            }

            input GenreCreateInput {
              movies: GenreMoviesFieldInput
              name: String!
            }

            input GenreDeleteInput {
              movies: [GenreMoviesDeleteFieldInput!]
            }

            input GenreDisconnectInput {
              movies: [GenreMoviesDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreMovieMoviesAggregationSelection {
              count: Int!
              node: GenreMovieMoviesNodeAggregateSelection
            }

            type GenreMovieMoviesNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input GenreMoviesAggregateInput {
              AND: [GenreMoviesAggregateInput!]
              NOT: GenreMoviesAggregateInput
              OR: [GenreMoviesAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreMoviesNodeAggregationWhereInput
            }

            input GenreMoviesConnectFieldInput {
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type GenreMoviesConnection {
              edges: [GenreMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreMoviesConnectionSort {
              node: MovieSort
            }

            input GenreMoviesConnectionWhere {
              AND: [GenreMoviesConnectionWhere!]
              NOT: GenreMoviesConnectionWhere
              OR: [GenreMoviesConnectionWhere!]
              node: MovieWhere
            }

            input GenreMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input GenreMoviesDeleteFieldInput {
              where: GenreMoviesConnectionWhere
            }

            input GenreMoviesDisconnectFieldInput {
              where: GenreMoviesConnectionWhere
            }

            input GenreMoviesFieldInput {
              connect: [GenreMoviesConnectFieldInput!]
              create: [GenreMoviesCreateFieldInput!]
            }

            input GenreMoviesNodeAggregationWhereInput {
              AND: [GenreMoviesNodeAggregationWhereInput!]
              NOT: GenreMoviesNodeAggregationWhereInput
              OR: [GenreMoviesNodeAggregationWhereInput!]
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

            type GenreMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input GenreMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input GenreMoviesUpdateFieldInput {
              connect: [GenreMoviesConnectFieldInput!]
              create: [GenreMoviesCreateFieldInput!]
              delete: [GenreMoviesDeleteFieldInput!]
              disconnect: [GenreMoviesDisconnectFieldInput!]
              update: GenreMoviesUpdateConnectionInput
              where: GenreMoviesConnectionWhere
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreRelationInput {
              movies: [GenreMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreUpdateInput {
              movies: [GenreMoviesUpdateFieldInput!]
              name: String
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: GenreMoviesAggregateInput
              moviesConnection: GenreMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Genres where all of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: GenreMoviesConnectionWhere
              \\"\\"\\"Return Genres where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Genres where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              \\"\\"\\"Return Genres where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Genres where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie {
              genre(directed: Boolean = true, limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              name: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenreNodeAggregationWhereInput
            }

            type MovieGenreConnection {
              edges: [MovieGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenreConnectionSort {
              node: GenreSort
            }

            input MovieGenreConnectionWhere {
              AND: [MovieGenreConnectionWhere!]
              NOT: MovieGenreConnectionWhere
              OR: [MovieGenreConnectionWhere!]
              node: GenreWhere
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
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

            type MovieGenreRelationship {
              cursor: String!
              node: Genre!
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
              name: SortDirection
            }

            input MovieUpdateInput {
              name: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreWhere
              genreAggregate: MovieGenreAggregateInput
              genreConnection: MovieGenreConnectionWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateGenres(connect: GenreConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: GenreRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: GenreDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: GenreDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
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
              genres(limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
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
});
