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
import { GraphQLError, lexicographicSortSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { NoErrorThrownError, getErrorAsync } from "../../utils/get-error";

describe("@populatedBy tests", () => {
    describe("Node property tests", () => {
        describe("Directive combinations", () => {
            test("PopulatedBy and default directives", async () => {
                const typeDefs = gql`
                    type Movie @node {
                        id: ID
                        callback1: String!
                            @populatedBy(operations: [CREATE], callback: "callback1")
                            @default(value: "Test")
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback1: () => "test",
                            },
                        },
                    },
                });

                const errors = await getErrorAsync(() => neoSchema.getSchema());
                expect(errors).toHaveLength(1);
                expect((errors as Error[])[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect((errors as Error[])[0]).toHaveProperty(
                    "message",
                    "Invalid directive usage: Directive @populatedBy cannot be used in combination with @default"
                );
                expect((errors as Error[])[0]).toHaveProperty("path", ["Movie", "callback1"]);

                await expect(neoSchema.getSchema()).rejects.toHaveLength(1);
                await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                    new GraphQLError(
                        "Invalid directive usage: Directive @populatedBy cannot be used in combination with @default"
                    ),
                ]);
            });

            test("PopulatedBy and id directives", async () => {
                const typeDefs = gql`
                    type Movie @node {
                        id: ID
                        callback1: ID! @populatedBy(operations: [CREATE], callback: "callback1") @id
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback1: () => "test",
                            },
                        },
                    },
                });

                const errors = await getErrorAsync(() => neoSchema.getSchema());
                expect(errors).toHaveLength(1);
                expect((errors as Error[])[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect((errors as Error[])[0]).toHaveProperty(
                    "message",
                    "Invalid directive usage: Directive @populatedBy cannot be used in combination with @id"
                );
                expect((errors as Error[])[0]).toHaveProperty("path", ["Movie", "callback1"]);

                await expect(neoSchema.getSchema()).rejects.toHaveLength(1);
                await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                    new GraphQLError(
                        "Invalid directive usage: Directive @populatedBy cannot be used in combination with @id"
                    ),
                ]);
            });
        });

        test("PopulatedBy - existence", async () => {
            const typeDefs = gql`
                type Movie @node {
                    id: ID
                    callback1: String! @populatedBy(operations: [CREATE], callback: "callback1")
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const errors = await getErrorAsync(() => neoSchema.getSchema());
            expect(errors).toHaveLength(1);
            expect((errors as Error[])[0]).not.toBeInstanceOf(NoErrorThrownError);
            expect((errors as Error[])[0]).toHaveProperty(
                "message",
                "@populatedBy.callback needs to be provided in features option."
            );
            expect((errors as Error[])[0]).toHaveProperty("path", ["Movie", "callback1", "@populatedBy", "callback"]);
            await expect(neoSchema.getSchema()).rejects.toHaveLength(1);
            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError("@populatedBy.callback needs to be provided in features option."),
            ]);
        });

        test("PopulatedBy - String", async () => {
            const callback1 = () => "random-string";
            const callback2 = () => "random-string";
            const callback3 = () => "random-string";

            const typeDefs = gql`
                type Movie @node {
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

                type Count {
                  nodes: Int!
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
                  callback1: String!
                  callback2: String!
                  callback3: String!
                  id: ID
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  callback1: StringAggregateSelection!
                  callback2: StringAggregateSelection!
                  callback3: StringAggregateSelection!
                }

                input MovieCreateInput {
                  callback2: String!
                  id: ID
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
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
                  callback1: StringScalarMutations
                  callback1_SET: String @deprecated(reason: \\"Please use the generic mutation 'callback1: { set: ... } }' instead.\\")
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  callback1: StringScalarFilters
                  callback1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { contains: ... }\\")
                  callback1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { endsWith: ... }\\")
                  callback1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { eq: ... }\\")
                  callback1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter callback1: { in: ... }\\")
                  callback1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { startsWith: ... }\\")
                  callback2: StringScalarFilters
                  callback2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { contains: ... }\\")
                  callback2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { endsWith: ... }\\")
                  callback2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { eq: ... }\\")
                  callback2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter callback2: { in: ... }\\")
                  callback2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { startsWith: ... }\\")
                  callback3: StringScalarFilters
                  callback3_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { contains: ... }\\")
                  callback3_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { endsWith: ... }\\")
                  callback3_EQ: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { eq: ... }\\")
                  callback3_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter callback3: { in: ... }\\")
                  callback3_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { startsWith: ... }\\")
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  eq: String
                  in: [String!]
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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

        test("PopulatedBy - Int", async () => {
            const callback1 = () => "random-int";
            const callback2 = () => "random-int";
            const callback3 = () => "random-int";

            const typeDefs = gql`
                type Movie @node {
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

                type Count {
                  nodes: Int!
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

                type IntAggregateSelection {
                  average: Float
                  max: Int
                  min: Int
                  sum: Int
                }

                \\"\\"\\"Int filters\\"\\"\\"
                input IntScalarFilters {
                  eq: Int
                  gt: Int
                  gte: Int
                  in: [Int!]
                  lt: Int
                  lte: Int
                }

                \\"\\"\\"Int mutations\\"\\"\\"
                input IntScalarMutations {
                  add: Int
                  set: Int
                  subtract: Int
                }

                type Movie {
                  callback1: Int!
                  callback2: Int!
                  callback3: Int!
                  id: ID
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  callback1: IntAggregateSelection!
                  callback2: IntAggregateSelection!
                  callback3: IntAggregateSelection!
                }

                input MovieCreateInput {
                  callback2: Int!
                  id: ID
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
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
                  callback1: IntScalarMutations
                  callback1_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'callback1: { decrement: ... } }' instead.\\")
                  callback1_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'callback1: { increment: ... } }' instead.\\")
                  callback1_SET: Int @deprecated(reason: \\"Please use the generic mutation 'callback1: { set: ... } }' instead.\\")
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  callback1: IntScalarFilters
                  callback1_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { eq: ... }\\")
                  callback1_GT: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { gt: ... }\\")
                  callback1_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { gte: ... }\\")
                  callback1_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter callback1: { in: ... }\\")
                  callback1_LT: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { lt: ... }\\")
                  callback1_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { lte: ... }\\")
                  callback2: IntScalarFilters
                  callback2_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { eq: ... }\\")
                  callback2_GT: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { gt: ... }\\")
                  callback2_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { gte: ... }\\")
                  callback2_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter callback2: { in: ... }\\")
                  callback2_LT: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { lt: ... }\\")
                  callback2_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { lte: ... }\\")
                  callback3: IntScalarFilters
                  callback3_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { eq: ... }\\")
                  callback3_GT: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { gt: ... }\\")
                  callback3_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { gte: ... }\\")
                  callback3_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter callback3: { in: ... }\\")
                  callback3_LT: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { lt: ... }\\")
                  callback3_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { lte: ... }\\")
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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
    describe("Relationship property tests", () => {
        describe("Directive combinations", () => {
            test("PopulatedBy and default directives", async () => {
                const typeDefs = gql`
                    type Movie @node {
                        id: ID
                        genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback1: String!
                            @populatedBy(operations: [CREATE], callback: "callback4")
                            @default(value: "Test")
                    }

                    type Genre @node {
                        id: ID!
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback4: () => "test",
                            },
                        },
                    },
                });

                const errors = await getErrorAsync(() => neoSchema.getSchema());
                expect(errors).toHaveLength(1);
                expect((errors as Error[])[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect((errors as Error[])[0]).toHaveProperty(
                    "message",
                    "Invalid directive usage: Directive @populatedBy cannot be used in combination with @default"
                );
                expect((errors as Error[])[0]).toHaveProperty("path", ["RelProperties", "callback1"]);

                await expect(neoSchema.getSchema()).rejects.toHaveLength(1);
                await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                    new GraphQLError(
                        "Invalid directive usage: Directive @populatedBy cannot be used in combination with @default"
                    ),
                ]);
            });

            test("PopulatedBy and id directives", async () => {
                const typeDefs = gql`
                    type Movie @node {
                        id: ID
                        genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback1: ID! @populatedBy(operations: [CREATE], callback: "callback4") @id
                    }

                    type Genre @node {
                        id: ID!
                    }
                `;

                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback4: () => "test",
                            },
                        },
                    },
                });

                const errors = await getErrorAsync(() => neoSchema.getSchema());
                expect(errors).toHaveLength(1);
                expect((errors as Error[])[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect((errors as Error[])[0]).toHaveProperty(
                    "message",
                    "Invalid directive usage: Directive @populatedBy cannot be used in combination with @id"
                );
                expect((errors as Error[])[0]).toHaveProperty("path", ["RelProperties", "callback1"]);

                await expect(neoSchema.getSchema()).rejects.toHaveLength(1);
                await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                    new GraphQLError(
                        "Invalid directive usage: Directive @populatedBy cannot be used in combination with @id"
                    ),
                ]);
            });
        });

        test("PopulatedBy - existence", async () => {
            const typeDefs = gql`
                type Movie @node {
                    id: ID
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                type RelProperties @relationshipProperties {
                    id: ID!
                    callback1: String! @populatedBy(operations: [CREATE], callback: "callback4")
                }

                type Genre @node {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const errors = await getErrorAsync(() => neoSchema.getSchema());
            expect(errors).toHaveLength(1);
            expect((errors as Error[])[0]).not.toBeInstanceOf(NoErrorThrownError);
            expect((errors as Error[])[0]).toHaveProperty(
                "message",
                "@populatedBy.callback needs to be provided in features option."
            );
            expect((errors as Error[])[0]).toHaveProperty("path", [
                "RelProperties",
                "callback1",
                "@populatedBy",
                "callback",
            ]);

            await expect(neoSchema.getSchema()).rejects.toHaveLength(1);
            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError("@populatedBy.callback needs to be provided in features option."),
            ]);
        });
        test("PopulatedBy - String", async () => {
            const callback1 = () => "random-string";
            const callback2 = () => "random-string";
            const callback3 = () => "random-string";

            const typeDefs = gql`
                type Movie @node {
                    id: ID
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                type RelProperties @relationshipProperties {
                    id: ID!
                    callback1: String! @populatedBy(operations: [CREATE], callback: "callback1")
                    callback2: String! @populatedBy(operations: [UPDATE], callback: "callback2")
                    callback3: String! @populatedBy(operations: [CREATE, UPDATE], callback: "callback3")
                }

                type Genre @node {
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

                input ConnectionAggregationCountFilterInput {
                  edges: IntScalarFilters
                  nodes: IntScalarFilters
                }

                type Count {
                  nodes: Int!
                }

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Float filters\\"\\"\\"
                input FloatScalarFilters {
                  eq: Float
                  gt: Float
                  gte: Float
                  in: [Float!]
                  lt: Float
                  lte: Float
                }

                type Genre {
                  id: ID!
                }

                type GenreAggregate {
                  count: Count!
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

                input GenreRelationshipFilters {
                  \\"\\"\\"Filter type where all of the related Genres match this filter\\"\\"\\"
                  all: GenreWhere
                  \\"\\"\\"Filter type where none of the related Genres match this filter\\"\\"\\"
                  none: GenreWhere
                  \\"\\"\\"Filter type where one of the related Genres match this filter\\"\\"\\"
                  single: GenreWhere
                  \\"\\"\\"Filter type where some of the related Genres match this filter\\"\\"\\"
                  some: GenreWhere
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
                  id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
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

                \\"\\"\\"Int filters\\"\\"\\"
                input IntScalarFilters {
                  eq: Int
                  gt: Int
                  gte: Int
                  in: [Int!]
                  lt: Int
                  lte: Int
                }

                type Movie {
                  genres(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]!
                  genresConnection(after: String, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection!
                  id: ID
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  genres: MovieGenresFieldInput
                  id: ID
                }

                input MovieDeleteInput {
                  genres: [MovieGenresDeleteFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                type MovieGenreGenresAggregateSelection {
                  count: CountConnection!
                  edge: MovieGenreGenresEdgeAggregateSelection
                }

                type MovieGenreGenresEdgeAggregateSelection {
                  callback1: StringAggregateSelection!
                  callback2: StringAggregateSelection!
                  callback3: StringAggregateSelection!
                }

                input MovieGenresAggregateInput {
                  AND: [MovieGenresAggregateInput!]
                  NOT: MovieGenresAggregateInput
                  OR: [MovieGenresAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  edge: RelPropertiesAggregationWhereInput
                }

                input MovieGenresConnectFieldInput {
                  edge: RelPropertiesCreateInput!
                  where: GenreConnectWhere
                }

                type MovieGenresConnection {
                  aggregate: MovieGenreGenresAggregateSelection!
                  edges: [MovieGenresRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieGenresConnectionAggregateInput {
                  AND: [MovieGenresConnectionAggregateInput!]
                  NOT: MovieGenresConnectionAggregateInput
                  OR: [MovieGenresConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  edge: RelPropertiesAggregationWhereInput
                }

                input MovieGenresConnectionFilters {
                  \\"\\"\\"Filter Movies by aggregating results on related MovieGenresConnections\\"\\"\\"
                  aggregate: MovieGenresConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  all: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  none: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  single: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  some: MovieGenresConnectionWhere
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
                  node: GenreWhere
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

                type MovieGenresRelationship {
                  cursor: String!
                  node: Genre!
                  properties: RelProperties!
                }

                input MovieGenresUpdateConnectionInput {
                  edge: RelPropertiesUpdateInput
                  node: GenreUpdateInput
                  where: MovieGenresConnectionWhere
                }

                input MovieGenresUpdateFieldInput {
                  connect: [MovieGenresConnectFieldInput!]
                  create: [MovieGenresCreateFieldInput!]
                  delete: [MovieGenresDeleteFieldInput!]
                  disconnect: [MovieGenresDisconnectFieldInput!]
                  update: MovieGenresUpdateConnectionInput
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  genres: [MovieGenresUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  genres: GenreRelationshipFilters
                  genresAggregate: MovieGenresAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the genresConnection filter, please use { genresConnection: { aggregate: {...} } } instead\\")
                  genresConnection: MovieGenresConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_ALL: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_NONE: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SINGLE: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SOME: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
                  genres_ALL: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
                  genres_NONE: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
                  genres_SINGLE: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
                  genres_SOME: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: {  some: ... }' instead.\\")
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                }

                \\"\\"\\"
                The edge properties for the following fields:
                * Movie.genres
                \\"\\"\\"
                type RelProperties {
                  callback1: String!
                  callback2: String!
                  callback3: String!
                  id: ID!
                }

                input RelPropertiesAggregationWhereInput {
                  AND: [RelPropertiesAggregationWhereInput!]
                  NOT: RelPropertiesAggregationWhereInput
                  OR: [RelPropertiesAggregationWhereInput!]
                  callback1: StringScalarAggregationFilters
                  callback1_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { averageLength: { eq: ... } } }' instead.\\")
                  callback1_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { averageLength: { gt: ... } } }' instead.\\")
                  callback1_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { averageLength: { gte: ... } } }' instead.\\")
                  callback1_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { averageLength: { lt: ... } } }' instead.\\")
                  callback1_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { averageLength: { lte: ... } } }' instead.\\")
                  callback1_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { longestLength: { eq: ... } } }' instead.\\")
                  callback1_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { longestLength: { gt: ... } } }' instead.\\")
                  callback1_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { longestLength: { gte: ... } } }' instead.\\")
                  callback1_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { longestLength: { lt: ... } } }' instead.\\")
                  callback1_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { longestLength: { lte: ... } } }' instead.\\")
                  callback1_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { shortestLength: { eq: ... } } }' instead.\\")
                  callback1_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { shortestLength: { gt: ... } } }' instead.\\")
                  callback1_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { shortestLength: { gte: ... } } }' instead.\\")
                  callback1_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { shortestLength: { lt: ... } } }' instead.\\")
                  callback1_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { shortestLength: { lte: ... } } }' instead.\\")
                  callback2: StringScalarAggregationFilters
                  callback2_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { averageLength: { eq: ... } } }' instead.\\")
                  callback2_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { averageLength: { gt: ... } } }' instead.\\")
                  callback2_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { averageLength: { gte: ... } } }' instead.\\")
                  callback2_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { averageLength: { lt: ... } } }' instead.\\")
                  callback2_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { averageLength: { lte: ... } } }' instead.\\")
                  callback2_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { longestLength: { eq: ... } } }' instead.\\")
                  callback2_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { longestLength: { gt: ... } } }' instead.\\")
                  callback2_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { longestLength: { gte: ... } } }' instead.\\")
                  callback2_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { longestLength: { lt: ... } } }' instead.\\")
                  callback2_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { longestLength: { lte: ... } } }' instead.\\")
                  callback2_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { shortestLength: { eq: ... } } }' instead.\\")
                  callback2_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { shortestLength: { gt: ... } } }' instead.\\")
                  callback2_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { shortestLength: { gte: ... } } }' instead.\\")
                  callback2_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { shortestLength: { lt: ... } } }' instead.\\")
                  callback2_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { shortestLength: { lte: ... } } }' instead.\\")
                  callback3: StringScalarAggregationFilters
                  callback3_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { averageLength: { eq: ... } } }' instead.\\")
                  callback3_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { averageLength: { gt: ... } } }' instead.\\")
                  callback3_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { averageLength: { gte: ... } } }' instead.\\")
                  callback3_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { averageLength: { lt: ... } } }' instead.\\")
                  callback3_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { averageLength: { lte: ... } } }' instead.\\")
                  callback3_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { longestLength: { eq: ... } } }' instead.\\")
                  callback3_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { longestLength: { gt: ... } } }' instead.\\")
                  callback3_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { longestLength: { gte: ... } } }' instead.\\")
                  callback3_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { longestLength: { lt: ... } } }' instead.\\")
                  callback3_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { longestLength: { lte: ... } } }' instead.\\")
                  callback3_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { shortestLength: { eq: ... } } }' instead.\\")
                  callback3_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { shortestLength: { gt: ... } } }' instead.\\")
                  callback3_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { shortestLength: { gte: ... } } }' instead.\\")
                  callback3_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { shortestLength: { lt: ... } } }' instead.\\")
                  callback3_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { shortestLength: { lte: ... } } }' instead.\\")
                }

                input RelPropertiesCreateInput {
                  callback2: String!
                  id: ID!
                }

                input RelPropertiesSort {
                  callback1: SortDirection
                  callback2: SortDirection
                  callback3: SortDirection
                  id: SortDirection
                }

                input RelPropertiesUpdateInput {
                  callback1: StringScalarMutations
                  callback1_SET: String @deprecated(reason: \\"Please use the generic mutation 'callback1: { set: ... } }' instead.\\")
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input RelPropertiesWhere {
                  AND: [RelPropertiesWhere!]
                  NOT: RelPropertiesWhere
                  OR: [RelPropertiesWhere!]
                  callback1: StringScalarFilters
                  callback1_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { contains: ... }\\")
                  callback1_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { endsWith: ... }\\")
                  callback1_EQ: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { eq: ... }\\")
                  callback1_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter callback1: { in: ... }\\")
                  callback1_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback1: { startsWith: ... }\\")
                  callback2: StringScalarFilters
                  callback2_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { contains: ... }\\")
                  callback2_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { endsWith: ... }\\")
                  callback2_EQ: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { eq: ... }\\")
                  callback2_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter callback2: { in: ... }\\")
                  callback2_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback2: { startsWith: ... }\\")
                  callback3: StringScalarFilters
                  callback3_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { contains: ... }\\")
                  callback3_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { endsWith: ... }\\")
                  callback3_EQ: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { eq: ... }\\")
                  callback3_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter callback3: { in: ... }\\")
                  callback3_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter callback3: { startsWith: ... }\\")
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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

                \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                input StringScalarAggregationFilters {
                  averageLength: FloatScalarFilters
                  longestLength: IntScalarFilters
                  shortestLength: IntScalarFilters
                }

                \\"\\"\\"String filters\\"\\"\\"
                input StringScalarFilters {
                  contains: String
                  endsWith: String
                  eq: String
                  in: [String!]
                  startsWith: String
                }

                \\"\\"\\"String mutations\\"\\"\\"
                input StringScalarMutations {
                  set: String
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

        test("PopulatedBy - Int", async () => {
            const callback1 = () => "random-int";
            const callback2 = () => "random-int";
            const callback3 = () => "random-int";

            const typeDefs = gql`
                type Movie @node {
                    id: ID
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                type RelProperties @relationshipProperties {
                    id: ID!
                    callback1: Int! @populatedBy(operations: [CREATE], callback: "callback1")
                    callback2: Int! @populatedBy(operations: [UPDATE], callback: "callback2")
                    callback3: Int! @populatedBy(operations: [CREATE, UPDATE], callback: "callback3")
                }

                type Genre @node {
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

                input ConnectionAggregationCountFilterInput {
                  edges: IntScalarFilters
                  nodes: IntScalarFilters
                }

                type Count {
                  nodes: Int!
                }

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Float filters\\"\\"\\"
                input FloatScalarFilters {
                  eq: Float
                  gt: Float
                  gte: Float
                  in: [Float!]
                  lt: Float
                  lte: Float
                }

                type Genre {
                  id: ID!
                }

                type GenreAggregate {
                  count: Count!
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

                input GenreRelationshipFilters {
                  \\"\\"\\"Filter type where all of the related Genres match this filter\\"\\"\\"
                  all: GenreWhere
                  \\"\\"\\"Filter type where none of the related Genres match this filter\\"\\"\\"
                  none: GenreWhere
                  \\"\\"\\"Filter type where one of the related Genres match this filter\\"\\"\\"
                  single: GenreWhere
                  \\"\\"\\"Filter type where some of the related Genres match this filter\\"\\"\\"
                  some: GenreWhere
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
                  id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
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

                type IntAggregateSelection {
                  average: Float
                  max: Int
                  min: Int
                  sum: Int
                }

                \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
                input IntScalarAggregationFilters {
                  average: FloatScalarFilters
                  max: IntScalarFilters
                  min: IntScalarFilters
                  sum: IntScalarFilters
                }

                \\"\\"\\"Int filters\\"\\"\\"
                input IntScalarFilters {
                  eq: Int
                  gt: Int
                  gte: Int
                  in: [Int!]
                  lt: Int
                  lte: Int
                }

                \\"\\"\\"Int mutations\\"\\"\\"
                input IntScalarMutations {
                  add: Int
                  set: Int
                  subtract: Int
                }

                type Movie {
                  genres(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]!
                  genresConnection(after: String, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection!
                  id: ID
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  genres: MovieGenresFieldInput
                  id: ID
                }

                input MovieDeleteInput {
                  genres: [MovieGenresDeleteFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                type MovieGenreGenresAggregateSelection {
                  count: CountConnection!
                  edge: MovieGenreGenresEdgeAggregateSelection
                }

                type MovieGenreGenresEdgeAggregateSelection {
                  callback1: IntAggregateSelection!
                  callback2: IntAggregateSelection!
                  callback3: IntAggregateSelection!
                }

                input MovieGenresAggregateInput {
                  AND: [MovieGenresAggregateInput!]
                  NOT: MovieGenresAggregateInput
                  OR: [MovieGenresAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  edge: RelPropertiesAggregationWhereInput
                }

                input MovieGenresConnectFieldInput {
                  edge: RelPropertiesCreateInput!
                  where: GenreConnectWhere
                }

                type MovieGenresConnection {
                  aggregate: MovieGenreGenresAggregateSelection!
                  edges: [MovieGenresRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieGenresConnectionAggregateInput {
                  AND: [MovieGenresConnectionAggregateInput!]
                  NOT: MovieGenresConnectionAggregateInput
                  OR: [MovieGenresConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  edge: RelPropertiesAggregationWhereInput
                }

                input MovieGenresConnectionFilters {
                  \\"\\"\\"Filter Movies by aggregating results on related MovieGenresConnections\\"\\"\\"
                  aggregate: MovieGenresConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  all: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  none: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  single: MovieGenresConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  some: MovieGenresConnectionWhere
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
                  node: GenreWhere
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

                type MovieGenresRelationship {
                  cursor: String!
                  node: Genre!
                  properties: RelProperties!
                }

                input MovieGenresUpdateConnectionInput {
                  edge: RelPropertiesUpdateInput
                  node: GenreUpdateInput
                  where: MovieGenresConnectionWhere
                }

                input MovieGenresUpdateFieldInput {
                  connect: [MovieGenresConnectFieldInput!]
                  create: [MovieGenresCreateFieldInput!]
                  delete: [MovieGenresDeleteFieldInput!]
                  disconnect: [MovieGenresDisconnectFieldInput!]
                  update: MovieGenresUpdateConnectionInput
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  genres: [MovieGenresUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  genres: GenreRelationshipFilters
                  genresAggregate: MovieGenresAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the genresConnection filter, please use { genresConnection: { aggregate: {...} } } instead\\")
                  genresConnection: MovieGenresConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_ALL: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_NONE: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SINGLE: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieGenresConnections match this filter
                  \\"\\"\\"
                  genresConnection_SOME: MovieGenresConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genresConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
                  genres_ALL: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
                  genres_NONE: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
                  genres_SINGLE: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
                  genres_SOME: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genres: {  some: ... }' instead.\\")
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                }

                \\"\\"\\"
                The edge properties for the following fields:
                * Movie.genres
                \\"\\"\\"
                type RelProperties {
                  callback1: Int!
                  callback2: Int!
                  callback3: Int!
                  id: ID!
                }

                input RelPropertiesAggregationWhereInput {
                  AND: [RelPropertiesAggregationWhereInput!]
                  NOT: RelPropertiesAggregationWhereInput
                  OR: [RelPropertiesAggregationWhereInput!]
                  callback1: IntScalarAggregationFilters
                  callback1_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { average: { eq: ... } } }' instead.\\")
                  callback1_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { average: { gt: ... } } }' instead.\\")
                  callback1_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { average: { gte: ... } } }' instead.\\")
                  callback1_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { average: { lt: ... } } }' instead.\\")
                  callback1_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { average: { lte: ... } } }' instead.\\")
                  callback1_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { max: { eq: ... } } }' instead.\\")
                  callback1_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { max: { gt: ... } } }' instead.\\")
                  callback1_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { max: { gte: ... } } }' instead.\\")
                  callback1_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { max: { lt: ... } } }' instead.\\")
                  callback1_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { max: { lte: ... } } }' instead.\\")
                  callback1_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { min: { eq: ... } } }' instead.\\")
                  callback1_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { min: { gt: ... } } }' instead.\\")
                  callback1_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { min: { gte: ... } } }' instead.\\")
                  callback1_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { min: { lt: ... } } }' instead.\\")
                  callback1_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { min: { lte: ... } } }' instead.\\")
                  callback1_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { sum: { eq: ... } } }' instead.\\")
                  callback1_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { sum: { gt: ... } } }' instead.\\")
                  callback1_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { sum: { gte: ... } } }' instead.\\")
                  callback1_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { sum: { lt: ... } } }' instead.\\")
                  callback1_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback1: { sum: { lte: ... } } }' instead.\\")
                  callback2: IntScalarAggregationFilters
                  callback2_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { average: { eq: ... } } }' instead.\\")
                  callback2_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { average: { gt: ... } } }' instead.\\")
                  callback2_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { average: { gte: ... } } }' instead.\\")
                  callback2_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { average: { lt: ... } } }' instead.\\")
                  callback2_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { average: { lte: ... } } }' instead.\\")
                  callback2_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { max: { eq: ... } } }' instead.\\")
                  callback2_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { max: { gt: ... } } }' instead.\\")
                  callback2_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { max: { gte: ... } } }' instead.\\")
                  callback2_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { max: { lt: ... } } }' instead.\\")
                  callback2_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { max: { lte: ... } } }' instead.\\")
                  callback2_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { min: { eq: ... } } }' instead.\\")
                  callback2_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { min: { gt: ... } } }' instead.\\")
                  callback2_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { min: { gte: ... } } }' instead.\\")
                  callback2_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { min: { lt: ... } } }' instead.\\")
                  callback2_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { min: { lte: ... } } }' instead.\\")
                  callback2_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { sum: { eq: ... } } }' instead.\\")
                  callback2_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { sum: { gt: ... } } }' instead.\\")
                  callback2_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { sum: { gte: ... } } }' instead.\\")
                  callback2_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { sum: { lt: ... } } }' instead.\\")
                  callback2_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback2: { sum: { lte: ... } } }' instead.\\")
                  callback3: IntScalarAggregationFilters
                  callback3_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { average: { eq: ... } } }' instead.\\")
                  callback3_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { average: { gt: ... } } }' instead.\\")
                  callback3_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { average: { gte: ... } } }' instead.\\")
                  callback3_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { average: { lt: ... } } }' instead.\\")
                  callback3_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { average: { lte: ... } } }' instead.\\")
                  callback3_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { max: { eq: ... } } }' instead.\\")
                  callback3_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { max: { gt: ... } } }' instead.\\")
                  callback3_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { max: { gte: ... } } }' instead.\\")
                  callback3_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { max: { lt: ... } } }' instead.\\")
                  callback3_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { max: { lte: ... } } }' instead.\\")
                  callback3_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { min: { eq: ... } } }' instead.\\")
                  callback3_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { min: { gt: ... } } }' instead.\\")
                  callback3_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { min: { gte: ... } } }' instead.\\")
                  callback3_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { min: { lt: ... } } }' instead.\\")
                  callback3_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { min: { lte: ... } } }' instead.\\")
                  callback3_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { sum: { eq: ... } } }' instead.\\")
                  callback3_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { sum: { gt: ... } } }' instead.\\")
                  callback3_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { sum: { gte: ... } } }' instead.\\")
                  callback3_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { sum: { lt: ... } } }' instead.\\")
                  callback3_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'callback3: { sum: { lte: ... } } }' instead.\\")
                }

                input RelPropertiesCreateInput {
                  callback2: Int!
                  id: ID!
                }

                input RelPropertiesSort {
                  callback1: SortDirection
                  callback2: SortDirection
                  callback3: SortDirection
                  id: SortDirection
                }

                input RelPropertiesUpdateInput {
                  callback1: IntScalarMutations
                  callback1_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'callback1: { decrement: ... } }' instead.\\")
                  callback1_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'callback1: { increment: ... } }' instead.\\")
                  callback1_SET: Int @deprecated(reason: \\"Please use the generic mutation 'callback1: { set: ... } }' instead.\\")
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input RelPropertiesWhere {
                  AND: [RelPropertiesWhere!]
                  NOT: RelPropertiesWhere
                  OR: [RelPropertiesWhere!]
                  callback1: IntScalarFilters
                  callback1_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { eq: ... }\\")
                  callback1_GT: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { gt: ... }\\")
                  callback1_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { gte: ... }\\")
                  callback1_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter callback1: { in: ... }\\")
                  callback1_LT: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { lt: ... }\\")
                  callback1_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback1: { lte: ... }\\")
                  callback2: IntScalarFilters
                  callback2_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { eq: ... }\\")
                  callback2_GT: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { gt: ... }\\")
                  callback2_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { gte: ... }\\")
                  callback2_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter callback2: { in: ... }\\")
                  callback2_LT: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { lt: ... }\\")
                  callback2_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback2: { lte: ... }\\")
                  callback3: IntScalarFilters
                  callback3_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { eq: ... }\\")
                  callback3_GT: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { gt: ... }\\")
                  callback3_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { gte: ... }\\")
                  callback3_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter callback3: { in: ... }\\")
                  callback3_LT: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { lt: ... }\\")
                  callback3_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter callback3: { lte: ... }\\")
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
});
