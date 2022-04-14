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

describe("schema/rfc/autogenerate-properties-rel", () => {
    describe("Callback - combinations", () => {
        test("Callback and default directives", async () => {
            const typeDefs = gql`
                type Movie {
                    id: ID
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                interface RelProperties {
                    id: ID!
                    callback1: String! @callback(operations: [CREATE], name: "callback4") @default(value: "Test")
                }

                type Genre {
                    id: ID!
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
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
                }

                interface RelProperties {
                    id: ID!
                    callback1: String! @callback(operations: [CREATE], name: "callback4") @id
                }

                type Genre {
                    id: ID!
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
                genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
            }

            interface RelProperties {
                id: ID!
                callback1: String! @callback(operations: [CREATE], name: "callback4")
            }

            type Genre {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow("Directive callback 'callback4' must be of type function");
    });
    test("Callback - String", async () => {
        const callback1 = () => "random-string";
        const callback2 = () => "random-string";
        const callback3 = () => "random-string";

        const typeDefs = gql`
            type Movie {
                id: ID
                genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
            }

            interface RelProperties {
                id: ID!
                callback1: String! @callback(operations: [CREATE], name: "callback1")
                callback2: String! @callback(operations: [UPDATE], name: "callback2")
                callback3: String! @callback(operations: [CREATE, UPDATE], name: "callback3")
            }

            type Genre {
                id: ID!
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

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
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

            type Genre {
              id: ID!
            }

            type GenreAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNonNullable!
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
              OR: [GenreWhere!]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID!]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID!]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type Movie {
              genres(directed: Boolean = true, options: GenreOptions, where: GenreWhere): [Genre!]!
              genresAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenresAggregationSelection
              genresConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection!
              id: ID
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
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

            type MovieGenreGenresAggregationSelection {
              count: Int!
              edge: MovieGenreGenresEdgeAggregateSelection
              node: MovieGenreGenresNodeAggregateSelection
            }

            type MovieGenreGenresEdgeAggregateSelection {
              callback1: StringAggregateSelectionNonNullable!
              callback2: StringAggregateSelectionNonNullable!
              callback3: StringAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
            }

            type MovieGenreGenresNodeAggregateSelection {
              id: IDAggregateSelectionNonNullable!
            }

            input MovieGenresAggregateInput {
              AND: [MovieGenresAggregateInput!]
              OR: [MovieGenresAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: MovieGenresEdgeAggregationWhereInput
              node: MovieGenresNodeAggregationWhereInput
            }

            input MovieGenresConnectFieldInput {
              edge: RelPropertiesCreateInput!
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
              OR: [MovieGenresConnectionWhere!]
              edge: RelPropertiesWhere
              edge_NOT: RelPropertiesWhere
              node: GenreWhere
              node_NOT: GenreWhere
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

            input MovieGenresEdgeAggregationWhereInput {
              AND: [MovieGenresEdgeAggregationWhereInput!]
              OR: [MovieGenresEdgeAggregationWhereInput!]
              callback1_AVERAGE_EQUAL: Float
              callback1_AVERAGE_GT: Float
              callback1_AVERAGE_GTE: Float
              callback1_AVERAGE_LT: Float
              callback1_AVERAGE_LTE: Float
              callback1_EQUAL: String
              callback1_GT: Int
              callback1_GTE: Int
              callback1_LONGEST_EQUAL: Int
              callback1_LONGEST_GT: Int
              callback1_LONGEST_GTE: Int
              callback1_LONGEST_LT: Int
              callback1_LONGEST_LTE: Int
              callback1_LT: Int
              callback1_LTE: Int
              callback1_SHORTEST_EQUAL: Int
              callback1_SHORTEST_GT: Int
              callback1_SHORTEST_GTE: Int
              callback1_SHORTEST_LT: Int
              callback1_SHORTEST_LTE: Int
              callback2_AVERAGE_EQUAL: Float
              callback2_AVERAGE_GT: Float
              callback2_AVERAGE_GTE: Float
              callback2_AVERAGE_LT: Float
              callback2_AVERAGE_LTE: Float
              callback2_EQUAL: String
              callback2_GT: Int
              callback2_GTE: Int
              callback2_LONGEST_EQUAL: Int
              callback2_LONGEST_GT: Int
              callback2_LONGEST_GTE: Int
              callback2_LONGEST_LT: Int
              callback2_LONGEST_LTE: Int
              callback2_LT: Int
              callback2_LTE: Int
              callback2_SHORTEST_EQUAL: Int
              callback2_SHORTEST_GT: Int
              callback2_SHORTEST_GTE: Int
              callback2_SHORTEST_LT: Int
              callback2_SHORTEST_LTE: Int
              callback3_AVERAGE_EQUAL: Float
              callback3_AVERAGE_GT: Float
              callback3_AVERAGE_GTE: Float
              callback3_AVERAGE_LT: Float
              callback3_AVERAGE_LTE: Float
              callback3_EQUAL: String
              callback3_GT: Int
              callback3_GTE: Int
              callback3_LONGEST_EQUAL: Int
              callback3_LONGEST_GT: Int
              callback3_LONGEST_GTE: Int
              callback3_LONGEST_LT: Int
              callback3_LONGEST_LTE: Int
              callback3_LT: Int
              callback3_LTE: Int
              callback3_SHORTEST_EQUAL: Int
              callback3_SHORTEST_GT: Int
              callback3_SHORTEST_GTE: Int
              callback3_SHORTEST_LT: Int
              callback3_SHORTEST_LTE: Int
              id_EQUAL: ID
            }

            input MovieGenresFieldInput {
              connect: [MovieGenresConnectFieldInput!]
              create: [MovieGenresCreateFieldInput!]
            }

            input MovieGenresNodeAggregationWhereInput {
              AND: [MovieGenresNodeAggregationWhereInput!]
              OR: [MovieGenresNodeAggregationWhereInput!]
              id_EQUAL: ID
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
              OR: [MovieWhere!]
              genres: GenreWhere @deprecated(reason: \\"Use \`genres_SOME\` instead.\\")
              genresAggregate: MovieGenresAggregateInput
              genresConnection: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_SOME\` instead.\\")
              genresConnection_ALL: MovieGenresConnectionWhere
              genresConnection_NONE: MovieGenresConnectionWhere
              genresConnection_NOT: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_NONE\` instead.\\")
              genresConnection_SINGLE: MovieGenresConnectionWhere
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
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort], where: GenreWhere): GenresConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
              OR: [RelPropertiesWhere!]
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
              id_IN: [ID!]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID!]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
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

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
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
                genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "RelProperties")
            }

            interface RelProperties {
                id: ID!
                callback1: Int! @callback(operations: [CREATE], name: "callback1")
                callback2: Int! @callback(operations: [UPDATE], name: "callback2")
                callback3: Int! @callback(operations: [CREATE, UPDATE], name: "callback3")
            }

            type Genre {
                id: ID!
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

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
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

            type Genre {
              id: ID!
            }

            type GenreAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNonNullable!
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
              OR: [GenreWhere!]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID!]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID!]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
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
              genres(directed: Boolean = true, options: GenreOptions, where: GenreWhere): [Genre!]!
              genresAggregate(directed: Boolean = true, where: GenreWhere): MovieGenreGenresAggregationSelection
              genresConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieGenresConnectionSort!], where: MovieGenresConnectionWhere): MovieGenresConnection!
              id: ID
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNullable!
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

            type MovieGenreGenresAggregationSelection {
              count: Int!
              edge: MovieGenreGenresEdgeAggregateSelection
              node: MovieGenreGenresNodeAggregateSelection
            }

            type MovieGenreGenresEdgeAggregateSelection {
              callback1: IntAggregateSelectionNonNullable!
              callback2: IntAggregateSelectionNonNullable!
              callback3: IntAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
            }

            type MovieGenreGenresNodeAggregateSelection {
              id: IDAggregateSelectionNonNullable!
            }

            input MovieGenresAggregateInput {
              AND: [MovieGenresAggregateInput!]
              OR: [MovieGenresAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: MovieGenresEdgeAggregationWhereInput
              node: MovieGenresNodeAggregationWhereInput
            }

            input MovieGenresConnectFieldInput {
              edge: RelPropertiesCreateInput!
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
              OR: [MovieGenresConnectionWhere!]
              edge: RelPropertiesWhere
              edge_NOT: RelPropertiesWhere
              node: GenreWhere
              node_NOT: GenreWhere
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

            input MovieGenresEdgeAggregationWhereInput {
              AND: [MovieGenresEdgeAggregationWhereInput!]
              OR: [MovieGenresEdgeAggregationWhereInput!]
              callback1_AVERAGE_EQUAL: Float
              callback1_AVERAGE_GT: Float
              callback1_AVERAGE_GTE: Float
              callback1_AVERAGE_LT: Float
              callback1_AVERAGE_LTE: Float
              callback1_EQUAL: Int
              callback1_GT: Int
              callback1_GTE: Int
              callback1_LT: Int
              callback1_LTE: Int
              callback1_MAX_EQUAL: Int
              callback1_MAX_GT: Int
              callback1_MAX_GTE: Int
              callback1_MAX_LT: Int
              callback1_MAX_LTE: Int
              callback1_MIN_EQUAL: Int
              callback1_MIN_GT: Int
              callback1_MIN_GTE: Int
              callback1_MIN_LT: Int
              callback1_MIN_LTE: Int
              callback1_SUM_EQUAL: Int
              callback1_SUM_GT: Int
              callback1_SUM_GTE: Int
              callback1_SUM_LT: Int
              callback1_SUM_LTE: Int
              callback2_AVERAGE_EQUAL: Float
              callback2_AVERAGE_GT: Float
              callback2_AVERAGE_GTE: Float
              callback2_AVERAGE_LT: Float
              callback2_AVERAGE_LTE: Float
              callback2_EQUAL: Int
              callback2_GT: Int
              callback2_GTE: Int
              callback2_LT: Int
              callback2_LTE: Int
              callback2_MAX_EQUAL: Int
              callback2_MAX_GT: Int
              callback2_MAX_GTE: Int
              callback2_MAX_LT: Int
              callback2_MAX_LTE: Int
              callback2_MIN_EQUAL: Int
              callback2_MIN_GT: Int
              callback2_MIN_GTE: Int
              callback2_MIN_LT: Int
              callback2_MIN_LTE: Int
              callback2_SUM_EQUAL: Int
              callback2_SUM_GT: Int
              callback2_SUM_GTE: Int
              callback2_SUM_LT: Int
              callback2_SUM_LTE: Int
              callback3_AVERAGE_EQUAL: Float
              callback3_AVERAGE_GT: Float
              callback3_AVERAGE_GTE: Float
              callback3_AVERAGE_LT: Float
              callback3_AVERAGE_LTE: Float
              callback3_EQUAL: Int
              callback3_GT: Int
              callback3_GTE: Int
              callback3_LT: Int
              callback3_LTE: Int
              callback3_MAX_EQUAL: Int
              callback3_MAX_GT: Int
              callback3_MAX_GTE: Int
              callback3_MAX_LT: Int
              callback3_MAX_LTE: Int
              callback3_MIN_EQUAL: Int
              callback3_MIN_GT: Int
              callback3_MIN_GTE: Int
              callback3_MIN_LT: Int
              callback3_MIN_LTE: Int
              callback3_SUM_EQUAL: Int
              callback3_SUM_GT: Int
              callback3_SUM_GTE: Int
              callback3_SUM_LT: Int
              callback3_SUM_LTE: Int
              id_EQUAL: ID
            }

            input MovieGenresFieldInput {
              connect: [MovieGenresConnectFieldInput!]
              create: [MovieGenresCreateFieldInput!]
            }

            input MovieGenresNodeAggregationWhereInput {
              AND: [MovieGenresNodeAggregationWhereInput!]
              OR: [MovieGenresNodeAggregationWhereInput!]
              id_EQUAL: ID
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
              OR: [MovieWhere!]
              genres: GenreWhere @deprecated(reason: \\"Use \`genres_SOME\` instead.\\")
              genresAggregate: MovieGenresAggregateInput
              genresConnection: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_SOME\` instead.\\")
              genresConnection_ALL: MovieGenresConnectionWhere
              genresConnection_NONE: MovieGenresConnectionWhere
              genresConnection_NOT: MovieGenresConnectionWhere @deprecated(reason: \\"Use \`genresConnection_NONE\` instead.\\")
              genresConnection_SINGLE: MovieGenresConnectionWhere
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
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort], where: GenreWhere): GenresConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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
              OR: [RelPropertiesWhere!]
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
              id_IN: [ID!]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID!]
              id_NOT_STARTS_WITH: ID
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
