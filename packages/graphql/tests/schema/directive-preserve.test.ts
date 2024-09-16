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
import type { NamedTypeNode, NonNullTypeNode, ObjectTypeDefinitionNode } from "graphql";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../src";

describe("Directive-preserve", () => {
    test("Custom directives preserved", async () => {
        const typeDefs = gql`
            directive @preservedTopLevel(string: String, int: Int, float: Float, boolean: Boolean) on OBJECT
            directive @preservedFieldLevel(string: String, int: Int, float: Float, boolean: Boolean) on FIELD_DEFINITION

            type Movie @preservedTopLevel {
                id: ID @preservedFieldLevel(string: "str", int: 12, float: 1.2, boolean: true)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            directive @preservedFieldLevel(boolean: Boolean, float: Float, int: Int, string: String) on FIELD_DEFINITION

            directive @preservedTopLevel(boolean: Boolean, float: Float, int: Int, string: String) on OBJECT

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

            type Movie @preservedTopLevel {
              id: ID @preservedFieldLevel(string: \\"str\\", int: 12, float: 1.2, boolean: true)
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
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
            }

            input MovieUpdateInput {
              id: ID
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

    test("Directives on relations preserved", async () => {
        const typeDefs = gql`
            type Movie {
                title: String
                year: Int
                imdbRating: Float
                genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT) @deprecated(reason: "Do not use")
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

            type Genre {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): GenreMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [GenreMoviesConnectionSort!], where: GenreMoviesConnectionWhere): GenreMoviesConnection!
              name: String
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
              imdbRating: FloatAggregateSelection!
              title: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            input GenreMoviesAggregateInput {
              AND: [GenreMoviesAggregateInput!]
              NOT: GenreMoviesAggregateInput
              OR: [GenreMoviesAggregateInput!]
              count: Int
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
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              NOT: GenreMoviesNodeAggregationWhereInput
              OR: [GenreMoviesNodeAggregationWhereInput!]
              imdbRating_AVERAGE_EQUAL: Float
              imdbRating_AVERAGE_GT: Float
              imdbRating_AVERAGE_GTE: Float
              imdbRating_AVERAGE_LT: Float
              imdbRating_AVERAGE_LTE: Float
              imdbRating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              imdbRating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              imdbRating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              imdbRating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              imdbRating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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
              year_AVERAGE_EQUAL: Float
              year_AVERAGE_GT: Float
              year_AVERAGE_GTE: Float
              year_AVERAGE_LT: Float
              year_AVERAGE_LTE: Float
              year_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              year_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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
              moviesConnection_NOT: GenreMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
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
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Genres where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Genres where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              genres(directed: Boolean = true, options: GenreOptions, where: GenreWhere): [Genre!]! @deprecated(reason: \\"Do not use\\")
              genresAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenresAggregationSelection @deprecated(reason: \\"Do not use\\")
              genresConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection! @deprecated(reason: \\"Do not use\\")
              imdbRating: Float
              title: String
              year: Int
            }

            type MovieAggregateSelection {
              count: Int!
              imdbRating: FloatAggregateSelection!
              title: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            input MovieConnectInput {
              genres: [MovieGenresConnectFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              genres: MovieGenresFieldInput @deprecated(reason: \\"Do not use\\")
              imdbRating: Float
              title: String
              year: Int
            }

            input MovieDeleteInput {
              genres: [MovieGenresDeleteFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieDisconnectInput {
              genres: [MovieGenresDisconnectFieldInput!] @deprecated(reason: \\"Do not use\\")
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
              name: StringAggregateSelection!
            }

            input MovieGenresAggregateInput {
              AND: [MovieGenresAggregateInput!]
              NOT: MovieGenresAggregateInput
              OR: [MovieGenresAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenresNodeAggregationWhereInput
            }

            input MovieGenresConnectFieldInput {
              connect: [GenreConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
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
              NOT: MovieGenresConnectionWhere
              OR: [MovieGenresConnectionWhere!]
              node: GenreWhere
              node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              NOT: MovieGenresNodeAggregationWhereInput
              OR: [MovieGenresNodeAggregationWhereInput!]
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
              genres: [MovieGenresCreateFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              imdbRating: SortDirection
              title: SortDirection
              year: SortDirection
            }

            input MovieUpdateInput {
              genres: [MovieGenresUpdateFieldInput!] @deprecated(reason: \\"Do not use\\")
              imdbRating: Float
              imdbRating_ADD: Float
              imdbRating_DIVIDE: Float
              imdbRating_MULTIPLY: Float
              imdbRating_SUBTRACT: Float
              title: String
              year: Int
              year_DECREMENT: Int
              year_INCREMENT: Int
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genres: GenreWhere @deprecated(reason: \\"Use \`genres_SOME\` instead.\\")
              genresAggregate: MovieGenresAggregateInput @deprecated(reason: \\"Do not use\\")
              genresConnection: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_ALL: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"
              Return Movies where none of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_NONE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use\\")
              genresConnection_NOT: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_SINGLE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"
              Return Movies where some of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_SOME: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
              genres_ALL: GenreWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
              genres_NONE: GenreWhere @deprecated(reason: \\"Do not use\\")
              genres_NOT: GenreWhere @deprecated(reason: \\"Use \`genres_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
              genres_SINGLE: GenreWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
              genres_SOME: GenreWhere @deprecated(reason: \\"Do not use\\")
              imdbRating: Float
              imdbRating_GT: Float
              imdbRating_GTE: Float
              imdbRating_IN: [Float]
              imdbRating_LT: Float
              imdbRating_LTE: Float
              imdbRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              imdbRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
              year: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int]
              year_LT: Int
              year_LTE: Int
              year_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              year_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

    test("Directives on implemented interface relations preserved - field declared relationship", async () => {
        const typeDefs = gql`
            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production {
                title: String!
                actors: [Actor!]!
                    @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    @deprecated(reason: "Do not use")
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                role: String!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const gqlSchema = await neoSchema.getSchema();
        const relationshipConnectionTypeName = (
            (
                (gqlSchema.getType("Movie")?.astNode as ObjectTypeDefinitionNode).fields?.find(
                    (f) => f.name.value === "actorsConnection"
                )?.type as NonNullTypeNode
            ).type as NamedTypeNode
        ).name.value;
        expect(relationshipConnectionTypeName).toBe("ProductionActorsConnection");

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(gqlSchema));
        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actors
            * Series.actors
            * Actor.actedIn
            \\"\\"\\"
            type ActedIn {
              role: String!
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              role_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_LENGTH_EQUAL: Float
              role_AVERAGE_LENGTH_GT: Float
              role_AVERAGE_LENGTH_GTE: Float
              role_AVERAGE_LENGTH_LT: Float
              role_AVERAGE_LENGTH_LTE: Float
              role_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_LENGTH_EQUAL: Int
              role_LONGEST_LENGTH_GT: Int
              role_LONGEST_LENGTH_GTE: Int
              role_LONGEST_LENGTH_LT: Int
              role_LONGEST_LENGTH_LTE: Int
              role_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_LENGTH_EQUAL: Int
              role_SHORTEST_LENGTH_GT: Int
              role_SHORTEST_LENGTH_GTE: Int
              role_SHORTEST_LENGTH_LT: Int
              role_SHORTEST_LENGTH_LTE: Int
              role_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            input ActedInCreateInput {
              role: String!
            }

            input ActedInSort {
              role: SortDirection
            }

            input ActedInUpdateInput {
              role: String
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              role: String
              role_CONTAINS: String
              role_ENDS_WITH: String
              role_IN: [String!]
              role_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_STARTS_WITH: String
            }

            type Actor {
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              connect: ProductionConnectInput
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ProductionSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: ProductionCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
            }

            input ActorActedInNodeAggregationWhereInput {
              AND: [ActorActedInNodeAggregationWhereInput!]
              NOT: ActorActedInNodeAggregationWhereInput
              OR: [ActorActedInNodeAggregationWhereInput!]
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

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
              where: ActorActedInConnectionWhere
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              actedIn: [ActorActedInDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            type ActorProductionActedInAggregationSelection {
              count: Int!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            input ActorRelationInput {
              actedIn: [ActorActedInCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere
              actedIn_NOT: ProductionWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere
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

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
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

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]! @deprecated(reason: \\"Do not use\\")
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection @deprecated(reason: \\"Do not use\\")
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection! @deprecated(reason: \\"Do not use\\")
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
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
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
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

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
              where: ProductionActorsConnectionWhere
            }

            type MovieAggregateSelection {
              count: Int!
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput @deprecated(reason: \\"Do not use\\")
              runtime: Int!
              title: String!
            }

            input MovieDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!] @deprecated(reason: \\"Do not use\\")
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
              actors: [MovieActorsCreateFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!] @deprecated(reason: \\"Do not use\\")
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Do not use\\")
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"
              Return Movies where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"
              Return Movies where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Do not use\\")
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Do not use\\")
              runtime: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              runtime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              runtime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(connect: SeriesConnectInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            interface Production {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              title: String!
            }

            input ProductionActorsAggregateInput {
              AND: [ProductionActorsAggregateInput!]
              NOT: ProductionActorsAggregateInput
              OR: [ProductionActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ProductionActorsEdgeAggregationWhereInput
              node: ProductionActorsNodeAggregationWhereInput
            }

            input ProductionActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ProductionActorsEdgeCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type ProductionActorsConnection {
              edges: [ProductionActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorsConnectionSort {
              edge: ProductionActorsEdgeSort
              node: ActorSort
            }

            input ProductionActorsConnectionWhere {
              AND: [ProductionActorsConnectionWhere!]
              NOT: ProductionActorsConnectionWhere
              OR: [ProductionActorsConnectionWhere!]
              edge: ProductionActorsEdgeWhere
              edge_NOT: ProductionActorsEdgeWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ActorWhere
              node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ProductionActorsCreateFieldInput {
              edge: ProductionActorsEdgeCreateInput!
              node: ActorCreateInput!
            }

            input ProductionActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInAggregationWhereInput
            }

            input ProductionActorsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInCreateInput!
            }

            input ProductionActorsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInSort
            }

            input ProductionActorsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInUpdateInput
            }

            input ProductionActorsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              ActedIn: ActedInWhere
            }

            input ProductionActorsNodeAggregationWhereInput {
              AND: [ProductionActorsNodeAggregationWhereInput!]
              NOT: ProductionActorsNodeAggregationWhereInput
              OR: [ProductionActorsNodeAggregationWhereInput!]
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

            type ProductionActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ProductionActorsRelationshipProperties!
            }

            union ProductionActorsRelationshipProperties = ActedIn

            input ProductionActorsUpdateConnectionInput {
              edge: ProductionActorsEdgeUpdateInput
              node: ActorUpdateInput
            }

            input ProductionActorsUpdateFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: ProductionActorsUpdateConnectionInput
              where: ProductionActorsConnectionWhere
            }

            type ProductionAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            input ProductionConnectInput {
              actors: [ProductionActorsConnectFieldInput!]
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            input ProductionDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
              Series
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
              title: SortDirection
            }

            input ProductionUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              title: String
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: ProductionActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Productions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Productions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
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
              typename_IN: [ProductionImplementation!]
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): SeriesActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              episodes: Int!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            input SeriesActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input SeriesActorsFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
            }

            input SeriesActorsNodeAggregationWhereInput {
              AND: [SeriesActorsNodeAggregationWhereInput!]
              NOT: SeriesActorsNodeAggregationWhereInput
              OR: [SeriesActorsNodeAggregationWhereInput!]
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

            input SeriesActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
            }

            input SeriesActorsUpdateFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: SeriesActorsUpdateConnectionInput
              where: ProductionActorsConnectionWhere
            }

            type SeriesAggregateSelection {
              count: Int!
              episodes: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input SeriesConnectInput {
              actors: [SeriesActorsConnectFieldInput!]
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actors: SeriesActorsFieldInput
              episodes: Int!
              title: String!
            }

            input SeriesDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            input SeriesDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            input SeriesRelationInput {
              actors: [SeriesActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodes: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [SeriesActorsUpdateFieldInput!]
              episodes: Int
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Series where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Series where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int!]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });

    test("Directives on implemented interface relations preserved - field not declared relationship", async () => {
        const typeDefs = gql`
            interface Production {
                title: String!
                actors: [Actor!]!
            }

            type Movie implements Production {
                title: String!
                actors: [Actor!]!
                    @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    @deprecated(reason: "Do not use")
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                role: String!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const gqlSchema = await neoSchema.getSchema();

        const relationshipConnectionTypeName = (
            (
                (gqlSchema.getType("Movie")?.astNode as ObjectTypeDefinitionNode).fields?.find(
                    (f) => f.name.value === "actorsConnection"
                )?.type as NonNullTypeNode
            ).type as NamedTypeNode
        ).name.value;
        expect(relationshipConnectionTypeName).toBe("MovieActorsConnection");
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(gqlSchema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actors
            * Series.actors
            * Actor.actedIn
            \\"\\"\\"
            type ActedIn {
              role: String!
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              role_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_LENGTH_EQUAL: Float
              role_AVERAGE_LENGTH_GT: Float
              role_AVERAGE_LENGTH_GTE: Float
              role_AVERAGE_LENGTH_LT: Float
              role_AVERAGE_LENGTH_LTE: Float
              role_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_LENGTH_EQUAL: Int
              role_LONGEST_LENGTH_GT: Int
              role_LONGEST_LENGTH_GTE: Int
              role_LONGEST_LENGTH_LT: Int
              role_LONGEST_LENGTH_LTE: Int
              role_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_LENGTH_EQUAL: Int
              role_SHORTEST_LENGTH_GT: Int
              role_SHORTEST_LENGTH_GTE: Int
              role_SHORTEST_LENGTH_LT: Int
              role_SHORTEST_LENGTH_LTE: Int
              role_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            input ActedInCreateInput {
              role: String!
            }

            input ActedInSort {
              role: SortDirection
            }

            input ActedInUpdateInput {
              role: String
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              role: String
              role_CONTAINS: String
              role_ENDS_WITH: String
              role_IN: [String!]
              role_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_STARTS_WITH: String
            }

            type Actor {
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ProductionSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: ProductionCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
            }

            input ActorActedInNodeAggregationWhereInput {
              AND: [ActorActedInNodeAggregationWhereInput!]
              NOT: ActorActedInNodeAggregationWhereInput
              OR: [ActorActedInNodeAggregationWhereInput!]
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

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
              where: ActorActedInConnectionWhere
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              actedIn: [ActorActedInDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            type ActorProductionActedInAggregationSelection {
              count: Int!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            input ActorRelationInput {
              actedIn: [ActorActedInCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere
              actedIn_NOT: ProductionWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere
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

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
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

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]! @deprecated(reason: \\"Do not use\\")
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection @deprecated(reason: \\"Do not use\\")
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection! @deprecated(reason: \\"Do not use\\")
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
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
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ActorWhere
              node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input MovieActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
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
              node: Actor!
              properties: ActedIn!
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
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
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput @deprecated(reason: \\"Do not use\\")
              runtime: Int!
              title: String!
            }

            input MovieDeleteInput {
              actors: [MovieActorsDeleteFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieDisconnectInput {
              actors: [MovieActorsDisconnectFieldInput!] @deprecated(reason: \\"Do not use\\")
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
              actors: [MovieActorsCreateFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!] @deprecated(reason: \\"Do not use\\")
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Do not use\\")
              actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Do not use\\")
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Do not use\\")
              runtime: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              runtime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              runtime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(connect: SeriesConnectInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            interface Production {
              actors: [Actor!]!
              title: String!
            }

            type ProductionAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
              Series
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
              title: SortDirection
            }

            input ProductionUpdateInput {
              title: String
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
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
              typename_IN: [ProductionImplementation!]
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): SeriesActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [SeriesActorsConnectionSort!], where: SeriesActorsConnectionWhere): SeriesActorsConnection!
              episodes: Int!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type SeriesActorsConnection {
              edges: [SeriesActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input SeriesActorsConnectionWhere {
              AND: [SeriesActorsConnectionWhere!]
              NOT: SeriesActorsConnectionWhere
              OR: [SeriesActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ActorWhere
              node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input SeriesActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input SeriesActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: SeriesActorsConnectionWhere
            }

            input SeriesActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: SeriesActorsConnectionWhere
            }

            input SeriesActorsFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
            }

            input SeriesActorsNodeAggregationWhereInput {
              AND: [SeriesActorsNodeAggregationWhereInput!]
              NOT: SeriesActorsNodeAggregationWhereInput
              OR: [SeriesActorsNodeAggregationWhereInput!]
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

            type SeriesActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ActedIn!
            }

            input SeriesActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
            }

            input SeriesActorsUpdateFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
              delete: [SeriesActorsDeleteFieldInput!]
              disconnect: [SeriesActorsDisconnectFieldInput!]
              update: SeriesActorsUpdateConnectionInput
              where: SeriesActorsConnectionWhere
            }

            type SeriesAggregateSelection {
              count: Int!
              episodes: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input SeriesConnectInput {
              actors: [SeriesActorsConnectFieldInput!]
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actors: SeriesActorsFieldInput
              episodes: Int!
              title: String!
            }

            input SeriesDeleteInput {
              actors: [SeriesActorsDeleteFieldInput!]
            }

            input SeriesDisconnectInput {
              actors: [SeriesActorsDisconnectFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            input SeriesRelationInput {
              actors: [SeriesActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodes: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [SeriesActorsUpdateFieldInput!]
              episodes: Int
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: SeriesActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Series where all of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: SeriesActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: SeriesActorsConnectionWhere
              actorsConnection_NOT: SeriesActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Series where one of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: SeriesActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: SeriesActorsConnectionWhere
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int!]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });

    test("Directives on base interface preserved", async () => {
        const typeDefs = gql`
            interface Production {
                title: String!
                actors: [Actor!]! @deprecated(reason: "Do not use")
            }

            type Movie implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                role: String!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
            * Movie.actors
            * Series.actors
            * Actor.actedIn
            \\"\\"\\"
            type ActedIn {
              role: String!
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              role_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_LENGTH_EQUAL: Float
              role_AVERAGE_LENGTH_GT: Float
              role_AVERAGE_LENGTH_GTE: Float
              role_AVERAGE_LENGTH_LT: Float
              role_AVERAGE_LENGTH_LTE: Float
              role_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_LENGTH_EQUAL: Int
              role_LONGEST_LENGTH_GT: Int
              role_LONGEST_LENGTH_GTE: Int
              role_LONGEST_LENGTH_LT: Int
              role_LONGEST_LENGTH_LTE: Int
              role_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              role_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_LENGTH_EQUAL: Int
              role_SHORTEST_LENGTH_GT: Int
              role_SHORTEST_LENGTH_GTE: Int
              role_SHORTEST_LENGTH_LT: Int
              role_SHORTEST_LENGTH_LTE: Int
              role_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              role_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            input ActedInCreateInput {
              role: String!
            }

            input ActedInSort {
              role: SortDirection
            }

            input ActedInUpdateInput {
              role: String
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              role: String
              role_CONTAINS: String
              role_ENDS_WITH: String
              role_IN: [String!]
              role_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              role_STARTS_WITH: String
            }

            type Actor {
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ProductionSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: ProductionCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
            }

            input ActorActedInNodeAggregationWhereInput {
              AND: [ActorActedInNodeAggregationWhereInput!]
              NOT: ActorActedInNodeAggregationWhereInput
              OR: [ActorActedInNodeAggregationWhereInput!]
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

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
              where: ActorActedInConnectionWhere
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              actedIn: [ActorActedInDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            type ActorProductionActedInAggregationSelection {
              count: Int!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type ActorProductionActedInNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            input ActorRelationInput {
              actedIn: [ActorActedInCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere
              \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
              actedIn_ALL: ProductionWhere
              \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
              actedIn_NONE: ProductionWhere
              actedIn_NOT: ProductionWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
              actedIn_SINGLE: ProductionWhere
              \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
              actedIn_SOME: ProductionWhere
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

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
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

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
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
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ActorWhere
              node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input MovieActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
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
              node: Actor!
              properties: ActedIn!
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
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
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              runtime: Int!
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

            input MovieRelationInput {
              actors: [MovieActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
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
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              runtime: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              runtime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              runtime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(connect: SeriesConnectInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            interface Production {
              actors: [Actor!]! @deprecated(reason: \\"Do not use\\")
              title: String!
            }

            type ProductionAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
              Series
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
              title: SortDirection
            }

            input ProductionUpdateInput {
              title: String
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
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
              typename_IN: [ProductionImplementation!]
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): SeriesActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [SeriesActorsConnectionSort!], where: SeriesActorsConnectionWhere): SeriesActorsConnection!
              episodes: Int!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              role: StringAggregateSelection!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              NOT: SeriesActorsAggregateInput
              OR: [SeriesActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type SeriesActorsConnection {
              edges: [SeriesActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input SeriesActorsConnectionWhere {
              AND: [SeriesActorsConnectionWhere!]
              NOT: SeriesActorsConnectionWhere
              OR: [SeriesActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ActorWhere
              node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input SeriesActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input SeriesActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: SeriesActorsConnectionWhere
            }

            input SeriesActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: SeriesActorsConnectionWhere
            }

            input SeriesActorsFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
            }

            input SeriesActorsNodeAggregationWhereInput {
              AND: [SeriesActorsNodeAggregationWhereInput!]
              NOT: SeriesActorsNodeAggregationWhereInput
              OR: [SeriesActorsNodeAggregationWhereInput!]
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

            type SeriesActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ActedIn!
            }

            input SeriesActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
            }

            input SeriesActorsUpdateFieldInput {
              connect: [SeriesActorsConnectFieldInput!]
              create: [SeriesActorsCreateFieldInput!]
              delete: [SeriesActorsDeleteFieldInput!]
              disconnect: [SeriesActorsDisconnectFieldInput!]
              update: SeriesActorsUpdateConnectionInput
              where: SeriesActorsConnectionWhere
            }

            type SeriesAggregateSelection {
              count: Int!
              episodes: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input SeriesConnectInput {
              actors: [SeriesActorsConnectFieldInput!]
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actors: SeriesActorsFieldInput
              episodes: Int!
              title: String!
            }

            input SeriesDeleteInput {
              actors: [SeriesActorsDeleteFieldInput!]
            }

            input SeriesDisconnectInput {
              actors: [SeriesActorsDisconnectFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            input SeriesRelationInput {
              actors: [SeriesActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodes: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [SeriesActorsUpdateFieldInput!]
              episodes: Int
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: SeriesActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Series where all of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: SeriesActorsConnectionWhere
              \\"\\"\\"
              Return Series where none of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: SeriesActorsConnectionWhere
              actorsConnection_NOT: SeriesActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Series where one of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: SeriesActorsConnectionWhere
              \\"\\"\\"
              Return Series where some of the related SeriesActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: SeriesActorsConnectionWhere
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int!]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodes_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });

    // https://github.com/neo4j/graphql/issues/2676
    test("Directives on unions preserved", async () => {
        const typeDefs = gql`
            union Content = Blog | Post

            type Blog {
                title: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            type Post {
                content: String @deprecated(reason: "Do not use post.content")
            }

            type User {
                name: String
                content: [Content!]!
                    @relationship(type: "HAS_CONTENT", direction: OUT)
                    @deprecated(reason: "Do not use user.content")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Blog {
              posts(directed: Boolean = true, options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(directed: Boolean = true, where: PostWhere): BlogPostPostsAggregationSelection
              postsConnection(after: String, directed: Boolean = true, first: Int, sort: [BlogPostsConnectionSort!], where: BlogPostsConnectionWhere): BlogPostsConnection!
              title: String
            }

            type BlogAggregateSelection {
              count: Int!
              title: StringAggregateSelection!
            }

            input BlogConnectInput {
              posts: [BlogPostsConnectFieldInput!]
            }

            input BlogConnectWhere {
              node: BlogWhere!
            }

            input BlogCreateInput {
              posts: BlogPostsFieldInput
              title: String
            }

            input BlogDeleteInput {
              posts: [BlogPostsDeleteFieldInput!]
            }

            input BlogDisconnectInput {
              posts: [BlogPostsDisconnectFieldInput!]
            }

            type BlogEdge {
              cursor: String!
              node: Blog!
            }

            input BlogOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BlogSort objects to sort Blogs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BlogSort!]
            }

            type BlogPostPostsAggregationSelection {
              count: Int!
              node: BlogPostPostsNodeAggregateSelection
            }

            type BlogPostPostsNodeAggregateSelection {
              content: StringAggregateSelection!
            }

            input BlogPostsAggregateInput {
              AND: [BlogPostsAggregateInput!]
              NOT: BlogPostsAggregateInput
              OR: [BlogPostsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: BlogPostsNodeAggregationWhereInput
            }

            input BlogPostsConnectFieldInput {
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: PostConnectWhere
            }

            type BlogPostsConnection {
              edges: [BlogPostsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BlogPostsConnectionSort {
              node: PostSort
            }

            input BlogPostsConnectionWhere {
              AND: [BlogPostsConnectionWhere!]
              NOT: BlogPostsConnectionWhere
              OR: [BlogPostsConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input BlogPostsCreateFieldInput {
              node: PostCreateInput!
            }

            input BlogPostsDeleteFieldInput {
              where: BlogPostsConnectionWhere
            }

            input BlogPostsDisconnectFieldInput {
              where: BlogPostsConnectionWhere
            }

            input BlogPostsFieldInput {
              connect: [BlogPostsConnectFieldInput!]
              create: [BlogPostsCreateFieldInput!]
            }

            input BlogPostsNodeAggregationWhereInput {
              AND: [BlogPostsNodeAggregationWhereInput!]
              NOT: BlogPostsNodeAggregationWhereInput
              OR: [BlogPostsNodeAggregationWhereInput!]
              content_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Do not use post.content\\")
              content_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Do not use post.content\\")
              content_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Do not use post.content\\")
              content_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Do not use post.content\\")
              content_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Do not use post.content\\")
              content_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Do not use post.content\\")
              content_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Do not use post.content\\")
              content_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Do not use post.content\\")
              content_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Do not use post.content\\")
              content_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Do not use post.content\\")
              content_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Do not use post.content\\")
              content_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Do not use post.content\\")
              content_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Do not use post.content\\")
              content_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Do not use post.content\\")
              content_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Do not use post.content\\")
              content_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type BlogPostsRelationship {
              cursor: String!
              node: Post!
            }

            input BlogPostsUpdateConnectionInput {
              node: PostUpdateInput
            }

            input BlogPostsUpdateFieldInput {
              connect: [BlogPostsConnectFieldInput!]
              create: [BlogPostsCreateFieldInput!]
              delete: [BlogPostsDeleteFieldInput!]
              disconnect: [BlogPostsDisconnectFieldInput!]
              update: BlogPostsUpdateConnectionInput
              where: BlogPostsConnectionWhere
            }

            input BlogRelationInput {
              posts: [BlogPostsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Blogs by. The order in which sorts are applied is not guaranteed when specifying many fields in one BlogSort object.
            \\"\\"\\"
            input BlogSort {
              title: SortDirection
            }

            input BlogUpdateInput {
              posts: [BlogPostsUpdateFieldInput!]
              title: String
            }

            input BlogWhere {
              AND: [BlogWhere!]
              NOT: BlogWhere
              OR: [BlogWhere!]
              posts: PostWhere @deprecated(reason: \\"Use \`posts_SOME\` instead.\\")
              postsAggregate: BlogPostsAggregateInput
              postsConnection: BlogPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Blogs where all of the related BlogPostsConnections match this filter
              \\"\\"\\"
              postsConnection_ALL: BlogPostsConnectionWhere
              \\"\\"\\"
              Return Blogs where none of the related BlogPostsConnections match this filter
              \\"\\"\\"
              postsConnection_NONE: BlogPostsConnectionWhere
              postsConnection_NOT: BlogPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Blogs where one of the related BlogPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SINGLE: BlogPostsConnectionWhere
              \\"\\"\\"
              Return Blogs where some of the related BlogPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SOME: BlogPostsConnectionWhere
              \\"\\"\\"Return Blogs where all of the related Posts match this filter\\"\\"\\"
              posts_ALL: PostWhere
              \\"\\"\\"Return Blogs where none of the related Posts match this filter\\"\\"\\"
              posts_NONE: PostWhere
              posts_NOT: PostWhere @deprecated(reason: \\"Use \`posts_NONE\` instead.\\")
              \\"\\"\\"Return Blogs where one of the related Posts match this filter\\"\\"\\"
              posts_SINGLE: PostWhere
              \\"\\"\\"Return Blogs where some of the related Posts match this filter\\"\\"\\"
              posts_SOME: PostWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
            }

            type BlogsConnection {
              edges: [BlogEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            union Content = Blog | Post

            input ContentWhere {
              Blog: BlogWhere
              Post: PostWhere
            }

            type CreateBlogsMutationResponse {
              blogs: [Blog!]!
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

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createBlogs(input: [BlogCreateInput!]!): CreateBlogsMutationResponse!
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteBlogs(delete: BlogDeleteInput, where: BlogWhere): DeleteInfo!
              deletePosts(where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updateBlogs(connect: BlogConnectInput, create: BlogRelationInput, delete: BlogDeleteInput, disconnect: BlogDisconnectInput, update: BlogUpdateInput, where: BlogWhere): UpdateBlogsMutationResponse!
              updatePosts(update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(connect: UserConnectInput, create: UserRelationInput, delete: UserDeleteInput, disconnect: UserDisconnectInput, update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              content: String @deprecated(reason: \\"Do not use post.content\\")
            }

            type PostAggregateSelection {
              content: StringAggregateSelection!
              count: Int!
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              content: String @deprecated(reason: \\"Do not use post.content\\")
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PostSort!]
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              content: SortDirection @deprecated(reason: \\"Do not use post.content\\")
            }

            input PostUpdateInput {
              content: String @deprecated(reason: \\"Do not use post.content\\")
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              content: String @deprecated(reason: \\"Do not use post.content\\")
              content_CONTAINS: String @deprecated(reason: \\"Do not use post.content\\")
              content_ENDS_WITH: String @deprecated(reason: \\"Do not use post.content\\")
              content_IN: [String] @deprecated(reason: \\"Do not use post.content\\")
              content_NOT: String @deprecated(reason: \\"Do not use post.content\\")
              content_NOT_CONTAINS: String @deprecated(reason: \\"Do not use post.content\\")
              content_NOT_ENDS_WITH: String @deprecated(reason: \\"Do not use post.content\\")
              content_NOT_IN: [String] @deprecated(reason: \\"Do not use post.content\\")
              content_NOT_STARTS_WITH: String @deprecated(reason: \\"Do not use post.content\\")
              content_STARTS_WITH: String @deprecated(reason: \\"Do not use post.content\\")
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              blogs(options: BlogOptions, where: BlogWhere): [Blog!]!
              blogsAggregate(where: BlogWhere): BlogAggregateSelection!
              blogsConnection(after: String, first: Int, sort: [BlogSort], where: BlogWhere): BlogsConnection!
              contents(options: QueryOptions, where: ContentWhere): [Content!]!
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
            }

            \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
            input QueryOptions {
              limit: Int
              offset: Int
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

            type UpdateBlogsMutationResponse {
              blogs: [Blog!]!
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

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              content(directed: Boolean = true, options: QueryOptions, where: ContentWhere): [Content!]! @deprecated(reason: \\"Do not use user.content\\")
              contentConnection(after: String, directed: Boolean = true, first: Int, where: UserContentConnectionWhere): UserContentConnection! @deprecated(reason: \\"Do not use user.content\\")
              name: String
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input UserConnectInput {
              content: UserContentConnectInput @deprecated(reason: \\"Do not use user.content\\")
            }

            input UserContentBlogConnectFieldInput {
              connect: [BlogConnectInput!]
              where: BlogConnectWhere
            }

            input UserContentBlogConnectionWhere {
              AND: [UserContentBlogConnectionWhere!]
              NOT: UserContentBlogConnectionWhere
              OR: [UserContentBlogConnectionWhere!]
              node: BlogWhere
              node_NOT: BlogWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input UserContentBlogCreateFieldInput {
              node: BlogCreateInput!
            }

            input UserContentBlogDeleteFieldInput {
              delete: BlogDeleteInput
              where: UserContentBlogConnectionWhere
            }

            input UserContentBlogDisconnectFieldInput {
              disconnect: BlogDisconnectInput
              where: UserContentBlogConnectionWhere
            }

            input UserContentBlogFieldInput {
              connect: [UserContentBlogConnectFieldInput!]
              create: [UserContentBlogCreateFieldInput!]
            }

            input UserContentBlogUpdateConnectionInput {
              node: BlogUpdateInput
            }

            input UserContentBlogUpdateFieldInput {
              connect: [UserContentBlogConnectFieldInput!]
              create: [UserContentBlogCreateFieldInput!]
              delete: [UserContentBlogDeleteFieldInput!]
              disconnect: [UserContentBlogDisconnectFieldInput!]
              update: UserContentBlogUpdateConnectionInput
              where: UserContentBlogConnectionWhere
            }

            input UserContentConnectInput {
              Blog: [UserContentBlogConnectFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
              Post: [UserContentPostConnectFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
            }

            type UserContentConnection {
              edges: [UserContentRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserContentConnectionWhere {
              Blog: UserContentBlogConnectionWhere
              Post: UserContentPostConnectionWhere
            }

            input UserContentCreateFieldInput {
              Blog: [UserContentBlogCreateFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
              Post: [UserContentPostCreateFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
            }

            input UserContentCreateInput {
              Blog: UserContentBlogFieldInput @deprecated(reason: \\"Do not use user.content\\")
              Post: UserContentPostFieldInput @deprecated(reason: \\"Do not use user.content\\")
            }

            input UserContentDeleteInput {
              Blog: [UserContentBlogDeleteFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
              Post: [UserContentPostDeleteFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
            }

            input UserContentDisconnectInput {
              Blog: [UserContentBlogDisconnectFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
              Post: [UserContentPostDisconnectFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
            }

            input UserContentPostConnectFieldInput {
              where: PostConnectWhere
            }

            input UserContentPostConnectionWhere {
              AND: [UserContentPostConnectionWhere!]
              NOT: UserContentPostConnectionWhere
              OR: [UserContentPostConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input UserContentPostCreateFieldInput {
              node: PostCreateInput!
            }

            input UserContentPostDeleteFieldInput {
              where: UserContentPostConnectionWhere
            }

            input UserContentPostDisconnectFieldInput {
              where: UserContentPostConnectionWhere
            }

            input UserContentPostFieldInput {
              connect: [UserContentPostConnectFieldInput!]
              create: [UserContentPostCreateFieldInput!]
            }

            input UserContentPostUpdateConnectionInput {
              node: PostUpdateInput
            }

            input UserContentPostUpdateFieldInput {
              connect: [UserContentPostConnectFieldInput!]
              create: [UserContentPostCreateFieldInput!]
              delete: [UserContentPostDeleteFieldInput!]
              disconnect: [UserContentPostDisconnectFieldInput!]
              update: UserContentPostUpdateConnectionInput
              where: UserContentPostConnectionWhere
            }

            type UserContentRelationship {
              cursor: String!
              node: Content!
            }

            input UserContentUpdateInput {
              Blog: [UserContentBlogUpdateFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
              Post: [UserContentPostUpdateFieldInput!] @deprecated(reason: \\"Do not use user.content\\")
            }

            input UserCreateInput {
              content: UserContentCreateInput @deprecated(reason: \\"Do not use user.content\\")
              name: String
            }

            input UserDeleteInput {
              content: UserContentDeleteInput @deprecated(reason: \\"Do not use user.content\\")
            }

            input UserDisconnectInput {
              content: UserContentDisconnectInput @deprecated(reason: \\"Do not use user.content\\")
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            input UserRelationInput {
              content: UserContentCreateFieldInput @deprecated(reason: \\"Do not use user.content\\")
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              content: UserContentUpdateInput @deprecated(reason: \\"Do not use user.content\\")
              name: String
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              content: ContentWhere @deprecated(reason: \\"Use \`content_SOME\` instead.\\")
              contentConnection: UserContentConnectionWhere @deprecated(reason: \\"Use \`contentConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Users where all of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_ALL: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
              \\"\\"\\"
              Return Users where none of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_NONE: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
              contentConnection_NOT: UserContentConnectionWhere @deprecated(reason: \\"Use \`contentConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SINGLE: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
              \\"\\"\\"
              Return Users where some of the related UserContentConnections match this filter
              \\"\\"\\"
              contentConnection_SOME: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
              \\"\\"\\"Return Users where all of the related Contents match this filter\\"\\"\\"
              content_ALL: ContentWhere @deprecated(reason: \\"Do not use user.content\\")
              \\"\\"\\"Return Users where none of the related Contents match this filter\\"\\"\\"
              content_NONE: ContentWhere @deprecated(reason: \\"Do not use user.content\\")
              content_NOT: ContentWhere @deprecated(reason: \\"Use \`content_NONE\` instead.\\")
              \\"\\"\\"Return Users where one of the related Contents match this filter\\"\\"\\"
              content_SINGLE: ContentWhere @deprecated(reason: \\"Do not use user.content\\")
              \\"\\"\\"Return Users where some of the related Contents match this filter\\"\\"\\"
              content_SOME: ContentWhere @deprecated(reason: \\"Do not use user.content\\")
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
