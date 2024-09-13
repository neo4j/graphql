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

describe("@fulltext schema", () => {
    test("fulltext", async () => {
        const typeDefs = gql`
            type Movie
                @node
                @fulltext(
                    indexes: [
                        { name: "MovieTitle", fields: ["title"] }
                        { name: "MovieDescription", fields: ["description"] }
                    ]
                ) {
                title: String
                description: String
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

            \\"\\"\\"The input for filtering a float\\"\\"\\"
            input FloatWhere {
              max: Float
              min: Float
            }

            type Movie {
              description: String
              title: String
            }

            type MovieAggregateSelection {
              count: Int!
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              description: String
              title: String
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieFulltext {
              MovieDescription: MovieMovieDescriptionFulltext
              MovieTitle: MovieMovieTitleFulltext
            }

            \\"\\"\\"The result of a fulltext search on an index of Movie\\"\\"\\"
            type MovieFulltextResult {
              movie: Movie!
              score: Float!
            }

            \\"\\"\\"The input for sorting a fulltext query on an index of Movie\\"\\"\\"
            input MovieFulltextSort {
              movie: MovieSort
              score: SortDirection
            }

            \\"\\"\\"The input for filtering a fulltext query on an index of Movie\\"\\"\\"
            input MovieFulltextWhere {
              movie: MovieWhere
              score: FloatWhere
            }

            input MovieMovieDescriptionFulltext {
              phrase: String!
            }

            input MovieMovieTitleFulltext {
              phrase: String!
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
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              description: String
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: String
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_IN: [String]
              description_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              description_STARTS_WITH: String
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
              movies(
                \\"\\"\\"
                Query a full-text index. Allows for the aggregation of results, but does not return the query score. Use the root full-text query fields if you require the score.
                \\"\\"\\"
                fulltext: MovieFulltext
                options: MovieOptions
                where: MovieWhere
              ): [Movie!]!
              moviesAggregate(
                \\"\\"\\"
                Query a full-text index. Allows for the aggregation of results, but does not return the query score. Use the root full-text query fields if you require the score.
                \\"\\"\\"
                fulltext: MovieFulltext
                where: MovieWhere
              ): MovieAggregateSelection!
              moviesConnection(
                after: String
                first: Int
                \\"\\"\\"
                Query a full-text index. Allows for the aggregation of results, but does not return the query score. Use the root full-text query fields if you require the score.
                \\"\\"\\"
                fulltext: MovieFulltext
                sort: [MovieSort]
                where: MovieWhere
              ): MoviesConnection!
              \\"\\"\\"
              Query a full-text index. This query returns the query score, but does not allow for aggregations. Use the \`fulltext\` argument under other queries for this functionality.
              \\"\\"\\"
              moviesFulltextMovieDescription(limit: Int, offset: Int, phrase: String!, sort: [MovieFulltextSort!], where: MovieFulltextWhere): [MovieFulltextResult!]!
              \\"\\"\\"
              Query a full-text index. This query returns the query score, but does not allow for aggregations. Use the \`fulltext\` argument under other queries for this functionality.
              \\"\\"\\"
              moviesFulltextMovieTitle(limit: Int, offset: Int, phrase: String!, sort: [MovieFulltextSort!], where: MovieFulltextWhere): [MovieFulltextResult!]!
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
});
