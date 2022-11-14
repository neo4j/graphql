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

describe("https://github.com/neo4j/graphql/issues/2187", () => {
    test("Deprecated directive should be present on genres in generated schema", async () => {
        const typeDefs = gql`
            type Movie {
                title: String @deprecated(reason: "Do not use title")
                year: Int
                imdbRating: Float
                genres: [Genre!]!
                    @relationship(type: "IN_GENRE", direction: OUT)
                    @deprecated(reason: "Do not use genre")
            }

            type Genre {
                name: String
                movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN)
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

            type FloatAggregateSelectionNullable {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type Genre {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): GenreMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreMoviesConnectionSort!], where: GenreMoviesConnectionWhere): GenreMoviesConnection!
              name: String
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNullable!
            }

            input GenreConnectInput {
              movies: [GenreMoviesConnectFieldInput!]
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              movies: GenreMoviesFieldInput
              name: String
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
              imdbRating: FloatAggregateSelectionNullable!
              title: StringAggregateSelectionNullable!
              year: IntAggregateSelectionNullable!
            }

            input GenreMoviesAggregateInput {
              AND: [GenreMoviesAggregateInput!]
              OR: [GenreMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreMoviesNodeAggregationWhereInput
            }

            input GenreMoviesConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
              connect: [MovieConnectInput!]
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
              OR: [GenreMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere
            }

            input GenreMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input GenreMoviesDeleteFieldInput {
              delete: MovieDeleteInput
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
              OR: [GenreMoviesNodeAggregationWhereInput!]
              imdbRating_AVERAGE_EQUAL: Float
              imdbRating_AVERAGE_GT: Float
              imdbRating_AVERAGE_GTE: Float
              imdbRating_AVERAGE_LT: Float
              imdbRating_AVERAGE_LTE: Float
              imdbRating_EQUAL: Float
              imdbRating_GT: Float
              imdbRating_GTE: Float
              imdbRating_LT: Float
              imdbRating_LTE: Float
              imdbRating_MAX_EQUAL: Float
              imdbRating_MAX_GT: Float
              imdbRating_MAX_GTE: Float
              imdbRating_MAX_LT: Float
              imdbRating_MAX_LTE: Float
              imdbRating_MIN_EQUAL: Float
              imdbRating_MIN_GT: Float
              imdbRating_MIN_GTE: Float
              imdbRating_MIN_LT: Float
              imdbRating_MIN_LTE: Float
              imdbRating_SUM_EQUAL: Float
              imdbRating_SUM_GT: Float
              imdbRating_SUM_GTE: Float
              imdbRating_SUM_LT: Float
              imdbRating_SUM_LTE: Float
              title_AVERAGE_EQUAL: Float
              title_AVERAGE_GT: Float
              title_AVERAGE_GTE: Float
              title_AVERAGE_LT: Float
              title_AVERAGE_LTE: Float
              title_EQUAL: String
              title_GT: Int
              title_GTE: Int
              title_LONGEST_EQUAL: Int
              title_LONGEST_GT: Int
              title_LONGEST_GTE: Int
              title_LONGEST_LT: Int
              title_LONGEST_LTE: Int
              title_LT: Int
              title_LTE: Int
              title_SHORTEST_EQUAL: Int
              title_SHORTEST_GT: Int
              title_SHORTEST_GTE: Int
              title_SHORTEST_LT: Int
              title_SHORTEST_LTE: Int
              year_AVERAGE_EQUAL: Float
              year_AVERAGE_GT: Float
              year_AVERAGE_GTE: Float
              year_AVERAGE_LT: Float
              year_AVERAGE_LTE: Float
              year_EQUAL: Int
              year_GT: Int
              year_GTE: Int
              year_LT: Int
              year_LTE: Int
              year_MAX_EQUAL: Int
              year_MAX_GT: Int
              year_MAX_GTE: Int
              year_MAX_LT: Int
              year_MAX_LTE: Int
              year_MIN_EQUAL: Int
              year_MIN_GT: Int
              year_MIN_GTE: Int
              year_MIN_LT: Int
              year_MIN_LTE: Int
              year_SUM_EQUAL: Int
              year_SUM_GT: Int
              year_SUM_GTE: Int
              year_SUM_LT: Int
              year_SUM_LTE: Int
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
              OR: [GenreWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: GenreMoviesAggregateInput
              moviesConnection: GenreMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              moviesConnection_ALL: GenreMoviesConnectionWhere
              moviesConnection_NONE: GenreMoviesConnectionWhere
              moviesConnection_NOT: GenreMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              moviesConnection_SINGLE: GenreMoviesConnectionWhere
              moviesConnection_SOME: GenreMoviesConnectionWhere
              \\"\\"\\"Return Genres where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Genres where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Genres where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Genres where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String
              name_NOT_CONTAINS: String
              name_NOT_ENDS_WITH: String
              name_NOT_IN: [String]
              name_NOT_STARTS_WITH: String
              name_STARTS_WITH: String
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelectionNullable {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              genres(directed: Boolean = true, options: GenreOptions, where: GenreWhere): [Genre!]! @deprecated(reason: \\"Do not use genre\\")
              genresAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenresAggregationSelection @deprecated(reason: \\"Do not use genre\\")
              genresConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection! @deprecated(reason: \\"Do not use genre\\")
              imdbRating: Float
              title: String @deprecated(reason: \\"Do not use title\\")
              year: Int
            }

            type MovieAggregateSelection {
              count: Int!
              imdbRating: FloatAggregateSelectionNullable!
              title: StringAggregateSelectionNullable!
              year: IntAggregateSelectionNullable!
            }

            input MovieConnectInput {
              genres: [MovieGenresConnectFieldInput!] @deprecated(reason: \\"Do not use genre\\")
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              genres: MovieGenresFieldInput @deprecated(reason: \\"Do not use genre\\")
              imdbRating: Float
              title: String @deprecated(reason: \\"Do not use title\\")
              year: Int
            }

            input MovieDeleteInput {
              genres: [MovieGenresDeleteFieldInput!] @deprecated(reason: \\"Do not use genre\\")
            }

            input MovieDisconnectInput {
              genres: [MovieGenresDisconnectFieldInput!] @deprecated(reason: \\"Do not use genre\\")
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieGenreGenresAggregationSelection {
              count: Int!
              node: MovieGenreGenresNodeAggregateSelection
            }

            type MovieGenreGenresNodeAggregateSelection {
              name: StringAggregateSelectionNullable!
            }

            input MovieGenresAggregateInput {
              AND: [MovieGenresAggregateInput!]
              OR: [MovieGenresAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenresNodeAggregationWhereInput
            }

            input MovieGenresConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
              connect: [GenreConnectInput!]
              where: GenreConnectWhere
            }

            type MovieGenresConnection {
              edges: [MovieGenresRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenresConnectionSort {
              node: GenreSort
            }

            input MovieGenresConnectionWhere {
              AND: [MovieGenresConnectionWhere!]
              OR: [MovieGenresConnectionWhere!]
              node: GenreWhere
              node_NOT: GenreWhere
            }

            input MovieGenresCreateFieldInput {
              node: GenreCreateInput!
            }

            input MovieGenresDeleteFieldInput {
              delete: GenreDeleteInput
              where: MovieGenresConnectionWhere
            }

            input MovieGenresDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: MovieGenresConnectionWhere
            }

            input MovieGenresFieldInput {
              connect: [MovieGenresConnectFieldInput!]
              create: [MovieGenresCreateFieldInput!]
            }

            input MovieGenresNodeAggregationWhereInput {
              AND: [MovieGenresNodeAggregationWhereInput!]
              OR: [MovieGenresNodeAggregationWhereInput!]
              name_AVERAGE_EQUAL: Float
              name_AVERAGE_GT: Float
              name_AVERAGE_GTE: Float
              name_AVERAGE_LT: Float
              name_AVERAGE_LTE: Float
              name_EQUAL: String
              name_GT: Int
              name_GTE: Int
              name_LONGEST_EQUAL: Int
              name_LONGEST_GT: Int
              name_LONGEST_GTE: Int
              name_LONGEST_LT: Int
              name_LONGEST_LTE: Int
              name_LT: Int
              name_LTE: Int
              name_SHORTEST_EQUAL: Int
              name_SHORTEST_GT: Int
              name_SHORTEST_GTE: Int
              name_SHORTEST_LT: Int
              name_SHORTEST_LTE: Int
            }

            type MovieGenresRelationship {
              cursor: String!
              node: Genre!
            }

            input MovieGenresUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input MovieGenresUpdateFieldInput {
              connect: [MovieGenresConnectFieldInput!]
              create: [MovieGenresCreateFieldInput!]
              delete: [MovieGenresDeleteFieldInput!]
              disconnect: [MovieGenresDisconnectFieldInput!]
              update: MovieGenresUpdateConnectionInput
              where: MovieGenresConnectionWhere
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
              genres: [MovieGenresCreateFieldInput!] @deprecated(reason: \\"Do not use genre\\")
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              imdbRating: SortDirection
              title: SortDirection @deprecated(reason: \\"Do not use title\\")
              year: SortDirection
            }

            input MovieUpdateInput {
              genres: [MovieGenresUpdateFieldInput!] @deprecated(reason: \\"Do not use genre\\")
              imdbRating: Float
              imdbRating_ADD: Float
              imdbRating_DIVIDE: Float
              imdbRating_MULTIPLY: Float
              imdbRating_SUBTRACT: Float
              title: String @deprecated(reason: \\"Do not use title\\")
              year: Int
              year_DECREMENT: Int
              year_INCREMENT: Int
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              genres: GenreWhere @deprecated(reason: \\"Use \`genres_SOME\` instead.\\")
              genresAggregate: MovieGenresAggregateInput @deprecated(reason: \\"Do not use genre\\")
              genresConnection: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_SOME\` instead.\\")
              genresConnection_ALL: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              genresConnection_NONE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              genresConnection_NOT: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_NONE\` instead.\\")
              genresConnection_SINGLE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              genresConnection_SOME: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
              genres_ALL: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
              genres_NONE: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              genres_NOT: GenreWhere @deprecated(reason: \\"Use \`genres_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
              genres_SINGLE: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
              genres_SOME: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              imdbRating: Float
              imdbRating_GT: Float
              imdbRating_GTE: Float
              imdbRating_IN: [Float]
              imdbRating_LT: Float
              imdbRating_LTE: Float
              imdbRating_NOT: Float
              imdbRating_NOT_IN: [Float]
              title: String @deprecated(reason: \\"Do not use title\\")
              title_CONTAINS: String @deprecated(reason: \\"Do not use title\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Do not use title\\")
              title_IN: [String] @deprecated(reason: \\"Do not use title\\")
              title_NOT: String @deprecated(reason: \\"Do not use title\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Do not use title\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Do not use title\\")
              title_NOT_IN: [String] @deprecated(reason: \\"Do not use title\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Do not use title\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Do not use title\\")
              year: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int]
              year_LT: Int
              year_LTE: Int
              year_NOT: Int
              year_NOT_IN: [Int]
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
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateGenres(connect: GenreConnectInput, create: GenreRelationInput, delete: GenreDeleteInput, disconnect: GenreDisconnectInput, update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
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
              genres(options: GenreOptions, where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort], where: GenreWhere): GenresConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
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
});
