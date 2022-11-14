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

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type Movie @preservedTopLevel {
              id: ID @preservedFieldLevel(string: \\"str\\", int: 12, float: 1.2, boolean: true)
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
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
              OR: [MovieWhere!]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
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
              genres(directed: Boolean = true, options: GenreOptions, where: GenreWhere): [Genre!]! @deprecated(reason: \\"Do not use\\")
              genresAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenresAggregationSelection @deprecated(reason: \\"Do not use\\")
              genresConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection! @deprecated(reason: \\"Do not use\\")
              imdbRating: Float
              title: String
              year: Int
            }

            type MovieAggregateSelection {
              count: Int!
              imdbRating: FloatAggregateSelectionNullable!
              title: StringAggregateSelectionNullable!
              year: IntAggregateSelectionNullable!
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
              OR: [MovieWhere!]
              genres: GenreWhere @deprecated(reason: \\"Use \`genres_SOME\` instead.\\")
              genresAggregate: MovieGenresAggregateInput @deprecated(reason: \\"Do not use\\")
              genresConnection: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_SOME\` instead.\\")
              genresConnection_ALL: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use\\")
              genresConnection_NONE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use\\")
              genresConnection_NOT: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_NONE\` instead.\\")
              genresConnection_SINGLE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use\\")
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
              imdbRating_NOT: Float
              imdbRating_NOT_IN: [Float]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
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

    test("Directives on implemented interface relations preserved", async () => {
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

            interface ActedIn @relationshipProperties {
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

            interface ActedIn {
              role: String!
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
              OR: [ActedInWhere!]
              role: String
              role_CONTAINS: String
              role_ENDS_WITH: String
              role_IN: [String!]
              role_NOT: String
              role_NOT_CONTAINS: String
              role_NOT_ENDS_WITH: String
              role_NOT_IN: [String!]
              role_NOT_STARTS_WITH: String
              role_STARTS_WITH: String
            }

            type Actor {
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
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
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere
              node: ProductionWhere
              node_NOT: ProductionWhere
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

            type ActorActedInRelationship implements ActedIn {
              cursor: String!
              node: Production!
              role: String!
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
              name: StringAggregateSelectionNonNullable!
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
              OR: [ActorWhere!]
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              actedInConnection_ALL: ActorActedInConnectionWhere
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              actedInConnection_SOME: ActorActedInConnectionWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String
              name_NOT_CONTAINS: String
              name_NOT_ENDS_WITH: String
              name_NOT_IN: [String!]
              name_NOT_STARTS_WITH: String
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

            type CreateInfo {
              bookmark: String
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

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IntAggregateSelectionNonNullable {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
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
              role: StringAggregateSelectionNonNullable!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              OR: [MovieActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: MovieActorsEdgeAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsEdgeAggregationWhereInput {
              AND: [MovieActorsEdgeAggregationWhereInput!]
              OR: [MovieActorsEdgeAggregationWhereInput!]
              role_AVERAGE_EQUAL: Float
              role_AVERAGE_GT: Float
              role_AVERAGE_GTE: Float
              role_AVERAGE_LT: Float
              role_AVERAGE_LTE: Float
              role_EQUAL: String
              role_GT: Int
              role_GTE: Int
              role_LONGEST_EQUAL: Int
              role_LONGEST_GT: Int
              role_LONGEST_GTE: Int
              role_LONGEST_LT: Int
              role_LONGEST_LTE: Int
              role_LT: Int
              role_LTE: Int
              role_SHORTEST_EQUAL: Int
              role_SHORTEST_GT: Int
              role_SHORTEST_GTE: Int
              role_SHORTEST_LT: Int
              role_SHORTEST_LTE: Int
            }

            input MovieActorsNodeAggregationWhereInput {
              AND: [MovieActorsNodeAggregationWhereInput!]
              OR: [MovieActorsNodeAggregationWhereInput!]
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

            type MovieAggregateSelection {
              count: Int!
              runtime: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectInput {
              actors: [ProductionActorsConnectFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieCreateInput {
              actors: ProductionActorsFieldInput @deprecated(reason: \\"Do not use\\")
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
              actors: [ProductionActorsCreateFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!] @deprecated(reason: \\"Do not use\\")
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Do not use\\")
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
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
              runtime_NOT: Int
              runtime_NOT_IN: [Int!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String!]
              title_NOT_STARTS_WITH: String
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

            input ProductionActorsConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            type ProductionActorsConnection {
              edges: [ProductionActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input ProductionActorsConnectionWhere {
              AND: [ProductionActorsConnectionWhere!]
              OR: [ProductionActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere
              node: ActorWhere
              node_NOT: ActorWhere
            }

            input ProductionActorsCreateFieldInput {
              edge: ActedInCreateInput!
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

            input ProductionActorsFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
            }

            type ProductionActorsRelationship implements ActedIn {
              cursor: String!
              node: Actor!
              role: String!
            }

            input ProductionActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
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

            input ProductionConnectInput {
              _on: ProductionImplementationsConnectInput
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              _on: ProductionImplementationsDeleteInput
            }

            input ProductionDisconnectInput {
              _on: ProductionImplementationsDisconnectInput
            }

            input ProductionImplementationsConnectInput {
              Movie: [MovieConnectInput!]
              Series: [SeriesConnectInput!]
            }

            input ProductionImplementationsDeleteInput {
              Movie: [MovieDeleteInput!]
              Series: [SeriesDeleteInput!]
            }

            input ProductionImplementationsDisconnectInput {
              Movie: [MovieDisconnectInput!]
              Series: [SeriesDisconnectInput!]
            }

            input ProductionImplementationsUpdateInput {
              Movie: MovieUpdateInput
              Series: SeriesUpdateInput
            }

            input ProductionImplementationsWhere {
              Movie: MovieWhere
              Series: SeriesWhere
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
              _on: ProductionImplementationsUpdateInput
              title: String
            }

            input ProductionWhere {
              _on: ProductionImplementationsWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String!]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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
              role: StringAggregateSelectionNonNullable!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              OR: [SeriesActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: SeriesActorsEdgeAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsEdgeAggregationWhereInput {
              AND: [SeriesActorsEdgeAggregationWhereInput!]
              OR: [SeriesActorsEdgeAggregationWhereInput!]
              role_AVERAGE_EQUAL: Float
              role_AVERAGE_GT: Float
              role_AVERAGE_GTE: Float
              role_AVERAGE_LT: Float
              role_AVERAGE_LTE: Float
              role_EQUAL: String
              role_GT: Int
              role_GTE: Int
              role_LONGEST_EQUAL: Int
              role_LONGEST_GT: Int
              role_LONGEST_GTE: Int
              role_LONGEST_LT: Int
              role_LONGEST_LTE: Int
              role_LT: Int
              role_LTE: Int
              role_SHORTEST_EQUAL: Int
              role_SHORTEST_GT: Int
              role_SHORTEST_GTE: Int
              role_SHORTEST_LT: Int
              role_SHORTEST_LTE: Int
            }

            input SeriesActorsNodeAggregationWhereInput {
              AND: [SeriesActorsNodeAggregationWhereInput!]
              OR: [SeriesActorsNodeAggregationWhereInput!]
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

            type SeriesAggregateSelection {
              count: Int!
              episodes: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input SeriesConnectInput {
              actors: [ProductionActorsConnectFieldInput!]
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actors: ProductionActorsFieldInput
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
              actors: [ProductionActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodes: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              episodes: Int
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              OR: [SeriesWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: SeriesActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              actorsConnection_ALL: ProductionActorsConnectionWhere
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
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
              episodes_NOT: Int
              episodes_NOT_IN: [Int!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String!]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNonNullable {
              longest: String!
              shortest: String!
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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

            interface ActedIn @relationshipProperties {
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

            interface ActedIn {
              role: String!
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
              OR: [ActedInWhere!]
              role: String
              role_CONTAINS: String
              role_ENDS_WITH: String
              role_IN: [String!]
              role_NOT: String
              role_NOT_CONTAINS: String
              role_NOT_ENDS_WITH: String
              role_NOT_IN: [String!]
              role_NOT_STARTS_WITH: String
              role_STARTS_WITH: String
            }

            type Actor {
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
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
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere
              node: ProductionWhere
              node_NOT: ProductionWhere
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

            type ActorActedInRelationship implements ActedIn {
              cursor: String!
              node: Production!
              role: String!
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
              name: StringAggregateSelectionNonNullable!
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
              OR: [ActorWhere!]
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              actedInConnection_ALL: ActorActedInConnectionWhere
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              actedInConnection_SOME: ActorActedInConnectionWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String
              name_NOT_CONTAINS: String
              name_NOT_ENDS_WITH: String
              name_NOT_IN: [String!]
              name_NOT_STARTS_WITH: String
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

            type CreateInfo {
              bookmark: String
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

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IntAggregateSelectionNonNullable {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
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
              role: StringAggregateSelectionNonNullable!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              OR: [MovieActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: MovieActorsEdgeAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsEdgeAggregationWhereInput {
              AND: [MovieActorsEdgeAggregationWhereInput!]
              OR: [MovieActorsEdgeAggregationWhereInput!]
              role_AVERAGE_EQUAL: Float
              role_AVERAGE_GT: Float
              role_AVERAGE_GTE: Float
              role_AVERAGE_LT: Float
              role_AVERAGE_LTE: Float
              role_EQUAL: String
              role_GT: Int
              role_GTE: Int
              role_LONGEST_EQUAL: Int
              role_LONGEST_GT: Int
              role_LONGEST_GTE: Int
              role_LONGEST_LT: Int
              role_LONGEST_LTE: Int
              role_LT: Int
              role_LTE: Int
              role_SHORTEST_EQUAL: Int
              role_SHORTEST_GT: Int
              role_SHORTEST_GTE: Int
              role_SHORTEST_LT: Int
              role_SHORTEST_LTE: Int
            }

            input MovieActorsNodeAggregationWhereInput {
              AND: [MovieActorsNodeAggregationWhereInput!]
              OR: [MovieActorsNodeAggregationWhereInput!]
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

            type MovieAggregateSelection {
              count: Int!
              runtime: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectInput {
              actors: [ProductionActorsConnectFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input MovieCreateInput {
              actors: ProductionActorsFieldInput @deprecated(reason: \\"Do not use\\")
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
              actors: [ProductionActorsCreateFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!] @deprecated(reason: \\"Do not use\\")
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Do not use\\")
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
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
              runtime_NOT: Int
              runtime_NOT_IN: [Int!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String!]
              title_NOT_STARTS_WITH: String
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

            input ProductionActorsConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            type ProductionActorsConnection {
              edges: [ProductionActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input ProductionActorsConnectionWhere {
              AND: [ProductionActorsConnectionWhere!]
              OR: [ProductionActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere
              node: ActorWhere
              node_NOT: ActorWhere
            }

            input ProductionActorsCreateFieldInput {
              edge: ActedInCreateInput!
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

            input ProductionActorsFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
            }

            type ProductionActorsRelationship implements ActedIn {
              cursor: String!
              node: Actor!
              role: String!
            }

            input ProductionActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
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

            input ProductionConnectInput {
              _on: ProductionImplementationsConnectInput
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              _on: ProductionImplementationsDeleteInput
            }

            input ProductionDisconnectInput {
              _on: ProductionImplementationsDisconnectInput
            }

            input ProductionImplementationsConnectInput {
              Movie: [MovieConnectInput!]
              Series: [SeriesConnectInput!]
            }

            input ProductionImplementationsDeleteInput {
              Movie: [MovieDeleteInput!]
              Series: [SeriesDeleteInput!]
            }

            input ProductionImplementationsDisconnectInput {
              Movie: [MovieDisconnectInput!]
              Series: [SeriesDisconnectInput!]
            }

            input ProductionImplementationsUpdateInput {
              Movie: MovieUpdateInput
              Series: SeriesUpdateInput
            }

            input ProductionImplementationsWhere {
              Movie: MovieWhere
              Series: SeriesWhere
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
              _on: ProductionImplementationsUpdateInput
              title: String
            }

            input ProductionWhere {
              _on: ProductionImplementationsWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String!]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]! @deprecated(reason: \\"Do not use\\")
              actorsAggregate(directed: Boolean = true, where: ActorWhere): SeriesActorActorsAggregationSelection @deprecated(reason: \\"Do not use\\")
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection! @deprecated(reason: \\"Do not use\\")
              episodes: Int!
              title: String!
            }

            type SeriesActorActorsAggregationSelection {
              count: Int!
              edge: SeriesActorActorsEdgeAggregateSelection
              node: SeriesActorActorsNodeAggregateSelection
            }

            type SeriesActorActorsEdgeAggregateSelection {
              role: StringAggregateSelectionNonNullable!
            }

            type SeriesActorActorsNodeAggregateSelection {
              name: StringAggregateSelectionNonNullable!
            }

            input SeriesActorsAggregateInput {
              AND: [SeriesActorsAggregateInput!]
              OR: [SeriesActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: SeriesActorsEdgeAggregationWhereInput
              node: SeriesActorsNodeAggregationWhereInput
            }

            input SeriesActorsEdgeAggregationWhereInput {
              AND: [SeriesActorsEdgeAggregationWhereInput!]
              OR: [SeriesActorsEdgeAggregationWhereInput!]
              role_AVERAGE_EQUAL: Float
              role_AVERAGE_GT: Float
              role_AVERAGE_GTE: Float
              role_AVERAGE_LT: Float
              role_AVERAGE_LTE: Float
              role_EQUAL: String
              role_GT: Int
              role_GTE: Int
              role_LONGEST_EQUAL: Int
              role_LONGEST_GT: Int
              role_LONGEST_GTE: Int
              role_LONGEST_LT: Int
              role_LONGEST_LTE: Int
              role_LT: Int
              role_LTE: Int
              role_SHORTEST_EQUAL: Int
              role_SHORTEST_GT: Int
              role_SHORTEST_GTE: Int
              role_SHORTEST_LT: Int
              role_SHORTEST_LTE: Int
            }

            input SeriesActorsNodeAggregationWhereInput {
              AND: [SeriesActorsNodeAggregationWhereInput!]
              OR: [SeriesActorsNodeAggregationWhereInput!]
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

            type SeriesAggregateSelection {
              count: Int!
              episodes: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input SeriesConnectInput {
              actors: [ProductionActorsConnectFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actors: ProductionActorsFieldInput @deprecated(reason: \\"Do not use\\")
              episodes: Int!
              title: String!
            }

            input SeriesDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            input SeriesDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!] @deprecated(reason: \\"Do not use\\")
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
              actors: [ProductionActorsCreateFieldInput!] @deprecated(reason: \\"Do not use\\")
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episodes: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!] @deprecated(reason: \\"Do not use\\")
              episodes: Int
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              OR: [SeriesWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: SeriesActorsAggregateInput @deprecated(reason: \\"Do not use\\")
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Do not use\\")
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Do not use\\")
              \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Do not use\\")
              episodes: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int!]
              episodes_LT: Int
              episodes_LTE: Int
              episodes_NOT: Int
              episodes_NOT_IN: [Int!]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String!]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNonNullable {
              longest: String!
              shortest: String!
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });

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
              title: StringAggregateSelectionNullable!
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
              content: StringAggregateSelectionNullable!
            }

            input BlogPostsAggregateInput {
              AND: [BlogPostsAggregateInput!]
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
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
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
              OR: [BlogPostsConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere
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
              OR: [BlogPostsNodeAggregationWhereInput!]
              content_AVERAGE_EQUAL: Float
              content_AVERAGE_GT: Float
              content_AVERAGE_GTE: Float
              content_AVERAGE_LT: Float
              content_AVERAGE_LTE: Float
              content_EQUAL: String
              content_GT: Int
              content_GTE: Int
              content_LONGEST_EQUAL: Int
              content_LONGEST_GT: Int
              content_LONGEST_GTE: Int
              content_LONGEST_LT: Int
              content_LONGEST_LTE: Int
              content_LT: Int
              content_LTE: Int
              content_SHORTEST_EQUAL: Int
              content_SHORTEST_GT: Int
              content_SHORTEST_GTE: Int
              content_SHORTEST_LT: Int
              content_SHORTEST_LTE: Int
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
              OR: [BlogWhere!]
              posts: PostWhere @deprecated(reason: \\"Use \`posts_SOME\` instead.\\")
              postsAggregate: BlogPostsAggregateInput
              postsConnection: BlogPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_SOME\` instead.\\")
              postsConnection_ALL: BlogPostsConnectionWhere
              postsConnection_NONE: BlogPostsConnectionWhere
              postsConnection_NOT: BlogPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_NONE\` instead.\\")
              postsConnection_SINGLE: BlogPostsConnectionWhere
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
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
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

            type CreateInfo {
              bookmark: String
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

            type DeleteInfo {
              bookmark: String
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
              content: StringAggregateSelectionNullable!
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
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
            }

            input QueryOptions {
              limit: Int
              offset: Int
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

            type UpdateBlogsMutationResponse {
              blogs: [Blog!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String
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
              name: StringAggregateSelectionNullable!
            }

            input UserConnectInput {
              content: UserContentConnectInput
            }

            input UserContentBlogConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
              connect: [BlogConnectInput!]
              where: BlogConnectWhere
            }

            input UserContentBlogConnectionWhere {
              AND: [UserContentBlogConnectionWhere!]
              OR: [UserContentBlogConnectionWhere!]
              node: BlogWhere
              node_NOT: BlogWhere
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
              Blog: [UserContentBlogConnectFieldInput!]
              Post: [UserContentPostConnectFieldInput!]
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
              Blog: [UserContentBlogCreateFieldInput!]
              Post: [UserContentPostCreateFieldInput!]
            }

            input UserContentCreateInput {
              Blog: UserContentBlogFieldInput
              Post: UserContentPostFieldInput
            }

            input UserContentDeleteInput {
              Blog: [UserContentBlogDeleteFieldInput!]
              Post: [UserContentPostDeleteFieldInput!]
            }

            input UserContentDisconnectInput {
              Blog: [UserContentBlogDisconnectFieldInput!]
              Post: [UserContentPostDisconnectFieldInput!]
            }

            input UserContentPostConnectFieldInput {
              \\"\\"\\"
              Whether or not to create a duplicate of relationship if it already exists, instead of just updating any properties.
              \\"\\"\\"
              asDuplicate: Boolean
              where: PostConnectWhere
            }

            input UserContentPostConnectionWhere {
              AND: [UserContentPostConnectionWhere!]
              OR: [UserContentPostConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere
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
              Blog: [UserContentBlogUpdateFieldInput!]
              Post: [UserContentPostUpdateFieldInput!]
            }

            input UserCreateInput {
              content: UserContentCreateInput
              name: String
            }

            input UserDeleteInput {
              content: UserContentDeleteInput
            }

            input UserDisconnectInput {
              content: UserContentDisconnectInput
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
              content: UserContentCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
            }

            input UserUpdateInput {
              content: UserContentUpdateInput
              name: String
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
              contentConnection: UserContentConnectionWhere @deprecated(reason: \\"Use \`contentConnection_SOME\` instead.\\")
              contentConnection_ALL: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
              contentConnection_NONE: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
              contentConnection_NOT: UserContentConnectionWhere @deprecated(reason: \\"Use \`contentConnection_NONE\` instead.\\")
              contentConnection_SINGLE: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
              contentConnection_SOME: UserContentConnectionWhere @deprecated(reason: \\"Do not use user.content\\")
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

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
