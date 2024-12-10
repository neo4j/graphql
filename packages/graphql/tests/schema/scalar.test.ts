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

describe("Scalar", () => {
    test("Scalars", async () => {
        const typeDefs = gql`
            scalar CustomScalar

            type Movie @node {
                id: ID
                myCustomArrayScalar: [CustomScalar!]
                myCustomScalar: CustomScalar
                myRequiredCustomArrayScalar: [CustomScalar!]!
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

            scalar CustomScalar

            \\"\\"\\"Mutations for a list for CustomScalar\\"\\"\\"
            input CustomScalarListScalarMutations {
              pop: CustomScalar
              push: [CustomScalar!]!
              set: [CustomScalar!]!
            }

            \\"\\"\\"CustomScalar filters\\"\\"\\"
            input CustomScalarScalarFilters {
              equals: CustomScalar
              in: [CustomScalar!]
            }

            \\"\\"\\"CustomScalar filters\\"\\"\\"
            input CustomScalarScalarMutations {
              set: CustomScalar
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type Movie {
              id: ID
              myCustomArrayScalar: [CustomScalar!]
              myCustomScalar: CustomScalar
              myRequiredCustomArrayScalar: [CustomScalar!]!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieCreateInput {
              id: ID
              myCustomArrayScalar: [CustomScalar!]
              myCustomScalar: CustomScalar
              myRequiredCustomArrayScalar: [CustomScalar!]!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              myCustomScalar: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              myCustomArrayScalar: CustomScalarListScalarMutations
              myCustomArrayScalar_SET: [CustomScalar!] @deprecated(reason: \\"Please use the generic mutation 'myCustomArrayScalar: { set: ... } }' instead.\\")
              myCustomScalar: CustomScalarScalarMutations
              myCustomScalar_SET: CustomScalar @deprecated(reason: \\"Please use the generic mutation 'myCustomScalar: { set: ... } }' instead.\\")
              myRequiredCustomArrayScalar: CustomScalarListScalarMutations
              myRequiredCustomArrayScalar_SET: [CustomScalar!] @deprecated(reason: \\"Please use the generic mutation 'myRequiredCustomArrayScalar: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_STARTS_WITH: ID
              myCustomArrayScalar: CustomScalarScalarFilters
              myCustomArrayScalar_EQ: [CustomScalar!]
              myCustomArrayScalar_INCLUDES: CustomScalar
              myCustomScalar: CustomScalarScalarFilters
              myCustomScalar_EQ: CustomScalar
              myCustomScalar_IN: [CustomScalar]
              myRequiredCustomArrayScalar: CustomScalarScalarFilters
              myRequiredCustomArrayScalar_EQ: [CustomScalar!]
              myRequiredCustomArrayScalar_INCLUDES: CustomScalar
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
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
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
