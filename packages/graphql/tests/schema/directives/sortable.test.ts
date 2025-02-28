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
import type { GraphQLInputObjectType } from "graphql";
import { lexicographicSortSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";

describe("@sortable directive", () => {
    describe("on SCALAR", () => {
        test("default arguments should enable sorting by value", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String @sortable
                    runtime: Int
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            const schema = await neoSchema.getSchema();
            const movieSortType = schema.getType("MovieSort") as GraphQLInputObjectType;

            expect(movieSortType).toBeDefined();

            const movieSortFields = movieSortType.getFields();

            const title = movieSortFields["title"];

            expect(title).toBeDefined();

            const runtime = movieSortFields["runtime"];

            expect(runtime).toBeDefined();
        });

        test("disable sorting by value", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String @sortable(byValue: false)
                    runtime: Int
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            const schema = await neoSchema.getSchema();
            const movieSortType = schema.getType("MovieSort") as GraphQLInputObjectType;

            expect(movieSortType).toBeDefined();

            const movieSortFields = movieSortType.getFields();

            const title = movieSortFields["title"];

            expect(title).toBeUndefined();

            const runtime = movieSortFields["runtime"];

            expect(runtime).toBeDefined();
        });
    });

    describe("snapshot tests", () => {
        describe("on SCALAR", () => {
            test("default arguments should enable sorting by value", async () => {
                const typeDefs = gql`
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @sortable
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
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
                      title: StringAggregateSelection!
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
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
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
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
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
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
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

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
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

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsAggregate: MovieActorsAggregateInput
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
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
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
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
                      actors: [Actor!]!
                      info: UpdateInfo!
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

            test("disable sorting by value", async () => {
                const typeDefs = gql`
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @sortable(byValue: false)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
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
                      title: StringAggregateSelection!
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
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
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
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
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
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
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

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsAggregate: MovieActorsAggregateInput
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
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
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
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
                      moviesConnection(after: String, first: Int, where: MovieWhere): MoviesConnection!
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
                      actors: [Actor!]!
                      info: UpdateInfo!
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
    });
});
