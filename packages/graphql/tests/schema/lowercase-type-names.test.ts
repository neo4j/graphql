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

describe("lower case type names", () => {
    test("should generate a valid schema", async () => {
        const typeDefs = gql`
            type movie @node {
                name: String
                year: Int
                createdAt: DateTime
                testId: String
                actors: [actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type actor @node {
                name: String
                year: Int
                createdAt: DateTime
                movies: [movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type ActorsConnection {
              edges: [actorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [actor!]!
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
              movies: [movie!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelection {
              max: DateTime
              min: DateTime
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type MoviesConnection {
              edges: [movieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [actorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [movieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: actorDeleteInput, where: actorWhere): DeleteInfo!
              deleteMovies(delete: movieDeleteInput, where: movieWhere): DeleteInfo!
              updateActors(update: actorUpdateInput, where: actorWhere): UpdateActorsMutationResponse!
              updateMovies(update: movieUpdateInput, where: movieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              actors(limit: Int, offset: Int, options: actorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [actorSort!], where: actorWhere): [actor!]!
              actorsAggregate(where: actorWhere): actorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [actorSort!], where: actorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, options: movieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [movieSort!], where: movieWhere): [movie!]!
              moviesAggregate(where: movieWhere): movieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [movieSort!], where: movieWhere): MoviesConnection!
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

            type UpdateActorsMutationResponse {
              actors: [actor!]!
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
              movies: [movie!]!
            }

            type actor {
              createdAt: DateTime
              movies(directed: Boolean = true, limit: Int, offset: Int, options: movieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [movieSort!], where: movieWhere): [movie!]!
              moviesAggregate(directed: Boolean = true, where: movieWhere): actormovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [actorMoviesConnectionSort!], where: actorMoviesConnectionWhere): actorMoviesConnection!
              name: String
              year: Int
            }

            type actorAggregateSelection {
              count: Int!
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            input actorConnectInput {
              movies: [actorMoviesConnectFieldInput!]
            }

            input actorConnectWhere {
              node: actorWhere!
            }

            input actorCreateInput {
              createdAt: DateTime
              movies: actorMoviesFieldInput
              name: String
              year: Int
            }

            input actorDeleteInput {
              movies: [actorMoviesDeleteFieldInput!]
            }

            input actorDisconnectInput {
              movies: [actorMoviesDisconnectFieldInput!]
            }

            type actorEdge {
              cursor: String!
              node: actor!
            }

            input actorMoviesAggregateInput {
              AND: [actorMoviesAggregateInput!]
              NOT: actorMoviesAggregateInput
              OR: [actorMoviesAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: actorMoviesNodeAggregationWhereInput
            }

            input actorMoviesConnectFieldInput {
              connect: [movieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: movieConnectWhere
            }

            type actorMoviesConnection {
              edges: [actorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input actorMoviesConnectionSort {
              node: movieSort
            }

            input actorMoviesConnectionWhere {
              AND: [actorMoviesConnectionWhere!]
              NOT: actorMoviesConnectionWhere
              OR: [actorMoviesConnectionWhere!]
              node: movieWhere
            }

            input actorMoviesCreateFieldInput {
              node: movieCreateInput!
            }

            input actorMoviesDeleteFieldInput {
              delete: movieDeleteInput
              where: actorMoviesConnectionWhere
            }

            input actorMoviesDisconnectFieldInput {
              disconnect: movieDisconnectInput
              where: actorMoviesConnectionWhere
            }

            input actorMoviesFieldInput {
              connect: [actorMoviesConnectFieldInput!]
              create: [actorMoviesCreateFieldInput!]
            }

            input actorMoviesNodeAggregationWhereInput {
              AND: [actorMoviesNodeAggregationWhereInput!]
              NOT: actorMoviesNodeAggregationWhereInput
              OR: [actorMoviesNodeAggregationWhereInput!]
              createdAt_MAX_EQUAL: DateTime
              createdAt_MAX_GT: DateTime
              createdAt_MAX_GTE: DateTime
              createdAt_MAX_LT: DateTime
              createdAt_MAX_LTE: DateTime
              createdAt_MIN_EQUAL: DateTime
              createdAt_MIN_GT: DateTime
              createdAt_MIN_GTE: DateTime
              createdAt_MIN_LT: DateTime
              createdAt_MIN_LTE: DateTime
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              testId_AVERAGE_LENGTH_EQUAL: Float
              testId_AVERAGE_LENGTH_GT: Float
              testId_AVERAGE_LENGTH_GTE: Float
              testId_AVERAGE_LENGTH_LT: Float
              testId_AVERAGE_LENGTH_LTE: Float
              testId_LONGEST_LENGTH_EQUAL: Int
              testId_LONGEST_LENGTH_GT: Int
              testId_LONGEST_LENGTH_GTE: Int
              testId_LONGEST_LENGTH_LT: Int
              testId_LONGEST_LENGTH_LTE: Int
              testId_SHORTEST_LENGTH_EQUAL: Int
              testId_SHORTEST_LENGTH_GT: Int
              testId_SHORTEST_LENGTH_GTE: Int
              testId_SHORTEST_LENGTH_LT: Int
              testId_SHORTEST_LENGTH_LTE: Int
              year_AVERAGE_EQUAL: Float
              year_AVERAGE_GT: Float
              year_AVERAGE_GTE: Float
              year_AVERAGE_LT: Float
              year_AVERAGE_LTE: Float
              year_MAX_EQUAL: Int
              year_MAX_GT: Int
              year_MAX_GTE: Int
              year_MAX_LT: Int
              year_MAX_LTE: Int
              year_MIN_EQUAL: Int
              year_MIN_GT: Int
              year_MIN_GTE: Int
              year_MIN_LT: Int
              year_MIN_LTE: Int
              year_SUM_EQUAL: Int
              year_SUM_GT: Int
              year_SUM_GTE: Int
              year_SUM_LT: Int
              year_SUM_LTE: Int
            }

            type actorMoviesRelationship {
              cursor: String!
              node: movie!
            }

            input actorMoviesUpdateConnectionInput {
              node: movieUpdateInput
            }

            input actorMoviesUpdateFieldInput {
              connect: [actorMoviesConnectFieldInput!]
              create: [actorMoviesCreateFieldInput!]
              delete: [actorMoviesDeleteFieldInput!]
              disconnect: [actorMoviesDisconnectFieldInput!]
              update: actorMoviesUpdateConnectionInput
              where: actorMoviesConnectionWhere
            }

            input actorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more actorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [actorSort!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one actorSort object.
            \\"\\"\\"
            input actorSort {
              createdAt: SortDirection
              name: SortDirection
              year: SortDirection
            }

            input actorUpdateInput {
              createdAt: DateTime
              movies: [actorMoviesUpdateFieldInput!]
              name: String
              year: Int
              year_DECREMENT: Int
              year_INCREMENT: Int
            }

            input actorWhere {
              AND: [actorWhere!]
              NOT: actorWhere
              OR: [actorWhere!]
              createdAt: DateTime @deprecated(reason: \\"Please use the explicit _EQ version\\")
              createdAt_EQ: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              moviesAggregate: actorMoviesAggregateInput
              \\"\\"\\"
              Return actors where all of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: actorMoviesConnectionWhere
              \\"\\"\\"
              Return actors where none of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: actorMoviesConnectionWhere
              \\"\\"\\"
              Return actors where one of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: actorMoviesConnectionWhere
              \\"\\"\\"
              Return actors where some of the related actorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: actorMoviesConnectionWhere
              \\"\\"\\"Return actors where all of the related movies match this filter\\"\\"\\"
              movies_ALL: movieWhere
              \\"\\"\\"Return actors where none of the related movies match this filter\\"\\"\\"
              movies_NONE: movieWhere
              \\"\\"\\"Return actors where one of the related movies match this filter\\"\\"\\"
              movies_SINGLE: movieWhere
              \\"\\"\\"Return actors where some of the related movies match this filter\\"\\"\\"
              movies_SOME: movieWhere
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
              year: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              year_EQ: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int]
              year_LT: Int
              year_LTE: Int
            }

            type actormovieMoviesAggregationSelection {
              count: Int!
              node: actormovieMoviesNodeAggregateSelection
            }

            type actormovieMoviesNodeAggregateSelection {
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              testId: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            type movie {
              actors(directed: Boolean = true, limit: Int, offset: Int, options: actorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [actorSort!], where: actorWhere): [actor!]!
              actorsAggregate(directed: Boolean = true, where: actorWhere): movieactorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [movieActorsConnectionSort!], where: movieActorsConnectionWhere): movieActorsConnection!
              createdAt: DateTime
              name: String
              testId: String
              year: Int
            }

            input movieActorsAggregateInput {
              AND: [movieActorsAggregateInput!]
              NOT: movieActorsAggregateInput
              OR: [movieActorsAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: movieActorsNodeAggregationWhereInput
            }

            input movieActorsConnectFieldInput {
              connect: [actorConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: actorConnectWhere
            }

            type movieActorsConnection {
              edges: [movieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input movieActorsConnectionSort {
              node: actorSort
            }

            input movieActorsConnectionWhere {
              AND: [movieActorsConnectionWhere!]
              NOT: movieActorsConnectionWhere
              OR: [movieActorsConnectionWhere!]
              node: actorWhere
            }

            input movieActorsCreateFieldInput {
              node: actorCreateInput!
            }

            input movieActorsDeleteFieldInput {
              delete: actorDeleteInput
              where: movieActorsConnectionWhere
            }

            input movieActorsDisconnectFieldInput {
              disconnect: actorDisconnectInput
              where: movieActorsConnectionWhere
            }

            input movieActorsFieldInput {
              connect: [movieActorsConnectFieldInput!]
              create: [movieActorsCreateFieldInput!]
            }

            input movieActorsNodeAggregationWhereInput {
              AND: [movieActorsNodeAggregationWhereInput!]
              NOT: movieActorsNodeAggregationWhereInput
              OR: [movieActorsNodeAggregationWhereInput!]
              createdAt_MAX_EQUAL: DateTime
              createdAt_MAX_GT: DateTime
              createdAt_MAX_GTE: DateTime
              createdAt_MAX_LT: DateTime
              createdAt_MAX_LTE: DateTime
              createdAt_MIN_EQUAL: DateTime
              createdAt_MIN_GT: DateTime
              createdAt_MIN_GTE: DateTime
              createdAt_MIN_LT: DateTime
              createdAt_MIN_LTE: DateTime
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              year_AVERAGE_EQUAL: Float
              year_AVERAGE_GT: Float
              year_AVERAGE_GTE: Float
              year_AVERAGE_LT: Float
              year_AVERAGE_LTE: Float
              year_MAX_EQUAL: Int
              year_MAX_GT: Int
              year_MAX_GTE: Int
              year_MAX_LT: Int
              year_MAX_LTE: Int
              year_MIN_EQUAL: Int
              year_MIN_GT: Int
              year_MIN_GTE: Int
              year_MIN_LT: Int
              year_MIN_LTE: Int
              year_SUM_EQUAL: Int
              year_SUM_GT: Int
              year_SUM_GTE: Int
              year_SUM_LT: Int
              year_SUM_LTE: Int
            }

            type movieActorsRelationship {
              cursor: String!
              node: actor!
            }

            input movieActorsUpdateConnectionInput {
              node: actorUpdateInput
            }

            input movieActorsUpdateFieldInput {
              connect: [movieActorsConnectFieldInput!]
              create: [movieActorsCreateFieldInput!]
              delete: [movieActorsDeleteFieldInput!]
              disconnect: [movieActorsDisconnectFieldInput!]
              update: movieActorsUpdateConnectionInput
              where: movieActorsConnectionWhere
            }

            type movieAggregateSelection {
              count: Int!
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              testId: StringAggregateSelection!
              year: IntAggregateSelection!
            }

            input movieConnectInput {
              actors: [movieActorsConnectFieldInput!]
            }

            input movieConnectWhere {
              node: movieWhere!
            }

            input movieCreateInput {
              actors: movieActorsFieldInput
              createdAt: DateTime
              name: String
              testId: String
              year: Int
            }

            input movieDeleteInput {
              actors: [movieActorsDeleteFieldInput!]
            }

            input movieDisconnectInput {
              actors: [movieActorsDisconnectFieldInput!]
            }

            type movieEdge {
              cursor: String!
              node: movie!
            }

            input movieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more movieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [movieSort!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one movieSort object.
            \\"\\"\\"
            input movieSort {
              createdAt: SortDirection
              name: SortDirection
              testId: SortDirection
              year: SortDirection
            }

            input movieUpdateInput {
              actors: [movieActorsUpdateFieldInput!]
              createdAt: DateTime
              name: String
              testId: String
              year: Int
              year_DECREMENT: Int
              year_INCREMENT: Int
            }

            input movieWhere {
              AND: [movieWhere!]
              NOT: movieWhere
              OR: [movieWhere!]
              actorsAggregate: movieActorsAggregateInput
              \\"\\"\\"
              Return movies where all of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: movieActorsConnectionWhere
              \\"\\"\\"
              Return movies where none of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: movieActorsConnectionWhere
              \\"\\"\\"
              Return movies where one of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: movieActorsConnectionWhere
              \\"\\"\\"
              Return movies where some of the related movieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: movieActorsConnectionWhere
              \\"\\"\\"Return movies where all of the related actors match this filter\\"\\"\\"
              actors_ALL: actorWhere
              \\"\\"\\"Return movies where none of the related actors match this filter\\"\\"\\"
              actors_NONE: actorWhere
              \\"\\"\\"Return movies where one of the related actors match this filter\\"\\"\\"
              actors_SINGLE: actorWhere
              \\"\\"\\"Return movies where some of the related actors match this filter\\"\\"\\"
              actors_SOME: actorWhere
              createdAt: DateTime @deprecated(reason: \\"Please use the explicit _EQ version\\")
              createdAt_EQ: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
              testId: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              testId_CONTAINS: String
              testId_ENDS_WITH: String
              testId_EQ: String
              testId_IN: [String]
              testId_STARTS_WITH: String
              year: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              year_EQ: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int]
              year_LT: Int
              year_LTE: Int
            }

            type movieactorActorsAggregationSelection {
              count: Int!
              node: movieactorActorsNodeAggregateSelection
            }

            type movieactorActorsNodeAggregateSelection {
              createdAt: DateTimeAggregateSelection!
              name: StringAggregateSelection!
              year: IntAggregateSelection!
            }"
        `);
    });
});
