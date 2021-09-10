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
import { Neo4jGraphQL } from "../../src";

describe("Interfaces", () => {
    test("Interfaces", () => {
        const typeDefs = `
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

type Movie implements MovieNode
    @auth(rules: [{ allow: "*", operations: [READ] }]) {
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
}`;
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

            type Movie implements MovieNode {
              customQuery: [Movie]
              id: ID
              movies(options: MovieOptions, where: MovieWhere): [Movie]
              moviesConnection(after: String, first: Int, sort: [MovieMoviesConnectionSort!], where: MovieMoviesConnectionWhere): MovieMoviesConnection!
              nodes: [MovieNode]
            }

            input MovieConnectInput {
              movies: [MovieMoviesConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              id: ID
              movies: MovieMoviesFieldInput
            }

            input MovieDeleteInput {
              movies: [MovieMoviesDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              movies: [MovieMoviesDisconnectFieldInput!]
            }

            input MovieMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type MovieMoviesConnection {
              edges: [MovieMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieMoviesConnectionSort {
              node: MovieSort
            }

            input MovieMoviesConnectionWhere {
              AND: [MovieMoviesConnectionWhere!]
              OR: [MovieMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere
            }

            input MovieMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input MovieMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: MovieMoviesConnectionWhere
            }

            input MovieMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: MovieMoviesConnectionWhere
            }

            input MovieMoviesFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
            }

            type MovieMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input MovieMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input MovieMoviesUpdateFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
              delete: [MovieMoviesDeleteFieldInput!]
              disconnect: [MovieMoviesDisconnectFieldInput!]
              update: MovieMoviesUpdateConnectionInput
              where: MovieMoviesConnectionWhere
            }

            interface MovieNode {
              customQuery: [Movie]
              id: ID
              movies: [Movie]
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            input MovieRelationInput {
              movies: [MovieMoviesCreateFieldInput!]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              movies: [MovieMoviesUpdateFieldInput!]
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
              moviesConnection: MovieMoviesConnectionWhere
              moviesConnection_NOT: MovieMoviesConnectionWhere
              movies_NOT: MovieWhere
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
              moviesCount(where: MovieWhere): Int!
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
