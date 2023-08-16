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
import { lexicographicSortSchema } from "graphql";
import { Neo4jGraphQL } from "../../../src";

describe("@populatedBy tests", () => {
    describe("Node property tests", () => {
        describe("Directive combinations", () => {
            test("PopulatedBy and default directives", async () => {
                const typeDefs = gql`
                    type Movie {
                        id: ID
                        callback1: String!
                            @populatedBy(operations: [CREATE], callback: "callback1")
                            @default(value: "Test")
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                await expect(neoSchema.getSchema()).rejects.toThrow(
                    "Directive @populatedBy cannot be used in combination with @default"
                );
            });

            test("PopulatedBy and id directives", async () => {
                const typeDefs = gql`
                    type Movie {
                        id: ID
                        callback1: String! @populatedBy(operations: [CREATE], callback: "callback1") @id
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                await expect(neoSchema.getSchema()).rejects.toThrow(
                    "Directive @populatedBy cannot be used in combination with @id"
                );
            });
        });

        test("PopulatedBy - existence", async () => {
            const typeDefs = gql`
                type Movie {
                    id: ID
                    callback1: String! @populatedBy(operations: [CREATE], callback: "callback1")
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toThrow(
                "PopulatedBy callback 'callback1' must be of type function"
            );
        });

        test("PopulatedBy - String", async () => {
            const callback1 = () => "random-string";
            const callback2 = () => "random-string";
            const callback3 = () => "random-string";

            const typeDefs = gql`
                type Movie {
                    id: ID
                    callback1: String! @populatedBy(operations: [CREATE], callback: "callback1")
                    callback2: String! @populatedBy(operations: [UPDATE], callback: "callback2")
                    callback3: String! @populatedBy(operations: [CREATE, UPDATE], callback: "callback3")
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback1,
                            callback2,
                            callback3,
                        },
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

                type Movie {
                  callback1: String!
                  callback2: String!
                  callback3: String!
                  id: ID
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
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  callback1: String
                  callback1_CONTAINS: String
                  callback1_ENDS_WITH: String
                  callback1_IN: [String!]
                  callback1_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_STARTS_WITH: String
                  callback2: String
                  callback2_CONTAINS: String
                  callback2_ENDS_WITH: String
                  callback2_IN: [String!]
                  callback2_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_STARTS_WITH: String
                  callback3: String
                  callback3_CONTAINS: String
                  callback3_ENDS_WITH: String
                  callback3_IN: [String!]
                  callback3_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_STARTS_WITH: String
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

        test("PopulatedBy - Int", async () => {
            const callback1 = () => "random-int";
            const callback2 = () => "random-int";
            const callback3 = () => "random-int";

            const typeDefs = gql`
                type Movie {
                    id: ID
                    callback1: Int! @populatedBy(operations: [CREATE], callback: "callback1")
                    callback2: Int! @populatedBy(operations: [UPDATE], callback: "callback2")
                    callback3: Int! @populatedBy(operations: [CREATE, UPDATE], callback: "callback3")
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback1,
                            callback2,
                            callback3,
                        },
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

                type Movie {
                  callback1: Int!
                  callback2: Int!
                  callback3: Int!
                  id: ID
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
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  callback1: Int
                  callback1_GT: Int
                  callback1_GTE: Int
                  callback1_IN: [Int!]
                  callback1_LT: Int
                  callback1_LTE: Int
                  callback1_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2: Int
                  callback2_GT: Int
                  callback2_GTE: Int
                  callback2_IN: [Int!]
                  callback2_LT: Int
                  callback2_LTE: Int
                  callback2_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3: Int
                  callback3_GT: Int
                  callback3_GTE: Int
                  callback3_IN: [Int!]
                  callback3_LT: Int
                  callback3_LTE: Int
                  callback3_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
    describe("Relationship property tests", () => {
        describe("Directive combinations", () => {
            test("PopulatedBy and default directives", async () => {
                const typeDefs = gql`
                    type Movie {
                        id: ID
                        genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                    }

                    interface RelProperties @relationshipProperties {
                        id: ID!
                        callback1: String!
                            @populatedBy(operations: [CREATE], callback: "callback4")
                            @default(value: "Test")
                    }

                    type Genre {
                        id: ID!
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                await expect(neoSchema.getSchema()).rejects.toThrow(
                    "Directive @populatedBy cannot be used in combination with @default"
                );
            });

            test("PopulatedBy and id directives", async () => {
                const typeDefs = gql`
                    type Movie {
                        id: ID
                        genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                    }

                    interface RelProperties @relationshipProperties {
                        id: ID!
                        callback1: String! @populatedBy(operations: [CREATE], callback: "callback4") @id
                    }

                    type Genre {
                        id: ID!
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });

                await expect(neoSchema.getSchema()).rejects.toThrow(
                    "Directive @populatedBy cannot be used in combination with @id"
                );
            });
        });

        test("PopulatedBy - existence", async () => {
            const typeDefs = gql`
                type Movie {
                    id: ID
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                interface RelProperties @relationshipProperties {
                    id: ID!
                    callback1: String! @populatedBy(operations: [CREATE], callback: "callback4")
                }

                type Genre {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            await expect(neoSchema.getSchema()).rejects.toThrow(
                "PopulatedBy callback 'callback4' must be of type function"
            );
        });
        test("PopulatedBy - String", async () => {
            const callback1 = () => "random-string";
            const callback2 = () => "random-string";
            const callback3 = () => "random-string";

            const typeDefs = gql`
                type Movie {
                    id: ID
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                interface RelProperties @relationshipProperties {
                    id: ID!
                    callback1: String! @populatedBy(operations: [CREATE], callback: "callback1")
                    callback2: String! @populatedBy(operations: [UPDATE], callback: "callback2")
                    callback3: String! @populatedBy(operations: [CREATE, UPDATE], callback: "callback3")
                }

                type Genre {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback1,
                            callback2,
                            callback3,
                        },
                    },
                },
            });

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

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

                type Genre {
                  id: ID!
                }

                input GenreConnectWhere {
                  node: GenreWhere!
                }

                input GenreCreateInput {
                  id: ID!
                }

                type GenreEdge {
                  cursor: String!
                  node: Genre!
                }

                input GenreOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [GenreSort!]
                }

                \\"\\"\\"
                Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
                \\"\\"\\"
                input GenreSort {
                  id: SortDirection
                }

                input GenreUpdateInput {
                  id: ID
                }

                input GenreWhere {
                  AND: [GenreWhere!]
                  NOT: GenreWhere
                  OR: [GenreWhere!]
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID!]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type GenresConnection {
                  edges: [GenreEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Movie {
                  genres(directed: Boolean = true, options: GenreOptions, where: GenreWhere): [Genre!]!
                  genresConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection!
                  id: ID
                }

                input MovieConnectInput {
                  genres: [MovieGenresConnectFieldInput!]
                }

                input MovieCreateInput {
                  genres: MovieGenresFieldInput
                  id: ID
                }

                input MovieDeleteInput {
                  genres: [MovieGenresDeleteFieldInput!]
                }

                input MovieDisconnectInput {
                  genres: [MovieGenresDisconnectFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                input MovieGenresConnectFieldInput {
                  edge: RelPropertiesCreateInput!
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: GenreConnectWhere
                }

                type MovieGenresConnection {
                  edges: [MovieGenresRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieGenresConnectionSort {
                  edge: RelPropertiesSort
                  node: GenreSort
                }

                input MovieGenresConnectionWhere {
                  AND: [MovieGenresConnectionWhere!]
                  NOT: MovieGenresConnectionWhere
                  OR: [MovieGenresConnectionWhere!]
                  edge: RelPropertiesWhere
                  edge_NOT: RelPropertiesWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  node: GenreWhere
                  node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieGenresCreateFieldInput {
                  edge: RelPropertiesCreateInput!
                  node: GenreCreateInput!
                }

                input MovieGenresDeleteFieldInput {
                  where: MovieGenresConnectionWhere
                }

                input MovieGenresDisconnectFieldInput {
                  where: MovieGenresConnectionWhere
                }

                input MovieGenresFieldInput {
                  connect: [MovieGenresConnectFieldInput!]
                  create: [MovieGenresCreateFieldInput!]
                }

                type MovieGenresRelationship implements RelProperties {
                  callback1: String!
                  callback2: String!
                  callback3: String!
                  cursor: String!
                  id: ID!
                  node: Genre!
                }

                input MovieGenresUpdateConnectionInput {
                  edge: RelPropertiesUpdateInput
                  node: GenreUpdateInput
                }

                input MovieGenresUpdateFieldInput {
                  connect: [MovieGenresConnectFieldInput!]
                  create: [MovieGenresCreateFieldInput!]
                  delete: [MovieGenresDeleteFieldInput!]
                  disconnect: [MovieGenresDisconnectFieldInput!]
                  update: MovieGenresUpdateConnectionInput
                  where: MovieGenresConnectionWhere
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
                  genres: [MovieGenresCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  genres: [MovieGenresUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  genres: GenreWhere @deprecated(reason: \\"Use \`genres_SOME\` instead.\\")
                  genresConnection: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_ALL: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_NONE: MovieGenresConnectionWhere
                  genresConnection_NOT: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SINGLE: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SOME: MovieGenresConnectionWhere
                  \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
                  genres_ALL: GenreWhere
                  \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
                  genres_NONE: GenreWhere
                  genres_NOT: GenreWhere @deprecated(reason: \\"Use \`genres_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
                  genres_SINGLE: GenreWhere
                  \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
                  genres_SOME: GenreWhere
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
                }

                type MoviesConnection {
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
                  genresConnection(after: String, first: Int, sort: [GenreSort], where: GenreWhere): GenresConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                }

                interface RelProperties {
                  callback1: String!
                  callback2: String!
                  callback3: String!
                  id: ID!
                }

                input RelPropertiesCreateInput {
                  id: ID!
                }

                input RelPropertiesSort {
                  callback1: SortDirection
                  callback2: SortDirection
                  callback3: SortDirection
                  id: SortDirection
                }

                input RelPropertiesUpdateInput {
                  id: ID
                }

                input RelPropertiesWhere {
                  AND: [RelPropertiesWhere!]
                  NOT: RelPropertiesWhere
                  OR: [RelPropertiesWhere!]
                  callback1: String
                  callback1_CONTAINS: String
                  callback1_ENDS_WITH: String
                  callback1_IN: [String!]
                  callback1_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_STARTS_WITH: String
                  callback2: String
                  callback2_CONTAINS: String
                  callback2_ENDS_WITH: String
                  callback2_IN: [String!]
                  callback2_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_STARTS_WITH: String
                  callback3: String
                  callback3_CONTAINS: String
                  callback3_ENDS_WITH: String
                  callback3_IN: [String!]
                  callback3_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_STARTS_WITH: String
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID!]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
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

        test("PopulatedBy - Int", async () => {
            const callback1 = () => "random-int";
            const callback2 = () => "random-int";
            const callback3 = () => "random-int";

            const typeDefs = gql`
                type Movie {
                    id: ID
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                interface RelProperties @relationshipProperties {
                    id: ID!
                    callback1: Int! @populatedBy(operations: [CREATE], callback: "callback1")
                    callback2: Int! @populatedBy(operations: [UPDATE], callback: "callback2")
                    callback3: Int! @populatedBy(operations: [CREATE, UPDATE], callback: "callback3")
                }

                type Genre {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback1,
                            callback2,
                            callback3,
                        },
                    },
                },
            });

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

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

                type Genre {
                  id: ID!
                }

                input GenreConnectWhere {
                  node: GenreWhere!
                }

                input GenreCreateInput {
                  id: ID!
                }

                type GenreEdge {
                  cursor: String!
                  node: Genre!
                }

                input GenreOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [GenreSort!]
                }

                \\"\\"\\"
                Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
                \\"\\"\\"
                input GenreSort {
                  id: SortDirection
                }

                input GenreUpdateInput {
                  id: ID
                }

                input GenreWhere {
                  AND: [GenreWhere!]
                  NOT: GenreWhere
                  OR: [GenreWhere!]
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID!]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type GenresConnection {
                  edges: [GenreEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Movie {
                  genres(directed: Boolean = true, options: GenreOptions, where: GenreWhere): [Genre!]!
                  genresConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection!
                  id: ID
                }

                input MovieConnectInput {
                  genres: [MovieGenresConnectFieldInput!]
                }

                input MovieCreateInput {
                  genres: MovieGenresFieldInput
                  id: ID
                }

                input MovieDeleteInput {
                  genres: [MovieGenresDeleteFieldInput!]
                }

                input MovieDisconnectInput {
                  genres: [MovieGenresDisconnectFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                input MovieGenresConnectFieldInput {
                  edge: RelPropertiesCreateInput!
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: GenreConnectWhere
                }

                type MovieGenresConnection {
                  edges: [MovieGenresRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieGenresConnectionSort {
                  edge: RelPropertiesSort
                  node: GenreSort
                }

                input MovieGenresConnectionWhere {
                  AND: [MovieGenresConnectionWhere!]
                  NOT: MovieGenresConnectionWhere
                  OR: [MovieGenresConnectionWhere!]
                  edge: RelPropertiesWhere
                  edge_NOT: RelPropertiesWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  node: GenreWhere
                  node_NOT: GenreWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieGenresCreateFieldInput {
                  edge: RelPropertiesCreateInput!
                  node: GenreCreateInput!
                }

                input MovieGenresDeleteFieldInput {
                  where: MovieGenresConnectionWhere
                }

                input MovieGenresDisconnectFieldInput {
                  where: MovieGenresConnectionWhere
                }

                input MovieGenresFieldInput {
                  connect: [MovieGenresConnectFieldInput!]
                  create: [MovieGenresCreateFieldInput!]
                }

                type MovieGenresRelationship implements RelProperties {
                  callback1: Int!
                  callback2: Int!
                  callback3: Int!
                  cursor: String!
                  id: ID!
                  node: Genre!
                }

                input MovieGenresUpdateConnectionInput {
                  edge: RelPropertiesUpdateInput
                  node: GenreUpdateInput
                }

                input MovieGenresUpdateFieldInput {
                  connect: [MovieGenresConnectFieldInput!]
                  create: [MovieGenresCreateFieldInput!]
                  delete: [MovieGenresDeleteFieldInput!]
                  disconnect: [MovieGenresDisconnectFieldInput!]
                  update: MovieGenresUpdateConnectionInput
                  where: MovieGenresConnectionWhere
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
                  genres: [MovieGenresCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  genres: [MovieGenresUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  genres: GenreWhere @deprecated(reason: \\"Use \`genres_SOME\` instead.\\")
                  genresConnection: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_ALL: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_NONE: MovieGenresConnectionWhere
                  genresConnection_NOT: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SINGLE: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SOME: MovieGenresConnectionWhere
                  \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
                  genres_ALL: GenreWhere
                  \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
                  genres_NONE: GenreWhere
                  genres_NOT: GenreWhere @deprecated(reason: \\"Use \`genres_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
                  genres_SINGLE: GenreWhere
                  \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
                  genres_SOME: GenreWhere
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
                }

                type MoviesConnection {
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
                  genresConnection(after: String, first: Int, sort: [GenreSort], where: GenreWhere): GenresConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                }

                interface RelProperties {
                  callback1: Int!
                  callback2: Int!
                  callback3: Int!
                  id: ID!
                }

                input RelPropertiesCreateInput {
                  id: ID!
                }

                input RelPropertiesSort {
                  callback1: SortDirection
                  callback2: SortDirection
                  callback3: SortDirection
                  id: SortDirection
                }

                input RelPropertiesUpdateInput {
                  id: ID
                }

                input RelPropertiesWhere {
                  AND: [RelPropertiesWhere!]
                  NOT: RelPropertiesWhere
                  OR: [RelPropertiesWhere!]
                  callback1: Int
                  callback1_GT: Int
                  callback1_GTE: Int
                  callback1_IN: [Int!]
                  callback1_LT: Int
                  callback1_LTE: Int
                  callback1_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback1_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2: Int
                  callback2_GT: Int
                  callback2_GTE: Int
                  callback2_IN: [Int!]
                  callback2_LT: Int
                  callback2_LTE: Int
                  callback2_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback2_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3: Int
                  callback3_GT: Int
                  callback3_GTE: Int
                  callback3_IN: [Int!]
                  callback3_LT: Int
                  callback3_LTE: Int
                  callback3_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  callback3_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID!]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
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
});
