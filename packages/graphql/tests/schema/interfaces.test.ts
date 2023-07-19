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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../src";

describe("Interfaces", () => {
    test("Interfaces", async () => {
        const typeDefs = gql`
            interface MovieNode {
                id: ID
                movies: [Movie!]! @relationship(type: "HAS_MOVIE", direction: OUT)
                customQuery: [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                        columnName: "m"
                    )
            }

            type Movie implements MovieNode {
                id: ID
                nodes: [MovieNode]
                movies: [Movie!]! @relationship(type: "HAS_MOVIE", direction: OUT)
                customQuery: [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                        columnName: "m"
                    )
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type Movie implements MovieNode {
              customQuery: [Movie]
              id: ID
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): MovieMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
              nodes: [MovieNode]
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input MovieConnectInput {
              movies: [MovieNodeMoviesConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              id: ID
              movies: MovieNodeMoviesFieldInput
            }

            input MovieDeleteInput {
              movies: [MovieNodeMoviesDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              movies: [MovieNodeMoviesDisconnectFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieMovieMoviesAggregationSelection {
              count: Int!
              node: MovieMovieMoviesNodeAggregateSelection
            }

            type MovieMovieMoviesNodeAggregateSelection {
              id: IDAggregateSelectionNullable!
            }

            input MovieMoviesAggregateInput {
              AND: [MovieMoviesAggregateInput!]
              NOT: MovieMoviesAggregateInput
              OR: [MovieMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieMoviesNodeAggregationWhereInput
            }

            input MovieMoviesNodeAggregationWhereInput {
              AND: [MovieMoviesNodeAggregationWhereInput!]
              NOT: MovieMoviesNodeAggregationWhereInput
              OR: [MovieMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            interface MovieNode {
              customQuery: [Movie]
              id: ID
              movies: [Movie!]!
              moviesConnection: MovieNodeMoviesConnection!
            }

            input MovieNodeMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type MovieNodeMoviesConnection {
              edges: [MovieNodeMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieNodeMoviesConnectionSort {
              node: MovieSort
            }

            input MovieNodeMoviesConnectionWhere {
              AND: [MovieNodeMoviesConnectionWhere!]
              NOT: MovieNodeMoviesConnectionWhere
              OR: [MovieNodeMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieNodeMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input MovieNodeMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesFieldInput {
              connect: [MovieNodeMoviesConnectFieldInput!]
              create: [MovieNodeMoviesCreateFieldInput!]
            }

            type MovieNodeMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input MovieNodeMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input MovieNodeMoviesUpdateFieldInput {
              connect: [MovieNodeMoviesConnectFieldInput!]
              create: [MovieNodeMoviesCreateFieldInput!]
              delete: [MovieNodeMoviesDeleteFieldInput!]
              disconnect: [MovieNodeMoviesDisconnectFieldInput!]
              update: MovieNodeMoviesUpdateConnectionInput
              where: MovieNodeMoviesConnectionWhere
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
              movies: [MovieNodeMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              movies: [MovieNodeMoviesUpdateFieldInput!]
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
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: MovieMoviesAggregateInput
              moviesConnection: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere
              moviesConnection_NOT: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere
              \\"\\"\\"Return Movies where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Movies where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Movies where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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
