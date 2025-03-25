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
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

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
                features: {
                    subscriptions: new TestCDCEngine(),
                },
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
                features: {
                    subscriptions: new TestCDCEngine(),
                },
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
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: MovieWhere): ActorMovieMoviesAggregationSelection @deprecated(reason: \\"Please use field \\\\\\"aggregate\\\\\\" inside \\\\\\"moviesConnection\\\\\\" instead\\")
                      moviesConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
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

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
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
                      count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      count_EQ: Int
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
                      overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
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
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use field \\\\\\"where\\\\\\" inside \\\\\\"ActorMoviesUpdateConnectionInput\\\\\\" instead\\")
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_EQ: String
                      password_IN: [String!]
                      password_STARTS_WITH: String
                      username: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_EQ: String
                      username_IN: [String!]
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String @deprecated(reason: \\"Please use the explicit _SET field\\")
                      password_SET: String
                      username: String @deprecated(reason: \\"Please use the explicit _SET field\\")
                      username_SET: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      moviesAggregate: ActorMoviesAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
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
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_EQ: String
                      password_IN: [String!]
                      password_STARTS_WITH: String
                      username: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_EQ: String
                      username_IN: [String!]
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: ActorWhere): MovieActorActorsAggregationSelection @deprecated(reason: \\"Please use field \\\\\\"aggregate\\\\\\" inside \\\\\\"actorsConnection\\\\\\" instead\\")
                      actorsConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
                      node: MovieActorActorsNodeAggregateSelection
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
                      count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      count_EQ: Int
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
                      overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
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
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere @deprecated(reason: \\"Please use field \\\\\\"where\\\\\\" inside \\\\\\"MovieActorsUpdateConnectionInput\\\\\\" instead\\")
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
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

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
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
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_EQ: String
                      title_IN: [String]
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String @deprecated(reason: \\"Please use the explicit _SET field\\")
                      title_SET: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actorsAggregate: MovieActorsAggregateInput
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
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
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                      title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_EQ: String
                      title_IN: [String]
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                      actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection! @deprecated(reason: \\"Please use the explicit field \\\\\\"aggregate\\\\\\" inside \\\\\\"actorsConnection\\\\\\" instead\\")
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection! @deprecated(reason: \\"Please use the explicit field \\\\\\"aggregate\\\\\\" inside \\\\\\"moviesConnection\\\\\\" instead\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
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
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: MovieWhere): ActorMovieMoviesAggregationSelection @deprecated(reason: \\"Please use field \\\\\\"aggregate\\\\\\" inside \\\\\\"moviesConnection\\\\\\" instead\\")
                      moviesConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
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

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
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
                      count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      count_EQ: Int
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
                      overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use field \\\\\\"where\\\\\\" inside \\\\\\"ActorMoviesUpdateConnectionInput\\\\\\" instead\\")
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_EQ: String
                      password_IN: [String!]
                      password_STARTS_WITH: String
                      username: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_EQ: String
                      username_IN: [String!]
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String @deprecated(reason: \\"Please use the explicit _SET field\\")
                      password_SET: String
                      username: String @deprecated(reason: \\"Please use the explicit _SET field\\")
                      username_SET: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      moviesAggregate: ActorMoviesAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
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
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_EQ: String
                      password_IN: [String!]
                      password_STARTS_WITH: String
                      username: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_EQ: String
                      username_IN: [String!]
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: ActorWhere): MovieActorActorsAggregationSelection @deprecated(reason: \\"Please use field \\\\\\"aggregate\\\\\\" inside \\\\\\"actorsConnection\\\\\\" instead\\")
                      actorsConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
                      node: MovieActorActorsNodeAggregateSelection
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
                      count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      count_EQ: Int
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
                      overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
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
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere @deprecated(reason: \\"Please use field \\\\\\"where\\\\\\" inside \\\\\\"MovieActorsUpdateConnectionInput\\\\\\" instead\\")
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
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

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_EQ: String
                      title_IN: [String]
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String @deprecated(reason: \\"Please use the explicit _SET field\\")
                      title_SET: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actorsAggregate: MovieActorsAggregateInput
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
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
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                      title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_EQ: String
                      title_IN: [String]
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                      actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection! @deprecated(reason: \\"Please use the explicit field \\\\\\"aggregate\\\\\\" inside \\\\\\"actorsConnection\\\\\\" instead\\")
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection! @deprecated(reason: \\"Please use the explicit field \\\\\\"aggregate\\\\\\" inside \\\\\\"moviesConnection\\\\\\" instead\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
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
});
