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

describe("@fulltext schema", () => {
    test("fulltext", () => {
        const typeDefs = gql`
            type Movie
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

            input MovieFulltext {
              MovieDescription: MovieMovieDescriptionFulltext
              MovieTitle: MovieMovieTitleFulltext
            }

            input MovieMovieDescriptionFulltext {
              phrase: String!
              score_EQUAL: Int
            }

            input MovieMovieTitleFulltext {
              phrase: String!
              score_EQUAL: Int
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort]
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
              OR: [MovieWhere!]
              description: String
              description_CONTAINS: String
              description_ENDS_WITH: String
              description_IN: [String]
              description_NOT: String
              description_NOT_CONTAINS: String
              description_NOT_ENDS_WITH: String
              description_NOT_IN: [String]
              description_NOT_STARTS_WITH: String
              description_STARTS_WITH: String
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

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            type Query {
              movies(fulltext: MovieFulltext, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(fulltext: MovieFulltext, where: MovieWhere): MovieAggregateSelection!
              moviesCount(fulltext: MovieFulltext, where: MovieWhere): Int!
            }

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
});
