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
import { Neo4jGraphQL } from "../../../src";

describe("Datetime", () => {
    test("DateTime", () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                datetime: DateTime
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
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

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelectionNullable {
              max: DateTime
              min: DateTime
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

            type Movie {
              datetime: DateTime
              id: ID
            }

            type MovieAggregateSelection {
              count: Int!
              datetime: DateTimeAggregateSelectionNullable!
              id: IDAggregateSelectionNullable!
            }

            input MovieCreateInput {
              datetime: DateTime
              id: ID
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              datetime: SortDirection
              id: SortDirection
            }

            type MovieSubscriptionResponse {
              id: Int!
              movie: Movie
              name: String!
              propsUpdated: [String!]
              relationshipID: String
              relationshipName: String
              toID: String
              toName: String
              type: String!
            }

            input MovieUpdateInput {
              datetime: DateTime
              id: ID
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              datetime: DateTime
              datetime_GT: DateTime
              datetime_GTE: DateTime
              datetime_IN: [DateTime]
              datetime_LT: DateTime
              datetime_LTE: DateTime
              datetime_NOT: DateTime
              datetime_NOT_IN: [DateTime]
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

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            enum NodeUpdatedType {
              Connected
              Created
              Deleted
              Disconnected
              Updated
            }

            type Query {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesCount(where: MovieWhere): Int!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type Subscription {
              \\"\\"\\"Subscribe to updates from Movie\\"\\"\\"
              subscribeToMovie(filter: SubscriptionFilter, where: MovieWhere): MovieSubscriptionResponse!
            }

            input SubscriptionFilter {
              handle: String
              handle_IN: [String!]
              handle_NOT: String
              handle_NOT_IN: [String!]
              handle_UNDEFINED: Boolean
              id: Int
              id_IN: [Int!]
              id_NOT: Int
              id_NOT_IN: [Int!]
              id_UNDEFINED: Boolean
              propsUpdated: [String!]
              relationshipID: Int
              relationshipID_IN: [Int!]
              relationshipID_NOT: Int
              relationshipID_NOT_IN: [Int!]
              relationshipID_UNDEFINED: Boolean
              relationshipName: String
              relationshipName_IN: [String!]
              relationshipName_NOT: String
              relationshipName_NOT_IN: [String!]
              relationshipName_UNDEFINED: Boolean
              toID: Int
              toID_IN: [Int!]
              toID_NOT: Int
              toID_NOT_IN: [Int!]
              toID_UNDEFINED: Boolean
              toName: String
              toName_IN: [String!]
              toName_NOT: String
              toName_NOT_IN: [String!]
              toName_UNDEFINED: Boolean
              type: NodeUpdatedType
              type_IN: [NodeUpdatedType!]
              type_NOT: NodeUpdatedType
              type_NOT_IN: [NodeUpdatedType!]
              type_UNDEFINED: Boolean
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
