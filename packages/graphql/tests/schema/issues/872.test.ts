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

describe("https://github.com/neo4j/graphql/issues/872", () => {
    test("a single type should be created for multiple actorOnCreate", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                id: ID! @id
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor2 {
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

            type Actor2 {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): Actor2MovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [Actor2MoviesConnectionSort!], where: Actor2MoviesConnectionWhere): Actor2MoviesConnection!
              name: String!
            }

            type Actor2AggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input Actor2ConnectInput {
              movies: [Actor2MoviesConnectFieldInput!]
            }

            input Actor2ConnectOrCreateInput {
              movies: [Actor2MoviesConnectOrCreateFieldInput!]
            }

            input Actor2CreateInput {
              movies: Actor2MoviesFieldInput
              name: String!
            }

            input Actor2DeleteInput {
              movies: [Actor2MoviesDeleteFieldInput!]
            }

            input Actor2DisconnectInput {
              movies: [Actor2MoviesDisconnectFieldInput!]
            }

            type Actor2Edge {
              cursor: String!
              node: Actor2!
            }

            type Actor2MovieMoviesAggregationSelection {
              count: Int!
              node: Actor2MovieMoviesNodeAggregateSelection
            }

            type Actor2MovieMoviesNodeAggregateSelection {
              id: IDAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input Actor2MoviesAggregateInput {
              AND: [Actor2MoviesAggregateInput!]
              OR: [Actor2MoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: Actor2MoviesNodeAggregationWhereInput
            }

            input Actor2MoviesConnectFieldInput {
              where: MovieConnectWhere
            }

            input Actor2MoviesConnectOrCreateFieldInput {
              onCreate: Actor2MoviesConnectOrCreateFieldInputOnCreate!
              where: MovieConnectOrCreateWhere!
            }

            input Actor2MoviesConnectOrCreateFieldInputOnCreate {
              node: MovieOnCreateInput!
            }

            type Actor2MoviesConnection {
              edges: [Actor2MoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Actor2MoviesConnectionSort {
              node: MovieSort
            }

            input Actor2MoviesConnectionWhere {
              AND: [Actor2MoviesConnectionWhere!]
              OR: [Actor2MoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere
            }

            input Actor2MoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input Actor2MoviesDeleteFieldInput {
              where: Actor2MoviesConnectionWhere
            }

            input Actor2MoviesDisconnectFieldInput {
              where: Actor2MoviesConnectionWhere
            }

            input Actor2MoviesFieldInput {
              connect: [Actor2MoviesConnectFieldInput!]
              connectOrCreate: [Actor2MoviesConnectOrCreateFieldInput!]
              create: [Actor2MoviesCreateFieldInput!]
            }

            input Actor2MoviesNodeAggregationWhereInput {
              AND: [Actor2MoviesNodeAggregationWhereInput!]
              OR: [Actor2MoviesNodeAggregationWhereInput!]
              id_EQUAL: ID
              title_AVERAGE_EQUAL: Float
              title_AVERAGE_GT: Float
              title_AVERAGE_GTE: Float
              title_AVERAGE_LT: Float
              title_AVERAGE_LTE: Float
              title_EQUAL: String
              title_GT: Int
              title_GTE: Int
              title_LONGEST_EQUAL: Int
              title_LONGEST_GT: Int
              title_LONGEST_GTE: Int
              title_LONGEST_LT: Int
              title_LONGEST_LTE: Int
              title_LT: Int
              title_LTE: Int
              title_SHORTEST_EQUAL: Int
              title_SHORTEST_GT: Int
              title_SHORTEST_GTE: Int
              title_SHORTEST_LT: Int
              title_SHORTEST_LTE: Int
            }

            type Actor2MoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input Actor2MoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input Actor2MoviesUpdateFieldInput {
              connect: [Actor2MoviesConnectFieldInput!]
              connectOrCreate: [Actor2MoviesConnectOrCreateFieldInput!]
              create: [Actor2MoviesCreateFieldInput!]
              delete: [Actor2MoviesDeleteFieldInput!]
              disconnect: [Actor2MoviesDisconnectFieldInput!]
              update: Actor2MoviesUpdateConnectionInput
              where: Actor2MoviesConnectionWhere
            }

            input Actor2Options {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more Actor2Sort objects to sort Actor2s by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [Actor2Sort!]
            }

            input Actor2RelationInput {
              movies: [Actor2MoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actor2s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Actor2Sort object.
            \\"\\"\\"
            input Actor2Sort {
              name: SortDirection
            }

            input Actor2UpdateInput {
              movies: [Actor2MoviesUpdateFieldInput!]
              name: String
            }

            input Actor2Where {
              AND: [Actor2Where!]
              OR: [Actor2Where!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: Actor2MoviesAggregateInput
              moviesConnection: Actor2MoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              moviesConnection_ALL: Actor2MoviesConnectionWhere
              moviesConnection_NONE: Actor2MoviesConnectionWhere
              moviesConnection_NOT: Actor2MoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              moviesConnection_SINGLE: Actor2MoviesConnectionWhere
              moviesConnection_SOME: Actor2MoviesConnectionWhere
              \\"\\"\\"Return Actor2s where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Actor2s where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Actor2s where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Actor2s where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String
              name_NOT_CONTAINS: String
              name_NOT_ENDS_WITH: String
              name_NOT_IN: [String!]
              name_NOT_STARTS_WITH: String
              name_STARTS_WITH: String
            }

            type Actor2sConnection {
              edges: [Actor2Edge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              id: IDAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              OR: [ActorMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
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
              OR: [ActorMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere
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
              OR: [ActorMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID
              title_AVERAGE_EQUAL: Float
              title_AVERAGE_GT: Float
              title_AVERAGE_GTE: Float
              title_AVERAGE_LT: Float
              title_AVERAGE_LTE: Float
              title_EQUAL: String
              title_GT: Int
              title_GTE: Int
              title_LONGEST_EQUAL: Int
              title_LONGEST_GT: Int
              title_LONGEST_GTE: Int
              title_LONGEST_LT: Int
              title_LONGEST_LTE: Int
              title_LT: Int
              title_LTE: Int
              title_SHORTEST_EQUAL: Int
              title_SHORTEST_GT: Int
              title_SHORTEST_GTE: Int
              title_SHORTEST_LT: Int
              title_SHORTEST_LTE: Int
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
              OR: [ActorWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: ActorMoviesAggregateInput
              moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              moviesConnection_ALL: ActorMoviesConnectionWhere
              moviesConnection_NONE: ActorMoviesConnectionWhere
              moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              moviesConnection_SINGLE: ActorMoviesConnectionWhere
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
              name_NOT: String
              name_NOT_CONTAINS: String
              name_NOT_ENDS_WITH: String
              name_NOT_IN: [String!]
              name_NOT_STARTS_WITH: String
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActor2sMutationResponse {
              actor2s: [Actor2!]!
              info: CreateInfo!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
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

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type Movie {
              id: ID!
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectOrCreateWhere {
              node: MovieUniqueWhere!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOnCreateInput {
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
              id: SortDirection
              title: SortDirection
            }

            input MovieUniqueWhere {
              id: ID
            }

            input MovieUpdateInput {
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
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
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String!]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActor2s(input: [Actor2CreateInput!]!): CreateActor2sMutationResponse!
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActor2s(delete: Actor2DeleteInput, where: Actor2Where): DeleteInfo!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActor2s(connect: Actor2ConnectInput, connectOrCreate: Actor2ConnectOrCreateInput, create: Actor2RelationInput, delete: Actor2DeleteInput, disconnect: Actor2DisconnectInput, update: Actor2UpdateInput, where: Actor2Where): UpdateActor2sMutationResponse!
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
              actor2s(options: Actor2Options, where: Actor2Where): [Actor2!]!
              actor2sAggregate(where: Actor2Where): Actor2AggregateSelection!
              actor2sConnection(after: String, first: Int, sort: [Actor2Sort], where: Actor2Where): Actor2sConnection!
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

            type UpdateActor2sMutationResponse {
              actor2s: [Actor2!]!
              info: UpdateInfo!
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
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
