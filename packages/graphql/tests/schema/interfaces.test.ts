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

describe("Interfaces", () => {
    test("Interfaces", () => {
        const typeDefs = gql`
            interface MovieNode @auth(rules: [{ allow: "*", operations: [READ] }]) {
                id: ID
                movies: [Movie] @relationship(type: "HAS_MOVIE", direction: OUT)
                customQuery: [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                    )
            }

            type Movie implements MovieNode @auth(rules: [{ allow: "*", operations: [READ] }]) {
                id: ID
                nodes: [MovieNode]
                movies: [Movie] @relationship(type: "HAS_MOVIE", direction: OUT)
                customQuery: [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                    )
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
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

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type Movie implements MovieNode {
              customQuery: [Movie]
              id: ID
              movies(options: MovieOptions, where: MovieWhere): [Movie]
              moviesAggregate(where: MovieWhere): MovieMovieMoviesAggregationSelection
              moviesConnection(after: String, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
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

            type MovieMovieMoviesAggregationSelection {
              count: Int!
              node: MovieMovieMoviesNodeAggregateSelection
            }

            type MovieMovieMoviesNodeAggregateSelection {
              id: IDAggregateSelectionNullable!
            }

            input MovieMoviesAggregateInput {
              AND: [MovieMoviesAggregateInput!]
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
              OR: [MovieMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID
            }

            interface MovieNode {
              customQuery: [Movie]
              id: ID
              movies: [Movie]
              moviesConnection: MovieNodeMoviesConnection!
            }

            input MovieNodeMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
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
              OR: [MovieNodeMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere
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
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            input MovieRelationInput {
              movies: [MovieNodeMoviesCreateFieldInput!]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              movies: [MovieNodeMoviesUpdateFieldInput!]
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
              movies: MovieWhere
              moviesAggregate: MovieMoviesAggregateInput
              moviesConnection: MovieNodeMoviesConnectionWhere
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere
              moviesConnection_NOT: MovieNodeMoviesConnectionWhere
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere
              \\"\\"\\"Return Movies where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Movies where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere
              \\"\\"\\"Return Movies where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Movies where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
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
            }
            "
        `);
    });
});
