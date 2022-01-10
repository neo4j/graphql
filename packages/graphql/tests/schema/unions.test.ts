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

describe("Unions", () => {
    test("Unions", () => {
        const typeDefs = gql`
            union Search = Movie | Genre

            type Genre {
                id: ID
            }

            type Movie {
                id: ID
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                searchNoDirective: Search
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

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

            type Genre {
              id: ID
            }

            type GenreAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              id: ID
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [GenreSort]
            }

            \\"\\"\\"Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.\\"\\"\\"
            input GenreSort {
              id: SortDirection
            }

            input GenreUpdateInput {
              id: ID
            }

            input GenreWhere {
              AND: [GenreWhere!]
              OR: [GenreWhere!]
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

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type Movie {
              id: ID
              search(options: QueryOptions, where: SearchWhere): [Search!]!
              searchConnection(where: MovieSearchConnectionWhere): MovieSearchConnection!
              searchNoDirective: Search
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input MovieConnectInput {
              search: MovieSearchConnectInput
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              id: ID
              search: MovieSearchCreateInput
            }

            input MovieDeleteInput {
              search: MovieSearchDeleteInput
            }

            input MovieDisconnectInput {
              search: MovieSearchDisconnectInput
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            input MovieRelationInput {
              search: MovieSearchCreateFieldInput
            }

            input MovieSearchConnectInput {
              Genre: [MovieSearchGenreConnectFieldInput!]
              Movie: [MovieSearchMovieConnectFieldInput!]
            }

            type MovieSearchConnection {
              edges: [MovieSearchRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieSearchConnectionGenreWhere {
              AND: [MovieSearchConnectionGenreWhere]
              OR: [MovieSearchConnectionGenreWhere]
              node: GenreWhere
              node_NOT: GenreWhere
            }

            input MovieSearchConnectionMovieWhere {
              AND: [MovieSearchConnectionMovieWhere]
              OR: [MovieSearchConnectionMovieWhere]
              node: MovieWhere
              node_NOT: MovieWhere
            }

            input MovieSearchConnectionWhere {
              Genre: MovieSearchConnectionGenreWhere
              Movie: MovieSearchConnectionMovieWhere
            }

            input MovieSearchCreateFieldInput {
              Genre: [MovieSearchGenreCreateFieldInput!]
              Movie: [MovieSearchMovieCreateFieldInput!]
            }

            input MovieSearchCreateInput {
              Genre: MovieSearchGenreFieldInput
              Movie: MovieSearchMovieFieldInput
            }

            input MovieSearchDeleteInput {
              Genre: [MovieSearchGenreDeleteFieldInput!]
              Movie: [MovieSearchMovieDeleteFieldInput!]
            }

            input MovieSearchDisconnectInput {
              Genre: [MovieSearchGenreDisconnectFieldInput!]
              Movie: [MovieSearchMovieDisconnectFieldInput!]
            }

            input MovieSearchGenreConnectFieldInput {
              where: GenreConnectWhere
            }

            input MovieSearchGenreConnectionWhere {
              AND: [MovieSearchGenreConnectionWhere!]
              OR: [MovieSearchGenreConnectionWhere!]
              node: GenreWhere
              node_NOT: GenreWhere
            }

            input MovieSearchGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input MovieSearchGenreDeleteFieldInput {
              where: MovieSearchGenreConnectionWhere
            }

            input MovieSearchGenreDisconnectFieldInput {
              where: MovieSearchGenreConnectionWhere
            }

            input MovieSearchGenreFieldInput {
              connect: [MovieSearchGenreConnectFieldInput!]
              create: [MovieSearchGenreCreateFieldInput!]
            }

            input MovieSearchGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input MovieSearchGenreUpdateFieldInput {
              connect: [MovieSearchGenreConnectFieldInput!]
              create: [MovieSearchGenreCreateFieldInput!]
              delete: [MovieSearchGenreDeleteFieldInput!]
              disconnect: [MovieSearchGenreDisconnectFieldInput!]
              update: MovieSearchGenreUpdateConnectionInput
              where: MovieSearchGenreConnectionWhere
            }

            input MovieSearchMovieConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            input MovieSearchMovieConnectionWhere {
              AND: [MovieSearchMovieConnectionWhere!]
              OR: [MovieSearchMovieConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere
            }

            input MovieSearchMovieCreateFieldInput {
              node: MovieCreateInput!
            }

            input MovieSearchMovieDeleteFieldInput {
              delete: MovieDeleteInput
              where: MovieSearchMovieConnectionWhere
            }

            input MovieSearchMovieDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: MovieSearchMovieConnectionWhere
            }

            input MovieSearchMovieFieldInput {
              connect: [MovieSearchMovieConnectFieldInput!]
              create: [MovieSearchMovieCreateFieldInput!]
            }

            input MovieSearchMovieUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input MovieSearchMovieUpdateFieldInput {
              connect: [MovieSearchMovieConnectFieldInput!]
              create: [MovieSearchMovieCreateFieldInput!]
              delete: [MovieSearchMovieDeleteFieldInput!]
              disconnect: [MovieSearchMovieDisconnectFieldInput!]
              update: MovieSearchMovieUpdateConnectionInput
              where: MovieSearchMovieConnectionWhere
            }

            type MovieSearchRelationship {
              cursor: String!
              node: Search!
            }

            input MovieSearchUpdateInput {
              Genre: [MovieSearchGenreUpdateFieldInput!]
              Movie: [MovieSearchMovieUpdateFieldInput!]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              search: MovieSearchUpdateInput
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
              searchConnection: MovieSearchConnectionWhere
              searchConnection_NOT: MovieSearchConnectionWhere
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteGenres(where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
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
              genresCount(where: GenreWhere): Int!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesCount(where: MovieWhere): Int!
            }

            input QueryOptions {
              limit: Int
              offset: Int
            }

            union Search = Genre | Movie

            input SearchWhere {
              Genre: GenreWhere
              Movie: MovieWhere
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
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
            }
            "
        `);
    });
});
