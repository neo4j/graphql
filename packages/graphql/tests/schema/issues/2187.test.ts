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

describe("https://github.com/neo4j/graphql/issues/2187", () => {
    test("Deprecated directive should be present on genres in generated schema", async () => {
        const typeDefs = gql`
            type Movie @node {
                title: String @deprecated(reason: "Do not use title")
                year: Int
                imdbRating: Float
                genres: [Genre!]!
                    @relationship(type: "IN_GENRE", direction: OUT)
                    @deprecated(reason: "Do not use genre")
            }

            type Genre @node {
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

            type CreateGenresMutationResponse {
              genres: [Genre!]!
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

            type Genre {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [GenreMoviesConnectionSort!], where: GenreMoviesConnectionWhere): GenreMoviesConnection!
              name: String
            }

            type GenreAggregate {
              count: Count!
              node: GenreAggregateNode!
            }

            type GenreAggregateNode {
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

            type GenreMovieMoviesAggregateSelection {
              count: CountConnection!
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: GenreMoviesNodeAggregationWhereInput
            }

            input GenreMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type GenreMoviesConnection {
              aggregate: GenreMovieMoviesAggregateSelection!
              edges: [GenreMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreMoviesConnectionAggregateInput {
              AND: [GenreMoviesConnectionAggregateInput!]
              NOT: GenreMoviesConnectionAggregateInput
              OR: [GenreMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: GenreMoviesNodeAggregationWhereInput
            }

            input GenreMoviesConnectionFilters {
              \\"\\"\\"Filter Genres by aggregating results on related GenreMoviesConnections\\"\\"\\"
              aggregate: GenreMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Genres where all of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              all: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              none: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              single: GenreMoviesConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              some: GenreMoviesConnectionWhere
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
              imdbRating: FloatScalarAggregationFilters
              imdbRating_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { average: { eq: ... } } }' instead.\\")
              imdbRating_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { average: { gt: ... } } }' instead.\\")
              imdbRating_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { average: { gte: ... } } }' instead.\\")
              imdbRating_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { average: { lt: ... } } }' instead.\\")
              imdbRating_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { average: { lte: ... } } }' instead.\\")
              imdbRating_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { max: { eq: ... } } }' instead.\\")
              imdbRating_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { max: { gt: ... } } }' instead.\\")
              imdbRating_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { max: { gte: ... } } }' instead.\\")
              imdbRating_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { max: { lt: ... } } }' instead.\\")
              imdbRating_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { max: { lte: ... } } }' instead.\\")
              imdbRating_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { min: { eq: ... } } }' instead.\\")
              imdbRating_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { min: { gt: ... } } }' instead.\\")
              imdbRating_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { min: { gte: ... } } }' instead.\\")
              imdbRating_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { min: { lt: ... } } }' instead.\\")
              imdbRating_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { min: { lte: ... } } }' instead.\\")
              imdbRating_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { sum: { eq: ... } } }' instead.\\")
              imdbRating_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { sum: { gt: ... } } }' instead.\\")
              imdbRating_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { sum: { gte: ... } } }' instead.\\")
              imdbRating_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { sum: { lt: ... } } }' instead.\\")
              imdbRating_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbRating: { sum: { lte: ... } } }' instead.\\")
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
              year: IntScalarAggregationFilters
              year_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { eq: ... } } }' instead.\\")
              year_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { gt: ... } } }' instead.\\")
              year_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { gte: ... } } }' instead.\\")
              year_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { lt: ... } } }' instead.\\")
              year_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'year: { average: { lte: ... } } }' instead.\\")
              year_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { eq: ... } } }' instead.\\")
              year_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { gt: ... } } }' instead.\\")
              year_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { gte: ... } } }' instead.\\")
              year_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { lt: ... } } }' instead.\\")
              year_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { max: { lte: ... } } }' instead.\\")
              year_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { eq: ... } } }' instead.\\")
              year_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { gt: ... } } }' instead.\\")
              year_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { gte: ... } } }' instead.\\")
              year_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { lt: ... } } }' instead.\\")
              year_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { min: { lte: ... } } }' instead.\\")
              year_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { eq: ... } } }' instead.\\")
              year_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { gt: ... } } }' instead.\\")
              year_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { gte: ... } } }' instead.\\")
              year_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { lt: ... } } }' instead.\\")
              year_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'year: { sum: { lte: ... } } }' instead.\\")
            }

            type GenreMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input GenreMoviesUpdateConnectionInput {
              node: MovieUpdateInput
              where: GenreMoviesConnectionWhere
            }

            input GenreMoviesUpdateFieldInput {
              connect: [GenreMoviesConnectFieldInput!]
              create: [GenreMoviesCreateFieldInput!]
              delete: [GenreMoviesDeleteFieldInput!]
              disconnect: [GenreMoviesDisconnectFieldInput!]
              update: GenreMoviesUpdateConnectionInput
            }

            input GenreRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Genres match this filter\\"\\"\\"
              all: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Filter type where none of the related Genres match this filter\\"\\"\\"
              none: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Filter type where one of the related Genres match this filter\\"\\"\\"
              single: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Filter type where some of the related Genres match this filter\\"\\"\\"
              some: GenreWhere @deprecated(reason: \\"Do not use genre\\")
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreUpdateInput {
              movies: [GenreMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              movies: MovieRelationshipFilters
              moviesAggregate: GenreMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: GenreMoviesConnectionFilters
              \\"\\"\\"
              Return Genres where all of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: GenreMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Genres where none of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: GenreMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Genres where one of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: GenreMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Genres where some of the related GenreMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: GenreMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Genres where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Genres where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Genres where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Genres where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type GenresConnection {
              aggregate: GenreAggregate!
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
              genres(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]! @deprecated(reason: \\"Do not use genre\\")
              genresConnection(after: String, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection! @deprecated(reason: \\"Do not use genre\\")
              imdbRating: Float
              title: String @deprecated(reason: \\"Do not use title\\")
              year: Int
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              imdbRating: FloatAggregateSelection!
              title: StringAggregateSelection!
              year: IntAggregateSelection!
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

            type MovieGenreGenresAggregateSelection {
              count: CountConnection!
              node: MovieGenreGenresNodeAggregateSelection
            }

            type MovieGenreGenresNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieGenresAggregateInput {
              AND: [MovieGenresAggregateInput!]
              NOT: MovieGenresAggregateInput
              OR: [MovieGenresAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: MovieGenresNodeAggregationWhereInput
            }

            input MovieGenresConnectFieldInput {
              connect: [GenreConnectInput!]
              where: GenreConnectWhere
            }

            type MovieGenresConnection {
              aggregate: MovieGenreGenresAggregateSelection!
              edges: [MovieGenresRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenresConnectionAggregateInput {
              AND: [MovieGenresConnectionAggregateInput!]
              NOT: MovieGenresConnectionAggregateInput
              OR: [MovieGenresConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: MovieGenresNodeAggregationWhereInput
            }

            input MovieGenresConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related MovieGenresConnections\\"\\"\\"
              aggregate: MovieGenresConnectionAggregateInput @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"
              Return Movies where all of the related MovieGenresConnections match this filter
              \\"\\"\\"
              all: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"
              Return Movies where none of the related MovieGenresConnections match this filter
              \\"\\"\\"
              none: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"
              Return Movies where one of the related MovieGenresConnections match this filter
              \\"\\"\\"
              single: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"
              Return Movies where some of the related MovieGenresConnections match this filter
              \\"\\"\\"
              some: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
            }

            input MovieGenresConnectionSort {
              node: GenreSort
            }

            input MovieGenresConnectionWhere {
              AND: [MovieGenresConnectionWhere!]
              NOT: MovieGenresConnectionWhere
              OR: [MovieGenresConnectionWhere!]
              node: GenreWhere
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

            type MovieGenresRelationship {
              cursor: String!
              node: Genre!
            }

            input MovieGenresUpdateConnectionInput {
              node: GenreUpdateInput
              where: MovieGenresConnectionWhere
            }

            input MovieGenresUpdateFieldInput {
              connect: [MovieGenresConnectFieldInput!]
              create: [MovieGenresCreateFieldInput!]
              delete: [MovieGenresDeleteFieldInput!]
              disconnect: [MovieGenresDisconnectFieldInput!]
              update: MovieGenresUpdateConnectionInput
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
              imdbRating: SortDirection
              title: SortDirection
              year: SortDirection
            }

            input MovieUpdateInput {
              genres: [MovieGenresUpdateFieldInput!] @deprecated(reason: \\"Do not use genre\\")
              imdbRating: FloatScalarMutations
              imdbRating_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { add: ... } }' instead.\\")
              imdbRating_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { divide: ... } }' instead.\\")
              imdbRating_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { multiply: ... } }' instead.\\")
              imdbRating_SET: Float @deprecated(reason: \\"Please use the generic mutation 'imdbRating: { set: ... } }' instead.\\")
              imdbRating_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'imdbRating: { subtract: ... } }' instead.\\")
              title: StringScalarMutations @deprecated(reason: \\"Do not use title\\")
              title_SET: String @deprecated(reason: \\"Do not use title\\")
              year: IntScalarMutations
              year_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { decrement: ... } }' instead.\\")
              year_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { increment: ... } }' instead.\\")
              year_SET: Int @deprecated(reason: \\"Please use the generic mutation 'year: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genres: GenreRelationshipFilters
              genresAggregate: MovieGenresAggregateInput @deprecated(reason: \\"Do not use genre\\")
              genresConnection: MovieGenresConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_ALL: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"
              Return Movies where none of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_NONE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"
              Return Movies where one of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_SINGLE: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"
              Return Movies where some of the related MovieGenresConnections match this filter
              \\"\\"\\"
              genresConnection_SOME: MovieGenresConnectionWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
              genres_ALL: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
              genres_NONE: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
              genres_SINGLE: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
              genres_SOME: GenreWhere @deprecated(reason: \\"Do not use genre\\")
              imdbRating: FloatScalarFilters
              imdbRating_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { eq: ... }\\")
              imdbRating_GT: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { gt: ... }\\")
              imdbRating_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { gte: ... }\\")
              imdbRating_IN: [Float] @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { in: ... }\\")
              imdbRating_LT: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { lt: ... }\\")
              imdbRating_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter imdbRating: { lte: ... }\\")
              title: StringScalarFilters @deprecated(reason: \\"Do not use title\\")
              title_CONTAINS: String @deprecated(reason: \\"Do not use title\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Do not use title\\")
              title_EQ: String @deprecated(reason: \\"Do not use title\\")
              title_IN: [String] @deprecated(reason: \\"Do not use title\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Do not use title\\")
              year: IntScalarFilters
              year_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter year: { eq: ... }\\")
              year_GT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gt: ... }\\")
              year_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gte: ... }\\")
              year_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter year: { in: ... }\\")
              year_LT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lt: ... }\\")
              year_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lte: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
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
              genres(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
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

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
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
});
