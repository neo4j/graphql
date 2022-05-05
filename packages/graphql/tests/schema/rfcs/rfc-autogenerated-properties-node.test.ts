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
import { gql } from "apollo-server";
import { lexicographicSortSchema } from "graphql";
import { Neo4jGraphQL } from "../../../src";

describe("schema/rfc/autogenerate-properties-node", () => {
    describe("Callback - combinations", () => {
        test("Callback and default directives", async () => {
            const typeDefs = gql`
                type Movie {
                    id: ID
                    callback1: String! @callback(operations: [CREATE], name: "callback1") @default(value: "Test")
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toThrow(
                "Directive @callback cannot be used in combination with @default"
            );
        });

        test("Callback and id directives", async () => {
            const typeDefs = gql`
                type Movie {
                    id: ID
                    callback1: String! @callback(operations: [CREATE], name: "callback1") @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toThrow(
                "Directive @callback cannot be used in combination with @id"
            );
        });
    });

    test("Callback - existance", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                callback1: String! @callback(operations: [CREATE], name: "callback1")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow("Directive callback 'callback1' must be of type function");
    });

    test("Callback - String", async () => {
        const callback1 = () => "random-string";
        const callback2 = () => "random-string";
        const callback3 = () => "random-string";

        const typeDefs = gql`
            type Movie {
                id: ID
                callback1: String! @callback(operations: [CREATE], name: "callback1")
                callback2: String! @callback(operations: [UPDATE], name: "callback2")
                callback3: String! @callback(operations: [CREATE, UPDATE], name: "callback3")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                callbacks: {
                    callback1,
                    callback2,
                    callback3,
                },
            },
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

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

            type Movie {
              callback1: String!
              callback2: String!
              callback3: String!
              id: ID
            }

            type MovieAggregateSelection {
              callback1: StringAggregateSelectionNonNullable!
              callback2: StringAggregateSelectionNonNullable!
              callback3: StringAggregateSelectionNonNullable!
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input MovieCreateInput {
              id: ID
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
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
              callback1: SortDirection
              callback2: SortDirection
              callback3: SortDirection
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              callback1: String
              callback1_CONTAINS: String
              callback1_ENDS_WITH: String
              callback1_IN: [String!]
              callback1_NOT: String
              callback1_NOT_CONTAINS: String
              callback1_NOT_ENDS_WITH: String
              callback1_NOT_IN: [String!]
              callback1_NOT_STARTS_WITH: String
              callback1_STARTS_WITH: String
              callback2: String
              callback2_CONTAINS: String
              callback2_ENDS_WITH: String
              callback2_IN: [String!]
              callback2_NOT: String
              callback2_NOT_CONTAINS: String
              callback2_NOT_ENDS_WITH: String
              callback2_NOT_IN: [String!]
              callback2_NOT_STARTS_WITH: String
              callback2_STARTS_WITH: String
              callback3: String
              callback3_CONTAINS: String
              callback3_ENDS_WITH: String
              callback3_IN: [String!]
              callback3_NOT: String
              callback3_NOT_CONTAINS: String
              callback3_NOT_ENDS_WITH: String
              callback3_NOT_IN: [String!]
              callback3_NOT_STARTS_WITH: String
              callback3_STARTS_WITH: String
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

            type StringAggregateSelectionNonNullable {
              longest: String!
              shortest: String!
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

    test("Callback - Int", async () => {
        const callback1 = () => "random-int";
        const callback2 = () => "random-int";
        const callback3 = () => "random-int";

        const typeDefs = gql`
            type Movie {
                id: ID
                callback1: Int! @callback(operations: [CREATE], name: "callback1")
                callback2: Int! @callback(operations: [UPDATE], name: "callback2")
                callback3: Int! @callback(operations: [CREATE, UPDATE], name: "callback3")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                callbacks: {
                    callback1,
                    callback2,
                    callback3,
                },
            },
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

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

            type IntAggregateSelectionNonNullable {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
            }

            type Movie {
              callback1: Int!
              callback2: Int!
              callback3: Int!
              id: ID
            }

            type MovieAggregateSelection {
              callback1: IntAggregateSelectionNonNullable!
              callback2: IntAggregateSelectionNonNullable!
              callback3: IntAggregateSelectionNonNullable!
              count: Int!
              id: IDAggregateSelectionNullable!
            }

            input MovieCreateInput {
              id: ID
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
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
              callback1: SortDirection
              callback2: SortDirection
              callback3: SortDirection
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              callback1: Int
              callback1_GT: Int
              callback1_GTE: Int
              callback1_IN: [Int!]
              callback1_LT: Int
              callback1_LTE: Int
              callback1_NOT: Int
              callback1_NOT_IN: [Int!]
              callback2: Int
              callback2_GT: Int
              callback2_GTE: Int
              callback2_IN: [Int!]
              callback2_LT: Int
              callback2_LTE: Int
              callback2_NOT: Int
              callback2_NOT_IN: [Int!]
              callback3: Int
              callback3_GT: Int
              callback3_GTE: Int
              callback3_IN: [Int!]
              callback3_LT: Int
              callback3_LTE: Int
              callback3_NOT: Int
              callback3_NOT_IN: [Int!]
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
