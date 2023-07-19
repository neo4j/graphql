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

describe("Connect Or Create", () => {
    test("Connect Or Create", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                isan: String! @unique
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectOrCreateInput {
              movies: [ActorMoviesConnectOrCreateFieldInput!]
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
              name: String!
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              movies: [ActorMoviesDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregationSelection {
              count: Int!
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesNodeAggregateSelection {
              isan: StringAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            input ActorMoviesConnectOrCreateFieldInput {
              onCreate: ActorMoviesConnectOrCreateFieldInputOnCreate!
              where: MovieConnectOrCreateWhere!
            }

            input ActorMoviesConnectOrCreateFieldInputOnCreate {
              node: MovieOnCreateInput!
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionSort {
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input ActorMoviesDeleteFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesDisconnectFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              connectOrCreate: [ActorMoviesConnectOrCreateFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
            }

            input ActorMoviesNodeAggregationWhereInput {
              AND: [ActorMoviesNodeAggregationWhereInput!]
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
              isan_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_LENGTH_EQUAL: Float
              isan_AVERAGE_LENGTH_GT: Float
              isan_AVERAGE_LENGTH_GTE: Float
              isan_AVERAGE_LENGTH_LT: Float
              isan_AVERAGE_LENGTH_LTE: Float
              isan_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_LENGTH_EQUAL: Int
              isan_LONGEST_LENGTH_GT: Int
              isan_LONGEST_LENGTH_GTE: Int
              isan_LONGEST_LENGTH_LT: Int
              isan_LONGEST_LENGTH_LTE: Int
              isan_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_LENGTH_EQUAL: Int
              isan_SHORTEST_LENGTH_GT: Int
              isan_SHORTEST_LENGTH_GTE: Int
              isan_SHORTEST_LENGTH_LT: Int
              isan_SHORTEST_LENGTH_LTE: Int
              isan_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
              title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input ActorMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              connectOrCreate: [ActorMoviesConnectOrCreateFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
              where: ActorMoviesConnectionWhere
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            input ActorRelationInput {
              movies: [ActorMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: ActorMoviesAggregateInput
              moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere
              moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
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

            type Movie {
              isan: String!
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              isan: StringAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectOrCreateWhere {
              node: MovieUniqueWhere!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              isan: String!
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOnCreateInput {
              isan: String!
              title: String!
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
              isan: SortDirection
              title: SortDirection
            }

            input MovieUniqueWhere {
              isan: String
            }

            input MovieUpdateInput {
              isan: String
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              isan: String
              isan_CONTAINS: String
              isan_ENDS_WITH: String
              isan_IN: [String!]
              isan_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_STARTS_WITH: String
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, connectOrCreate: ActorConnectOrCreateInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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

    test("Connect Or Create with relation properties", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                isan: String! @unique
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            interface ActedIn @relationshipProperties {
                screentime: Int!
                characterName: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            interface ActedIn {
              characterName: String
              screentime: Int!
            }

            input ActedInCreateInput {
              characterName: String
              screentime: Int!
            }

            input ActedInSort {
              characterName: SortDirection
              screentime: SortDirection
            }

            input ActedInUpdateInput {
              characterName: String
              screentime: Int
              screentime_DECREMENT: Int
              screentime_INCREMENT: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              characterName: String
              characterName_CONTAINS: String
              characterName_ENDS_WITH: String
              characterName_IN: [String]
              characterName_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              characterName_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              characterName_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              characterName_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              characterName_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              characterName_STARTS_WITH: String
              screentime: Int
              screentime_GT: Int
              screentime_GTE: Int
              screentime_IN: [Int!]
              screentime_LT: Int
              screentime_LTE: Int
              screentime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              screentime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type Actor {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectOrCreateInput {
              movies: [ActorMoviesConnectOrCreateFieldInput!]
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
              name: String!
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              movies: [ActorMoviesDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregationSelection {
              count: Int!
              edge: ActorMovieMoviesEdgeAggregateSelection
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesEdgeAggregateSelection {
              characterName: StringAggregateSelectionNullable!
              screentime: IntAggregateSelectionNonNullable!
            }

            type ActorMovieMoviesNodeAggregateSelection {
              isan: StringAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActorMoviesEdgeAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            input ActorMoviesConnectOrCreateFieldInput {
              onCreate: ActorMoviesConnectOrCreateFieldInputOnCreate!
              where: MovieConnectOrCreateWhere!
            }

            input ActorMoviesConnectOrCreateFieldInputOnCreate {
              edge: ActedInCreateInput!
              node: MovieOnCreateInput!
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionSort {
              edge: ActedInSort
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorMoviesCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input ActorMoviesDeleteFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesDisconnectFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesEdgeAggregationWhereInput {
              AND: [ActorMoviesEdgeAggregationWhereInput!]
              NOT: ActorMoviesEdgeAggregationWhereInput
              OR: [ActorMoviesEdgeAggregationWhereInput!]
              characterName_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_AVERAGE_LENGTH_EQUAL: Float
              characterName_AVERAGE_LENGTH_GT: Float
              characterName_AVERAGE_LENGTH_GTE: Float
              characterName_AVERAGE_LENGTH_LT: Float
              characterName_AVERAGE_LENGTH_LTE: Float
              characterName_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              characterName_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              characterName_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              characterName_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_LONGEST_LENGTH_EQUAL: Int
              characterName_LONGEST_LENGTH_GT: Int
              characterName_LONGEST_LENGTH_GTE: Int
              characterName_LONGEST_LENGTH_LT: Int
              characterName_LONGEST_LENGTH_LTE: Int
              characterName_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              characterName_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              characterName_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_SHORTEST_LENGTH_EQUAL: Int
              characterName_SHORTEST_LENGTH_GT: Int
              characterName_SHORTEST_LENGTH_GTE: Int
              characterName_SHORTEST_LENGTH_LT: Int
              characterName_SHORTEST_LENGTH_LTE: Int
              characterName_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              characterName_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              screentime_AVERAGE_EQUAL: Float
              screentime_AVERAGE_GT: Float
              screentime_AVERAGE_GTE: Float
              screentime_AVERAGE_LT: Float
              screentime_AVERAGE_LTE: Float
              screentime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screentime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screentime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screentime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screentime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screentime_MAX_EQUAL: Int
              screentime_MAX_GT: Int
              screentime_MAX_GTE: Int
              screentime_MAX_LT: Int
              screentime_MAX_LTE: Int
              screentime_MIN_EQUAL: Int
              screentime_MIN_GT: Int
              screentime_MIN_GTE: Int
              screentime_MIN_LT: Int
              screentime_MIN_LTE: Int
              screentime_SUM_EQUAL: Int
              screentime_SUM_GT: Int
              screentime_SUM_GTE: Int
              screentime_SUM_LT: Int
              screentime_SUM_LTE: Int
            }

            input ActorMoviesFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              connectOrCreate: [ActorMoviesConnectOrCreateFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
            }

            input ActorMoviesNodeAggregationWhereInput {
              AND: [ActorMoviesNodeAggregationWhereInput!]
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
              isan_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_LENGTH_EQUAL: Float
              isan_AVERAGE_LENGTH_GT: Float
              isan_AVERAGE_LENGTH_GTE: Float
              isan_AVERAGE_LENGTH_LT: Float
              isan_AVERAGE_LENGTH_LTE: Float
              isan_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_LENGTH_EQUAL: Int
              isan_LONGEST_LENGTH_GT: Int
              isan_LONGEST_LENGTH_GTE: Int
              isan_LONGEST_LENGTH_LT: Int
              isan_LONGEST_LENGTH_LTE: Int
              isan_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              isan_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_LENGTH_EQUAL: Int
              isan_SHORTEST_LENGTH_GT: Int
              isan_SHORTEST_LENGTH_GTE: Int
              isan_SHORTEST_LENGTH_LT: Int
              isan_SHORTEST_LENGTH_LTE: Int
              isan_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              isan_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
              title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type ActorMoviesRelationship implements ActedIn {
              characterName: String
              cursor: String!
              node: Movie!
              screentime: Int!
            }

            input ActorMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              connectOrCreate: [ActorMoviesConnectOrCreateFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
              where: ActorMoviesConnectionWhere
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            input ActorRelationInput {
              movies: [ActorMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: ActorMoviesAggregateInput
              moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere
              moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
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

            type IntAggregateSelectionNonNullable {
              average: Float!
              max: Int!
              min: Int!
              sum: Int!
            }

            type Movie {
              isan: String!
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              isan: StringAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectOrCreateWhere {
              node: MovieUniqueWhere!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              isan: String!
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOnCreateInput {
              isan: String!
              title: String!
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
              isan: SortDirection
              title: SortDirection
            }

            input MovieUniqueWhere {
              isan: String
            }

            input MovieUpdateInput {
              isan: String
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              isan: String
              isan_CONTAINS: String
              isan_ENDS_WITH: String
              isan_IN: [String!]
              isan_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              isan_STARTS_WITH: String
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, connectOrCreate: ActorConnectOrCreateInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
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

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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
