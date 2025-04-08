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

describe("Unions", () => {
    test("Unions", async () => {
        const typeDefs = gql`
            union Search = Movie | Genre

            type Genre @node {
                id: ID
            }

            type Movie @node {
                id: ID
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
                searchNoDirective: Search
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

            type Genre {
              id: ID
            }

            type GenreAggregate {
              count: Count!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              id: ID
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              id: SortDirection
            }

            input GenreUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
            }

            type GenresConnection {
              aggregate: GenreAggregate!
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              search(limit: Int, offset: Int, where: SearchWhere): [Search!]!
              searchConnection(after: String, first: Int, where: MovieSearchConnectionWhere): MovieSearchConnection!
              searchNoDirective: Search
            }

            type MovieAggregate {
              count: Count!
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

            type MovieEdge {
              cursor: String!
              node: Movie!
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

            input MovieSearchConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related MovieSearchConnections match this filter
              \\"\\"\\"
              all: MovieSearchConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieSearchConnections match this filter
              \\"\\"\\"
              none: MovieSearchConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieSearchConnections match this filter
              \\"\\"\\"
              single: MovieSearchConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieSearchConnections match this filter
              \\"\\"\\"
              some: MovieSearchConnectionWhere
            }

            input MovieSearchConnectionWhere {
              Genre: MovieSearchGenreConnectionWhere
              Movie: MovieSearchMovieConnectionWhere
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
              NOT: MovieSearchGenreConnectionWhere
              OR: [MovieSearchGenreConnectionWhere!]
              node: GenreWhere
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
              where: MovieSearchGenreConnectionWhere
            }

            input MovieSearchGenreUpdateFieldInput {
              connect: [MovieSearchGenreConnectFieldInput!]
              create: [MovieSearchGenreCreateFieldInput!]
              delete: [MovieSearchGenreDeleteFieldInput!]
              disconnect: [MovieSearchGenreDisconnectFieldInput!]
              update: MovieSearchGenreUpdateConnectionInput
            }

            input MovieSearchMovieConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            input MovieSearchMovieConnectionWhere {
              AND: [MovieSearchMovieConnectionWhere!]
              NOT: MovieSearchMovieConnectionWhere
              OR: [MovieSearchMovieConnectionWhere!]
              node: MovieWhere
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
              where: MovieSearchMovieConnectionWhere
            }

            input MovieSearchMovieUpdateFieldInput {
              connect: [MovieSearchMovieConnectFieldInput!]
              create: [MovieSearchMovieCreateFieldInput!]
              delete: [MovieSearchMovieDeleteFieldInput!]
              disconnect: [MovieSearchMovieDisconnectFieldInput!]
              update: MovieSearchMovieUpdateConnectionInput
            }

            type MovieSearchRelationship {
              cursor: String!
              node: Search!
            }

            input MovieSearchUpdateInput {
              Genre: [MovieSearchGenreUpdateFieldInput!]
              Movie: [MovieSearchMovieUpdateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              search: MovieSearchUpdateInput
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
              search: SearchRelationshipFilters
              searchConnection: MovieSearchConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieSearchConnections match this filter
              \\"\\"\\"
              searchConnection_ALL: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieSearchConnections match this filter
              \\"\\"\\"
              searchConnection_NONE: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieSearchConnections match this filter
              \\"\\"\\"
              searchConnection_SINGLE: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieSearchConnections match this filter
              \\"\\"\\"
              searchConnection_SOME: MovieSearchConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'searchConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Searches match this filter\\"\\"\\"
              search_ALL: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Searches match this filter\\"\\"\\"
              search_NONE: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Searches match this filter\\"\\"\\"
              search_SINGLE: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Searches match this filter\\"\\"\\"
              search_SOME: SearchWhere @deprecated(reason: \\"Please use the relevant generic filter 'search: {  some: ... }' instead.\\")
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
              deleteGenres(where: GenreWhere): DeleteInfo!
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
              searches(limit: Int, offset: Int, where: SearchWhere): [Search!]!
            }

            union Search = Genre | Movie

            input SearchRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Searches match this filter\\"\\"\\"
              all: SearchWhere
              \\"\\"\\"Filter type where none of the related Searches match this filter\\"\\"\\"
              none: SearchWhere
              \\"\\"\\"Filter type where one of the related Searches match this filter\\"\\"\\"
              single: SearchWhere
              \\"\\"\\"Filter type where some of the related Searches match this filter\\"\\"\\"
              some: SearchWhere
            }

            input SearchWhere {
              Genre: GenreWhere
              Movie: MovieWhere
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
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
