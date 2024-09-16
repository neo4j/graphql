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
import { TestSubscriptionsEngine } from "../utils/TestSubscriptionsEngine";

describe("Subscriptions", () => {
    let plugin: TestSubscriptionsEngine;

    beforeAll(() => {
        plugin = new TestSubscriptionsEngine();
    });

    test("Subscriptions", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type Actor {
              name: String!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              name: String!
            }

            type ActorCreatedEvent {
              createdActor: ActorEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type ActorDeletedEvent {
              deletedActor: ActorEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorEventPayload {
              name: String!
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
              name: SortDirection
            }

            input ActorSubscriptionWhere {
              AND: [ActorSubscriptionWhere!]
              NOT: ActorSubscriptionWhere
              OR: [ActorSubscriptionWhere!]
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

            input ActorUpdateInput {
              name: String
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

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              actorCount: Int
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
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
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type MovieActorsConnectedRelationship {
              node: ActorEventPayload!
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
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
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
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorsRelationshipSubscriptionWhere {
              node: ActorSubscriptionWhere
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            type MovieConnectedRelationships {
              actors: MovieActorsConnectedRelationship
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              averageRating: Float
              id: ID
              isActive: Boolean
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

            type MovieRelationshipCreatedEvent {
              createdRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipCreatedSubscriptionWhere {
              AND: [MovieRelationshipCreatedSubscriptionWhere!]
              NOT: MovieRelationshipCreatedSubscriptionWhere
              OR: [MovieRelationshipCreatedSubscriptionWhere!]
              createdRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            type MovieRelationshipDeletedEvent {
              deletedRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipDeletedSubscriptionWhere {
              AND: [MovieRelationshipDeletedSubscriptionWhere!]
              NOT: MovieRelationshipDeletedSubscriptionWhere
              OR: [MovieRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            input MovieRelationshipsSubscriptionWhere {
              actors: MovieActorsRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieUpdateInput {
              actorCount: Int
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: Float
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SUBTRACT: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

            type Subscription {
              actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
              actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
              actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
              movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
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

    test("Empty EventPayload type", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type Actor {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
            }

            type ActorAggregateSelection {
              count: Int!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            type ActorConnectedRelationships {
              movies: ActorMoviesConnectedRelationship
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
            }

            type ActorCreatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            type ActorDeletedEvent {
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

            type ActorMovieMoviesAggregationSelection {
              count: Int!
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              id: IDAggregateSelection!
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

            type ActorMoviesConnectedRelationship {
              node: MovieEventPayload!
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
              actorCount_AVERAGE_EQUAL: Float
              actorCount_AVERAGE_GT: Float
              actorCount_AVERAGE_GTE: Float
              actorCount_AVERAGE_LT: Float
              actorCount_AVERAGE_LTE: Float
              actorCount_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_MAX_EQUAL: Int
              actorCount_MAX_GT: Int
              actorCount_MAX_GTE: Int
              actorCount_MAX_LT: Int
              actorCount_MAX_LTE: Int
              actorCount_MIN_EQUAL: Int
              actorCount_MIN_GT: Int
              actorCount_MIN_GTE: Int
              actorCount_MIN_LT: Int
              actorCount_MIN_LTE: Int
              actorCount_SUM_EQUAL: Int
              actorCount_SUM_GT: Int
              actorCount_SUM_GTE: Int
              actorCount_SUM_LT: Int
              actorCount_SUM_LTE: Int
              averageRating_AVERAGE_EQUAL: Float
              averageRating_AVERAGE_GT: Float
              averageRating_AVERAGE_GTE: Float
              averageRating_AVERAGE_LT: Float
              averageRating_AVERAGE_LTE: Float
              averageRating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_MAX_EQUAL: Float
              averageRating_MAX_GT: Float
              averageRating_MAX_GTE: Float
              averageRating_MAX_LT: Float
              averageRating_MAX_LTE: Float
              averageRating_MIN_EQUAL: Float
              averageRating_MIN_GT: Float
              averageRating_MIN_GTE: Float
              averageRating_MIN_LT: Float
              averageRating_MIN_LTE: Float
              averageRating_SUM_EQUAL: Float
              averageRating_SUM_GT: Float
              averageRating_SUM_GTE: Float
              averageRating_SUM_LT: Float
              averageRating_SUM_LTE: Float
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input ActorMoviesRelationshipSubscriptionWhere {
              node: MovieSubscriptionWhere
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
            }

            input ActorRelationInput {
              movies: [ActorMoviesCreateFieldInput!]
            }

            type ActorRelationshipCreatedEvent {
              createdRelationship: ActorConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input ActorRelationshipCreatedSubscriptionWhere {
              AND: [ActorRelationshipCreatedSubscriptionWhere!]
              NOT: ActorRelationshipCreatedSubscriptionWhere
              OR: [ActorRelationshipCreatedSubscriptionWhere!]
              createdRelationship: ActorRelationshipsSubscriptionWhere
            }

            type ActorRelationshipDeletedEvent {
              deletedRelationship: ActorConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input ActorRelationshipDeletedSubscriptionWhere {
              AND: [ActorRelationshipDeletedSubscriptionWhere!]
              NOT: ActorRelationshipDeletedSubscriptionWhere
              OR: [ActorRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: ActorRelationshipsSubscriptionWhere
            }

            input ActorRelationshipsSubscriptionWhere {
              movies: ActorMoviesRelationshipSubscriptionWhere
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
            }

            type ActorUpdatedEvent {
              event: EventType!
              timestamp: Float!
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

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              actorCount: Int
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              averageRating: Float
              id: ID
              isActive: Boolean
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

            type MovieRelationshipCreatedEvent {
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipCreatedSubscriptionWhere {
              AND: [MovieRelationshipCreatedSubscriptionWhere!]
              NOT: MovieRelationshipCreatedSubscriptionWhere
              OR: [MovieRelationshipCreatedSubscriptionWhere!]
              movie: MovieSubscriptionWhere
            }

            type MovieRelationshipDeletedEvent {
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipDeletedSubscriptionWhere {
              AND: [MovieRelationshipDeletedSubscriptionWhere!]
              NOT: MovieRelationshipDeletedSubscriptionWhere
              OR: [MovieRelationshipDeletedSubscriptionWhere!]
              movie: MovieSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieUpdateInput {
              actorCount: Int
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: Float
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SUBTRACT: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, where: ActorWhere): ActorsConnection!
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

            type Subscription {
              actorCreated: ActorCreatedEvent!
              actorDeleted: ActorDeletedEvent!
              actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
              actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
              actorUpdated: ActorUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
              movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
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

    test("Empty EventPayload type on Union type", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Actor = Star | Person

            type Star {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Person {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            union Actor = Person | Star

            input ActorWhere {
              Person: PersonWhere
              Star: StarWhere
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

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
            }

            type CreateStarsMutationResponse {
              info: CreateInfo!
              stars: [Star!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              actorCount: Int
              actors(directed: Boolean = true, options: QueryOptions, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieActorsConnectInput {
              Person: [MovieActorsPersonConnectFieldInput!]
              Star: [MovieActorsStarConnectFieldInput!]
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionWhere {
              Person: MovieActorsPersonConnectionWhere
              Star: MovieActorsStarConnectionWhere
            }

            input MovieActorsCreateFieldInput {
              Person: [MovieActorsPersonCreateFieldInput!]
              Star: [MovieActorsStarCreateFieldInput!]
            }

            input MovieActorsCreateInput {
              Person: MovieActorsPersonFieldInput
              Star: MovieActorsStarFieldInput
            }

            input MovieActorsDeleteInput {
              Person: [MovieActorsPersonDeleteFieldInput!]
              Star: [MovieActorsStarDeleteFieldInput!]
            }

            input MovieActorsDisconnectInput {
              Person: [MovieActorsPersonDisconnectFieldInput!]
              Star: [MovieActorsStarDisconnectFieldInput!]
            }

            input MovieActorsPersonConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            input MovieActorsPersonConnectionWhere {
              AND: [MovieActorsPersonConnectionWhere!]
              NOT: MovieActorsPersonConnectionWhere
              OR: [MovieActorsPersonConnectionWhere!]
              node: PersonWhere
              node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieActorsPersonCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieActorsPersonDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
            }

            input MovieActorsPersonUpdateConnectionInput {
              node: PersonUpdateInput
            }

            input MovieActorsPersonUpdateFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
              delete: [MovieActorsPersonDeleteFieldInput!]
              disconnect: [MovieActorsPersonDisconnectFieldInput!]
              update: MovieActorsPersonUpdateConnectionInput
              where: MovieActorsPersonConnectionWhere
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorsStarConnectFieldInput {
              connect: [StarConnectInput!]
              where: StarConnectWhere
            }

            input MovieActorsStarConnectionWhere {
              AND: [MovieActorsStarConnectionWhere!]
              NOT: MovieActorsStarConnectionWhere
              OR: [MovieActorsStarConnectionWhere!]
              node: StarWhere
              node_NOT: StarWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieActorsStarCreateFieldInput {
              node: StarCreateInput!
            }

            input MovieActorsStarDeleteFieldInput {
              delete: StarDeleteInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarDisconnectFieldInput {
              disconnect: StarDisconnectInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
            }

            input MovieActorsStarUpdateConnectionInput {
              node: StarUpdateInput
            }

            input MovieActorsStarUpdateFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
              delete: [MovieActorsStarDeleteFieldInput!]
              disconnect: [MovieActorsStarDisconnectFieldInput!]
              update: MovieActorsStarUpdateConnectionInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsUpdateInput {
              Person: [MovieActorsPersonUpdateFieldInput!]
              Star: [MovieActorsStarUpdateFieldInput!]
            }

            type MovieAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieConnectInput {
              actors: MovieActorsConnectInput
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsCreateInput
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              actors: MovieActorsDeleteInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDisconnectInput {
              actors: MovieActorsDisconnectInput
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              actorCount: Int
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actors: MovieActorsCreateFieldInput
            }

            type MovieRelationshipCreatedEvent {
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipCreatedSubscriptionWhere {
              AND: [MovieRelationshipCreatedSubscriptionWhere!]
              NOT: MovieRelationshipCreatedSubscriptionWhere
              OR: [MovieRelationshipCreatedSubscriptionWhere!]
              movie: MovieSubscriptionWhere
            }

            type MovieRelationshipDeletedEvent {
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipDeletedSubscriptionWhere {
              AND: [MovieRelationshipDeletedSubscriptionWhere!]
              NOT: MovieRelationshipDeletedSubscriptionWhere
              OR: [MovieRelationshipDeletedSubscriptionWhere!]
              movie: MovieSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieUpdateInput {
              actorCount: Int
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actors: MovieActorsUpdateInput
              averageRating: Float
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SUBTRACT: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
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
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createStars(input: [StarCreateInput!]!): CreateStarsMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteStars(delete: StarDeleteInput, where: StarWhere): DeleteInfo!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(connect: PersonConnectInput, create: PersonRelationInput, delete: PersonDeleteInput, disconnect: PersonDisconnectInput, update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateStars(connect: StarConnectInput, create: StarRelationInput, delete: StarDeleteInput, disconnect: StarDisconnectInput, update: StarUpdateInput, where: StarWhere): UpdateStarsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): PersonMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [PersonMoviesConnectionSort!], where: PersonMoviesConnectionWhere): PersonMoviesConnection!
            }

            type PersonAggregateSelection {
              count: Int!
            }

            input PersonConnectInput {
              movies: [PersonMoviesConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            type PersonConnectedRelationships {
              movies: PersonMoviesConnectedRelationship
            }

            input PersonCreateInput {
              movies: PersonMoviesFieldInput
            }

            type PersonCreatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonDeleteInput {
              movies: [PersonMoviesDeleteFieldInput!]
            }

            type PersonDeletedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonDisconnectInput {
              movies: [PersonMoviesDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieMoviesAggregationSelection {
              count: Int!
              node: PersonMovieMoviesNodeAggregateSelection
            }

            type PersonMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              id: IDAggregateSelection!
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type PersonMoviesConnectedRelationship {
              node: MovieEventPayload!
            }

            type PersonMoviesConnection {
              edges: [PersonMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonMoviesConnectionSort {
              node: MovieSort
            }

            input PersonMoviesConnectionWhere {
              AND: [PersonMoviesConnectionWhere!]
              NOT: PersonMoviesConnectionWhere
              OR: [PersonMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input PersonMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input PersonMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
              actorCount_AVERAGE_EQUAL: Float
              actorCount_AVERAGE_GT: Float
              actorCount_AVERAGE_GTE: Float
              actorCount_AVERAGE_LT: Float
              actorCount_AVERAGE_LTE: Float
              actorCount_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_MAX_EQUAL: Int
              actorCount_MAX_GT: Int
              actorCount_MAX_GTE: Int
              actorCount_MAX_LT: Int
              actorCount_MAX_LTE: Int
              actorCount_MIN_EQUAL: Int
              actorCount_MIN_GT: Int
              actorCount_MIN_GTE: Int
              actorCount_MIN_LT: Int
              actorCount_MIN_LTE: Int
              actorCount_SUM_EQUAL: Int
              actorCount_SUM_GT: Int
              actorCount_SUM_GTE: Int
              actorCount_SUM_LT: Int
              actorCount_SUM_LTE: Int
              averageRating_AVERAGE_EQUAL: Float
              averageRating_AVERAGE_GT: Float
              averageRating_AVERAGE_GTE: Float
              averageRating_AVERAGE_LT: Float
              averageRating_AVERAGE_LTE: Float
              averageRating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_MAX_EQUAL: Float
              averageRating_MAX_GT: Float
              averageRating_MAX_GTE: Float
              averageRating_MAX_LT: Float
              averageRating_MAX_LTE: Float
              averageRating_MIN_EQUAL: Float
              averageRating_MIN_GT: Float
              averageRating_MIN_GTE: Float
              averageRating_MIN_LT: Float
              averageRating_MIN_LTE: Float
              averageRating_SUM_EQUAL: Float
              averageRating_SUM_GT: Float
              averageRating_SUM_GTE: Float
              averageRating_SUM_LT: Float
              averageRating_SUM_LTE: Float
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type PersonMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input PersonMoviesRelationshipSubscriptionWhere {
              node: MovieSubscriptionWhere
            }

            input PersonMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input PersonMoviesUpdateFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
              delete: [PersonMoviesDeleteFieldInput!]
              disconnect: [PersonMoviesDisconnectFieldInput!]
              update: PersonMoviesUpdateConnectionInput
              where: PersonMoviesConnectionWhere
            }

            input PersonOptions {
              limit: Int
              offset: Int
            }

            input PersonRelationInput {
              movies: [PersonMoviesCreateFieldInput!]
            }

            type PersonRelationshipCreatedEvent {
              createdRelationship: PersonConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input PersonRelationshipCreatedSubscriptionWhere {
              AND: [PersonRelationshipCreatedSubscriptionWhere!]
              NOT: PersonRelationshipCreatedSubscriptionWhere
              OR: [PersonRelationshipCreatedSubscriptionWhere!]
              createdRelationship: PersonRelationshipsSubscriptionWhere
            }

            type PersonRelationshipDeletedEvent {
              deletedRelationship: PersonConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input PersonRelationshipDeletedSubscriptionWhere {
              AND: [PersonRelationshipDeletedSubscriptionWhere!]
              NOT: PersonRelationshipDeletedSubscriptionWhere
              OR: [PersonRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: PersonRelationshipsSubscriptionWhere
            }

            input PersonRelationshipsSubscriptionWhere {
              movies: PersonMoviesRelationshipSubscriptionWhere
            }

            input PersonUpdateInput {
              movies: [PersonMoviesUpdateFieldInput!]
            }

            type PersonUpdatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: PersonMoviesAggregateInput
              moviesConnection: PersonMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return People where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: PersonMoviesConnectionWhere
              moviesConnection_NOT: PersonMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: PersonMoviesConnectionWhere
              \\"\\"\\"Return People where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return People where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
            }

            type Query {
              actors(options: QueryOptions, where: ActorWhere): [Actor!]!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, where: PersonWhere): PeopleConnection!
              stars(options: StarOptions, where: StarWhere): [Star!]!
              starsAggregate(where: StarWhere): StarAggregateSelection!
              starsConnection(after: String, first: Int, where: StarWhere): StarsConnection!
            }

            \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
            input QueryOptions {
              limit: Int
              offset: Int
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type Star {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): StarMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [StarMoviesConnectionSort!], where: StarMoviesConnectionWhere): StarMoviesConnection!
            }

            type StarAggregateSelection {
              count: Int!
            }

            input StarConnectInput {
              movies: [StarMoviesConnectFieldInput!]
            }

            input StarConnectWhere {
              node: StarWhere!
            }

            type StarConnectedRelationships {
              movies: StarMoviesConnectedRelationship
            }

            input StarCreateInput {
              movies: StarMoviesFieldInput
            }

            type StarCreatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input StarDeleteInput {
              movies: [StarMoviesDeleteFieldInput!]
            }

            type StarDeletedEvent {
              event: EventType!
              timestamp: Float!
            }

            input StarDisconnectInput {
              movies: [StarMoviesDisconnectFieldInput!]
            }

            type StarEdge {
              cursor: String!
              node: Star!
            }

            type StarMovieMoviesAggregationSelection {
              count: Int!
              node: StarMovieMoviesNodeAggregateSelection
            }

            type StarMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              id: IDAggregateSelection!
            }

            input StarMoviesAggregateInput {
              AND: [StarMoviesAggregateInput!]
              NOT: StarMoviesAggregateInput
              OR: [StarMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: StarMoviesNodeAggregationWhereInput
            }

            input StarMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type StarMoviesConnectedRelationship {
              node: MovieEventPayload!
            }

            type StarMoviesConnection {
              edges: [StarMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input StarMoviesConnectionSort {
              node: MovieSort
            }

            input StarMoviesConnectionWhere {
              AND: [StarMoviesConnectionWhere!]
              NOT: StarMoviesConnectionWhere
              OR: [StarMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input StarMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input StarMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
            }

            input StarMoviesNodeAggregationWhereInput {
              AND: [StarMoviesNodeAggregationWhereInput!]
              NOT: StarMoviesNodeAggregationWhereInput
              OR: [StarMoviesNodeAggregationWhereInput!]
              actorCount_AVERAGE_EQUAL: Float
              actorCount_AVERAGE_GT: Float
              actorCount_AVERAGE_GTE: Float
              actorCount_AVERAGE_LT: Float
              actorCount_AVERAGE_LTE: Float
              actorCount_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_MAX_EQUAL: Int
              actorCount_MAX_GT: Int
              actorCount_MAX_GTE: Int
              actorCount_MAX_LT: Int
              actorCount_MAX_LTE: Int
              actorCount_MIN_EQUAL: Int
              actorCount_MIN_GT: Int
              actorCount_MIN_GTE: Int
              actorCount_MIN_LT: Int
              actorCount_MIN_LTE: Int
              actorCount_SUM_EQUAL: Int
              actorCount_SUM_GT: Int
              actorCount_SUM_GTE: Int
              actorCount_SUM_LT: Int
              actorCount_SUM_LTE: Int
              averageRating_AVERAGE_EQUAL: Float
              averageRating_AVERAGE_GT: Float
              averageRating_AVERAGE_GTE: Float
              averageRating_AVERAGE_LT: Float
              averageRating_AVERAGE_LTE: Float
              averageRating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_MAX_EQUAL: Float
              averageRating_MAX_GT: Float
              averageRating_MAX_GTE: Float
              averageRating_MAX_LT: Float
              averageRating_MAX_LTE: Float
              averageRating_MIN_EQUAL: Float
              averageRating_MIN_GT: Float
              averageRating_MIN_GTE: Float
              averageRating_MIN_LT: Float
              averageRating_MIN_LTE: Float
              averageRating_SUM_EQUAL: Float
              averageRating_SUM_GT: Float
              averageRating_SUM_GTE: Float
              averageRating_SUM_LT: Float
              averageRating_SUM_LTE: Float
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type StarMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input StarMoviesRelationshipSubscriptionWhere {
              node: MovieSubscriptionWhere
            }

            input StarMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input StarMoviesUpdateFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
              delete: [StarMoviesDeleteFieldInput!]
              disconnect: [StarMoviesDisconnectFieldInput!]
              update: StarMoviesUpdateConnectionInput
              where: StarMoviesConnectionWhere
            }

            input StarOptions {
              limit: Int
              offset: Int
            }

            input StarRelationInput {
              movies: [StarMoviesCreateFieldInput!]
            }

            type StarRelationshipCreatedEvent {
              createdRelationship: StarConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input StarRelationshipCreatedSubscriptionWhere {
              AND: [StarRelationshipCreatedSubscriptionWhere!]
              NOT: StarRelationshipCreatedSubscriptionWhere
              OR: [StarRelationshipCreatedSubscriptionWhere!]
              createdRelationship: StarRelationshipsSubscriptionWhere
            }

            type StarRelationshipDeletedEvent {
              deletedRelationship: StarConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input StarRelationshipDeletedSubscriptionWhere {
              AND: [StarRelationshipDeletedSubscriptionWhere!]
              NOT: StarRelationshipDeletedSubscriptionWhere
              OR: [StarRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: StarRelationshipsSubscriptionWhere
            }

            input StarRelationshipsSubscriptionWhere {
              movies: StarMoviesRelationshipSubscriptionWhere
            }

            input StarUpdateInput {
              movies: [StarMoviesUpdateFieldInput!]
            }

            type StarUpdatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input StarWhere {
              AND: [StarWhere!]
              NOT: StarWhere
              OR: [StarWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: StarMoviesAggregateInput
              moviesConnection: StarMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Stars where all of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where none of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: StarMoviesConnectionWhere
              moviesConnection_NOT: StarMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Stars where one of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where some of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: StarMoviesConnectionWhere
              \\"\\"\\"Return Stars where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Stars where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Stars where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Stars where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
            }

            type StarsConnection {
              edges: [StarEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Subscription {
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
              movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              personCreated: PersonCreatedEvent!
              personDeleted: PersonDeletedEvent!
              personRelationshipCreated(where: PersonRelationshipCreatedSubscriptionWhere): PersonRelationshipCreatedEvent!
              personRelationshipDeleted(where: PersonRelationshipDeletedSubscriptionWhere): PersonRelationshipDeletedEvent!
              personUpdated: PersonUpdatedEvent!
              starCreated: StarCreatedEvent!
              starDeleted: StarDeletedEvent!
              starRelationshipCreated(where: StarRelationshipCreatedSubscriptionWhere): StarRelationshipCreatedEvent!
              starRelationshipDeleted(where: StarRelationshipDeletedSubscriptionWhere): StarRelationshipDeletedEvent!
              starUpdated: StarUpdatedEvent!
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
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }

            type UpdateStarsMutationResponse {
              info: UpdateInfo!
              stars: [Star!]!
            }"
        `);
    });

    test("Empty EventPayload type, but @relationshipProperty exists", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actors
            \\"\\"\\"
            type ActedIn {
              screenTime: Int!
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_MAX_EQUAL: Int
              screenTime_MAX_GT: Int
              screenTime_MAX_GTE: Int
              screenTime_MAX_LT: Int
              screenTime_MAX_LTE: Int
              screenTime_MIN_EQUAL: Int
              screenTime_MIN_GT: Int
              screenTime_MIN_GTE: Int
              screenTime_MIN_LT: Int
              screenTime_MIN_LTE: Int
              screenTime_SUM_EQUAL: Int
              screenTime_SUM_GT: Int
              screenTime_SUM_GTE: Int
              screenTime_SUM_LT: Int
              screenTime_SUM_LTE: Int
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInSubscriptionWhere {
              AND: [ActedInSubscriptionWhere!]
              NOT: ActedInSubscriptionWhere
              OR: [ActedInSubscriptionWhere!]
              screenTime: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
              screenTime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              screenTime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActedInUpdateInput {
              screenTime: Int
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
              screenTime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              screenTime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type Actor {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
            }

            type ActorAggregateSelection {
              count: Int!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            type ActorConnectedRelationships {
              movies: ActorMoviesConnectedRelationship
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
            }

            type ActorCreatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            type ActorDeletedEvent {
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

            type ActorMovieMoviesAggregationSelection {
              count: Int!
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              id: IDAggregateSelection!
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

            type ActorMoviesConnectedRelationship {
              node: MovieEventPayload!
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
              actorCount_AVERAGE_EQUAL: Float
              actorCount_AVERAGE_GT: Float
              actorCount_AVERAGE_GTE: Float
              actorCount_AVERAGE_LT: Float
              actorCount_AVERAGE_LTE: Float
              actorCount_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_MAX_EQUAL: Int
              actorCount_MAX_GT: Int
              actorCount_MAX_GTE: Int
              actorCount_MAX_LT: Int
              actorCount_MAX_LTE: Int
              actorCount_MIN_EQUAL: Int
              actorCount_MIN_GT: Int
              actorCount_MIN_GTE: Int
              actorCount_MIN_LT: Int
              actorCount_MIN_LTE: Int
              actorCount_SUM_EQUAL: Int
              actorCount_SUM_GT: Int
              actorCount_SUM_GTE: Int
              actorCount_SUM_LT: Int
              actorCount_SUM_LTE: Int
              averageRating_AVERAGE_EQUAL: Float
              averageRating_AVERAGE_GT: Float
              averageRating_AVERAGE_GTE: Float
              averageRating_AVERAGE_LT: Float
              averageRating_AVERAGE_LTE: Float
              averageRating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_MAX_EQUAL: Float
              averageRating_MAX_GT: Float
              averageRating_MAX_GTE: Float
              averageRating_MAX_LT: Float
              averageRating_MAX_LTE: Float
              averageRating_MIN_EQUAL: Float
              averageRating_MIN_GT: Float
              averageRating_MIN_GTE: Float
              averageRating_MIN_LT: Float
              averageRating_MIN_LTE: Float
              averageRating_SUM_EQUAL: Float
              averageRating_SUM_GT: Float
              averageRating_SUM_GTE: Float
              averageRating_SUM_LT: Float
              averageRating_SUM_LTE: Float
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input ActorMoviesRelationshipSubscriptionWhere {
              node: MovieSubscriptionWhere
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
            }

            input ActorRelationInput {
              movies: [ActorMoviesCreateFieldInput!]
            }

            type ActorRelationshipCreatedEvent {
              createdRelationship: ActorConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input ActorRelationshipCreatedSubscriptionWhere {
              AND: [ActorRelationshipCreatedSubscriptionWhere!]
              NOT: ActorRelationshipCreatedSubscriptionWhere
              OR: [ActorRelationshipCreatedSubscriptionWhere!]
              createdRelationship: ActorRelationshipsSubscriptionWhere
            }

            type ActorRelationshipDeletedEvent {
              deletedRelationship: ActorConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input ActorRelationshipDeletedSubscriptionWhere {
              AND: [ActorRelationshipDeletedSubscriptionWhere!]
              NOT: ActorRelationshipDeletedSubscriptionWhere
              OR: [ActorRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: ActorRelationshipsSubscriptionWhere
            }

            input ActorRelationshipsSubscriptionWhere {
              movies: ActorMoviesRelationshipSubscriptionWhere
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
            }

            type ActorUpdatedEvent {
              event: EventType!
              timestamp: Float!
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

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              actorCount: Int
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
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
              edge: ActedInAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            type MovieActorsConnectedRelationship {
              screenTime: Int!
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionSort {
              edge: ActedInSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ActorWhere
              node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
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

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ActedIn!
            }

            input MovieActorsRelationshipSubscriptionWhere {
              edge: ActedInSubscriptionWhere
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            type MovieConnectedRelationships {
              actors: MovieActorsConnectedRelationship
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              averageRating: Float
              id: ID
              isActive: Boolean
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

            type MovieRelationshipCreatedEvent {
              createdRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipCreatedSubscriptionWhere {
              AND: [MovieRelationshipCreatedSubscriptionWhere!]
              NOT: MovieRelationshipCreatedSubscriptionWhere
              OR: [MovieRelationshipCreatedSubscriptionWhere!]
              createdRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            type MovieRelationshipDeletedEvent {
              deletedRelationship: MovieConnectedRelationships!
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipDeletedSubscriptionWhere {
              AND: [MovieRelationshipDeletedSubscriptionWhere!]
              NOT: MovieRelationshipDeletedSubscriptionWhere
              OR: [MovieRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: MovieRelationshipsSubscriptionWhere
              movie: MovieSubscriptionWhere
            }

            input MovieRelationshipsSubscriptionWhere {
              actors: MovieActorsRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieUpdateInput {
              actorCount: Int
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: Float
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SUBTRACT: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, where: ActorWhere): ActorsConnection!
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

            type Subscription {
              actorCreated: ActorCreatedEvent!
              actorDeleted: ActorDeletedEvent!
              actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
              actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
              actorUpdated: ActorUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
              movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
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

    test("Subscriptions excluded", async () => {
        const typeDefs = gql`
            type Movie @subscription(events: []) {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type Actor {
              name: String!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              name: String!
            }

            type ActorCreatedEvent {
              createdActor: ActorEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type ActorDeletedEvent {
              deletedActor: ActorEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorEventPayload {
              name: String!
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
              name: SortDirection
            }

            input ActorSubscriptionWhere {
              AND: [ActorSubscriptionWhere!]
              NOT: ActorSubscriptionWhere
              OR: [ActorSubscriptionWhere!]
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

            input ActorUpdateInput {
              name: String
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

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              actorCount: Int
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
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
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
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
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsFieldInput
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieUpdateInput {
              actorCount: Int
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actors: [MovieActorsUpdateFieldInput!]
              averageRating: Float
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SUBTRACT: Float
              id: ID
              isActive: Boolean
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

            type Subscription {
              actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
              actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
              actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
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

    test("Type with relationship to a subscriptions excluded type", async () => {
        const typeDefs = gql`
            type User @mutation(operations: []) @subscription(events: []) {
                username: String!
                name: String
            }
            type Agreement {
                id: Int!
                name: String
                owner: User @relationship(type: "OWNED_BY", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type Agreement {
              id: Int!
              name: String
              owner(directed: Boolean = true, options: UserOptions, where: UserWhere): User
              ownerAggregate(directed: Boolean = true, where: UserWhere): AgreementUserOwnerAggregationSelection
              ownerConnection(after: String, directed: Boolean = true, first: Int, sort: [AgreementOwnerConnectionSort!], where: AgreementOwnerConnectionWhere): AgreementOwnerConnection!
            }

            type AgreementAggregateSelection {
              count: Int!
              id: IntAggregateSelection!
              name: StringAggregateSelection!
            }

            input AgreementConnectInput {
              owner: AgreementOwnerConnectFieldInput
            }

            type AgreementConnectedRelationships {
              owner: AgreementOwnerConnectedRelationship
            }

            input AgreementCreateInput {
              id: Int!
              name: String
              owner: AgreementOwnerFieldInput
            }

            type AgreementCreatedEvent {
              createdAgreement: AgreementEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input AgreementDeleteInput {
              owner: AgreementOwnerDeleteFieldInput
            }

            type AgreementDeletedEvent {
              deletedAgreement: AgreementEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input AgreementDisconnectInput {
              owner: AgreementOwnerDisconnectFieldInput
            }

            type AgreementEdge {
              cursor: String!
              node: Agreement!
            }

            type AgreementEventPayload {
              id: Int!
              name: String
            }

            input AgreementOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more AgreementSort objects to sort Agreements by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [AgreementSort!]
            }

            input AgreementOwnerAggregateInput {
              AND: [AgreementOwnerAggregateInput!]
              NOT: AgreementOwnerAggregateInput
              OR: [AgreementOwnerAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: AgreementOwnerNodeAggregationWhereInput
            }

            input AgreementOwnerConnectFieldInput {
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            type AgreementOwnerConnectedRelationship {
              node: UserEventPayload!
            }

            type AgreementOwnerConnection {
              edges: [AgreementOwnerRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input AgreementOwnerConnectionSort {
              node: UserSort
            }

            input AgreementOwnerConnectionWhere {
              AND: [AgreementOwnerConnectionWhere!]
              NOT: AgreementOwnerConnectionWhere
              OR: [AgreementOwnerConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input AgreementOwnerCreateFieldInput {
              node: UserCreateInput!
            }

            input AgreementOwnerDeleteFieldInput {
              where: AgreementOwnerConnectionWhere
            }

            input AgreementOwnerDisconnectFieldInput {
              where: AgreementOwnerConnectionWhere
            }

            input AgreementOwnerFieldInput {
              connect: AgreementOwnerConnectFieldInput
              create: AgreementOwnerCreateFieldInput
            }

            input AgreementOwnerNodeAggregationWhereInput {
              AND: [AgreementOwnerNodeAggregationWhereInput!]
              NOT: AgreementOwnerNodeAggregationWhereInput
              OR: [AgreementOwnerNodeAggregationWhereInput!]
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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

            type AgreementOwnerRelationship {
              cursor: String!
              node: User!
            }

            input AgreementOwnerRelationshipSubscriptionWhere {
              node: UserSubscriptionWhere
            }

            input AgreementOwnerUpdateConnectionInput {
              node: UserUpdateInput
            }

            input AgreementOwnerUpdateFieldInput {
              connect: AgreementOwnerConnectFieldInput
              create: AgreementOwnerCreateFieldInput
              delete: AgreementOwnerDeleteFieldInput
              disconnect: AgreementOwnerDisconnectFieldInput
              update: AgreementOwnerUpdateConnectionInput
              where: AgreementOwnerConnectionWhere
            }

            input AgreementRelationInput {
              owner: AgreementOwnerCreateFieldInput
            }

            type AgreementRelationshipCreatedEvent {
              agreement: AgreementEventPayload!
              createdRelationship: AgreementConnectedRelationships!
              event: EventType!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input AgreementRelationshipCreatedSubscriptionWhere {
              AND: [AgreementRelationshipCreatedSubscriptionWhere!]
              NOT: AgreementRelationshipCreatedSubscriptionWhere
              OR: [AgreementRelationshipCreatedSubscriptionWhere!]
              agreement: AgreementSubscriptionWhere
              createdRelationship: AgreementRelationshipsSubscriptionWhere
            }

            type AgreementRelationshipDeletedEvent {
              agreement: AgreementEventPayload!
              deletedRelationship: AgreementConnectedRelationships!
              event: EventType!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input AgreementRelationshipDeletedSubscriptionWhere {
              AND: [AgreementRelationshipDeletedSubscriptionWhere!]
              NOT: AgreementRelationshipDeletedSubscriptionWhere
              OR: [AgreementRelationshipDeletedSubscriptionWhere!]
              agreement: AgreementSubscriptionWhere
              deletedRelationship: AgreementRelationshipsSubscriptionWhere
            }

            input AgreementRelationshipsSubscriptionWhere {
              owner: AgreementOwnerRelationshipSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Agreements by. The order in which sorts are applied is not guaranteed when specifying many fields in one AgreementSort object.
            \\"\\"\\"
            input AgreementSort {
              id: SortDirection
              name: SortDirection
            }

            input AgreementSubscriptionWhere {
              AND: [AgreementSubscriptionWhere!]
              NOT: AgreementSubscriptionWhere
              OR: [AgreementSubscriptionWhere!]
              id: Int
              id_GT: Int
              id_GTE: Int
              id_IN: [Int!]
              id_LT: Int
              id_LTE: Int
              id_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            input AgreementUpdateInput {
              id: Int
              id_DECREMENT: Int
              id_INCREMENT: Int
              name: String
              owner: AgreementOwnerUpdateFieldInput
            }

            type AgreementUpdatedEvent {
              event: EventType!
              previousState: AgreementEventPayload!
              timestamp: Float!
              updatedAgreement: AgreementEventPayload!
            }

            type AgreementUserOwnerAggregationSelection {
              count: Int!
              node: AgreementUserOwnerNodeAggregateSelection
            }

            type AgreementUserOwnerNodeAggregateSelection {
              name: StringAggregateSelection!
              username: StringAggregateSelection!
            }

            input AgreementWhere {
              AND: [AgreementWhere!]
              NOT: AgreementWhere
              OR: [AgreementWhere!]
              id: Int
              id_GT: Int
              id_GTE: Int
              id_IN: [Int!]
              id_LT: Int
              id_LTE: Int
              id_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              owner: UserWhere
              ownerAggregate: AgreementOwnerAggregateInput
              ownerConnection: AgreementOwnerConnectionWhere
              ownerConnection_NOT: AgreementOwnerConnectionWhere
              owner_NOT: UserWhere
            }

            type AgreementsConnection {
              edges: [AgreementEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateAgreementsMutationResponse {
              agreements: [Agreement!]!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Mutation {
              createAgreements(input: [AgreementCreateInput!]!): CreateAgreementsMutationResponse!
              deleteAgreements(delete: AgreementDeleteInput, where: AgreementWhere): DeleteInfo!
              updateAgreements(connect: AgreementConnectInput, create: AgreementRelationInput, delete: AgreementDeleteInput, disconnect: AgreementDisconnectInput, update: AgreementUpdateInput, where: AgreementWhere): UpdateAgreementsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              agreements(options: AgreementOptions, where: AgreementWhere): [Agreement!]!
              agreementsAggregate(where: AgreementWhere): AgreementAggregateSelection!
              agreementsConnection(after: String, first: Int, sort: [AgreementSort], where: AgreementWhere): AgreementsConnection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
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
              agreementCreated(where: AgreementSubscriptionWhere): AgreementCreatedEvent!
              agreementDeleted(where: AgreementSubscriptionWhere): AgreementDeletedEvent!
              agreementRelationshipCreated(where: AgreementRelationshipCreatedSubscriptionWhere): AgreementRelationshipCreatedEvent!
              agreementRelationshipDeleted(where: AgreementRelationshipDeletedSubscriptionWhere): AgreementRelationshipDeletedEvent!
              agreementUpdated(where: AgreementSubscriptionWhere): AgreementUpdatedEvent!
            }

            type UpdateAgreementsMutationResponse {
              agreements: [Agreement!]!
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

            type User {
              name: String
              username: String!
            }

            type UserAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
              username: StringAggregateSelection!
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String
              username: String!
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            type UserEventPayload {
              name: String
              username: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              name: SortDirection
              username: SortDirection
            }

            input UserSubscriptionWhere {
              AND: [UserSubscriptionWhere!]
              NOT: UserSubscriptionWhere
              OR: [UserSubscriptionWhere!]
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
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

            input UserUpdateInput {
              name: String
              username: String
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
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

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Type with relationship to a subscriptions excluded type + Union type", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID
                actorCount: Int
                averageRating: Float
                isActive: Boolean
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Actor = Star | Person

            type Star @subscription(events: []) {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            type Person {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            union Actor = Person | Star

            input ActorWhere {
              Person: PersonWhere
              Star: StarWhere
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

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
            }

            type CreateStarsMutationResponse {
              info: CreateInfo!
              stars: [Star!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              actorCount: Int
              actors(directed: Boolean = true, options: QueryOptions, where: ActorWhere): [Actor!]!
              actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            input MovieActorsConnectInput {
              Person: [MovieActorsPersonConnectFieldInput!]
              Star: [MovieActorsStarConnectFieldInput!]
            }

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionWhere {
              Person: MovieActorsPersonConnectionWhere
              Star: MovieActorsStarConnectionWhere
            }

            input MovieActorsCreateFieldInput {
              Person: [MovieActorsPersonCreateFieldInput!]
              Star: [MovieActorsStarCreateFieldInput!]
            }

            input MovieActorsCreateInput {
              Person: MovieActorsPersonFieldInput
              Star: MovieActorsStarFieldInput
            }

            input MovieActorsDeleteInput {
              Person: [MovieActorsPersonDeleteFieldInput!]
              Star: [MovieActorsStarDeleteFieldInput!]
            }

            input MovieActorsDisconnectInput {
              Person: [MovieActorsPersonDisconnectFieldInput!]
              Star: [MovieActorsStarDisconnectFieldInput!]
            }

            input MovieActorsPersonConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            input MovieActorsPersonConnectionWhere {
              AND: [MovieActorsPersonConnectionWhere!]
              NOT: MovieActorsPersonConnectionWhere
              OR: [MovieActorsPersonConnectionWhere!]
              node: PersonWhere
              node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieActorsPersonCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieActorsPersonDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieActorsPersonConnectionWhere
            }

            input MovieActorsPersonFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
            }

            input MovieActorsPersonUpdateConnectionInput {
              node: PersonUpdateInput
            }

            input MovieActorsPersonUpdateFieldInput {
              connect: [MovieActorsPersonConnectFieldInput!]
              create: [MovieActorsPersonCreateFieldInput!]
              delete: [MovieActorsPersonDeleteFieldInput!]
              disconnect: [MovieActorsPersonDisconnectFieldInput!]
              update: MovieActorsPersonUpdateConnectionInput
              where: MovieActorsPersonConnectionWhere
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorsStarConnectFieldInput {
              connect: [StarConnectInput!]
              where: StarConnectWhere
            }

            input MovieActorsStarConnectionWhere {
              AND: [MovieActorsStarConnectionWhere!]
              NOT: MovieActorsStarConnectionWhere
              OR: [MovieActorsStarConnectionWhere!]
              node: StarWhere
              node_NOT: StarWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieActorsStarCreateFieldInput {
              node: StarCreateInput!
            }

            input MovieActorsStarDeleteFieldInput {
              delete: StarDeleteInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarDisconnectFieldInput {
              disconnect: StarDisconnectInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsStarFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
            }

            input MovieActorsStarUpdateConnectionInput {
              node: StarUpdateInput
            }

            input MovieActorsStarUpdateFieldInput {
              connect: [MovieActorsStarConnectFieldInput!]
              create: [MovieActorsStarCreateFieldInput!]
              delete: [MovieActorsStarDeleteFieldInput!]
              disconnect: [MovieActorsStarDisconnectFieldInput!]
              update: MovieActorsStarUpdateConnectionInput
              where: MovieActorsStarConnectionWhere
            }

            input MovieActorsUpdateInput {
              Person: [MovieActorsPersonUpdateFieldInput!]
              Star: [MovieActorsStarUpdateFieldInput!]
            }

            type MovieAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              count: Int!
              id: IDAggregateSelection!
            }

            input MovieConnectInput {
              actors: MovieActorsConnectInput
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actorCount: Int
              actors: MovieActorsCreateInput
              averageRating: Float
              id: ID
              isActive: Boolean
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              actors: MovieActorsDeleteInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDisconnectInput {
              actors: MovieActorsDisconnectInput
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              actorCount: Int
              averageRating: Float
              id: ID
              isActive: Boolean
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
              actors: MovieActorsCreateFieldInput
            }

            type MovieRelationshipCreatedEvent {
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipCreatedSubscriptionWhere {
              AND: [MovieRelationshipCreatedSubscriptionWhere!]
              NOT: MovieRelationshipCreatedSubscriptionWhere
              OR: [MovieRelationshipCreatedSubscriptionWhere!]
              movie: MovieSubscriptionWhere
            }

            type MovieRelationshipDeletedEvent {
              event: EventType!
              movie: MovieEventPayload!
              relationshipFieldName: String!
              timestamp: Float!
            }

            input MovieRelationshipDeletedSubscriptionWhere {
              AND: [MovieRelationshipDeletedSubscriptionWhere!]
              NOT: MovieRelationshipDeletedSubscriptionWhere
              OR: [MovieRelationshipDeletedSubscriptionWhere!]
              movie: MovieSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              actorCount: SortDirection
              averageRating: SortDirection
              id: SortDirection
              isActive: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieUpdateInput {
              actorCount: Int
              actorCount_DECREMENT: Int
              actorCount_INCREMENT: Int
              actors: MovieActorsUpdateInput
              averageRating: Float
              averageRating_ADD: Float
              averageRating_DIVIDE: Float
              averageRating_MULTIPLY: Float
              averageRating_SUBTRACT: Float
              id: ID
              isActive: Boolean
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
              actorCount: Int
              actorCount_GT: Int
              actorCount_GTE: Int
              actorCount_IN: [Int]
              actorCount_LT: Int
              actorCount_LTE: Int
              actorCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actorCount_NOT_IN: [Int] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
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
              averageRating: Float
              averageRating_GT: Float
              averageRating_GTE: Float
              averageRating_IN: [Float]
              averageRating_LT: Float
              averageRating_LTE: Float
              averageRating_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              averageRating_NOT_IN: [Float] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              isActive: Boolean
              isActive_NOT: Boolean @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createStars(input: [StarCreateInput!]!): CreateStarsMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteStars(delete: StarDeleteInput, where: StarWhere): DeleteInfo!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(connect: PersonConnectInput, create: PersonRelationInput, delete: PersonDeleteInput, disconnect: PersonDisconnectInput, update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateStars(connect: StarConnectInput, create: StarRelationInput, delete: StarDeleteInput, disconnect: StarDisconnectInput, update: StarUpdateInput, where: StarWhere): UpdateStarsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): PersonMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [PersonMoviesConnectionSort!], where: PersonMoviesConnectionWhere): PersonMoviesConnection!
            }

            type PersonAggregateSelection {
              count: Int!
            }

            input PersonConnectInput {
              movies: [PersonMoviesConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            type PersonConnectedRelationships {
              movies: PersonMoviesConnectedRelationship
            }

            input PersonCreateInput {
              movies: PersonMoviesFieldInput
            }

            type PersonCreatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonDeleteInput {
              movies: [PersonMoviesDeleteFieldInput!]
            }

            type PersonDeletedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonDisconnectInput {
              movies: [PersonMoviesDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieMoviesAggregationSelection {
              count: Int!
              node: PersonMovieMoviesNodeAggregateSelection
            }

            type PersonMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              id: IDAggregateSelection!
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type PersonMoviesConnectedRelationship {
              node: MovieEventPayload!
            }

            type PersonMoviesConnection {
              edges: [PersonMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonMoviesConnectionSort {
              node: MovieSort
            }

            input PersonMoviesConnectionWhere {
              AND: [PersonMoviesConnectionWhere!]
              NOT: PersonMoviesConnectionWhere
              OR: [PersonMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input PersonMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input PersonMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
              actorCount_AVERAGE_EQUAL: Float
              actorCount_AVERAGE_GT: Float
              actorCount_AVERAGE_GTE: Float
              actorCount_AVERAGE_LT: Float
              actorCount_AVERAGE_LTE: Float
              actorCount_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_MAX_EQUAL: Int
              actorCount_MAX_GT: Int
              actorCount_MAX_GTE: Int
              actorCount_MAX_LT: Int
              actorCount_MAX_LTE: Int
              actorCount_MIN_EQUAL: Int
              actorCount_MIN_GT: Int
              actorCount_MIN_GTE: Int
              actorCount_MIN_LT: Int
              actorCount_MIN_LTE: Int
              actorCount_SUM_EQUAL: Int
              actorCount_SUM_GT: Int
              actorCount_SUM_GTE: Int
              actorCount_SUM_LT: Int
              actorCount_SUM_LTE: Int
              averageRating_AVERAGE_EQUAL: Float
              averageRating_AVERAGE_GT: Float
              averageRating_AVERAGE_GTE: Float
              averageRating_AVERAGE_LT: Float
              averageRating_AVERAGE_LTE: Float
              averageRating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_MAX_EQUAL: Float
              averageRating_MAX_GT: Float
              averageRating_MAX_GTE: Float
              averageRating_MAX_LT: Float
              averageRating_MAX_LTE: Float
              averageRating_MIN_EQUAL: Float
              averageRating_MIN_GT: Float
              averageRating_MIN_GTE: Float
              averageRating_MIN_LT: Float
              averageRating_MIN_LTE: Float
              averageRating_SUM_EQUAL: Float
              averageRating_SUM_GT: Float
              averageRating_SUM_GTE: Float
              averageRating_SUM_LT: Float
              averageRating_SUM_LTE: Float
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type PersonMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input PersonMoviesRelationshipSubscriptionWhere {
              node: MovieSubscriptionWhere
            }

            input PersonMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input PersonMoviesUpdateFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
              delete: [PersonMoviesDeleteFieldInput!]
              disconnect: [PersonMoviesDisconnectFieldInput!]
              update: PersonMoviesUpdateConnectionInput
              where: PersonMoviesConnectionWhere
            }

            input PersonOptions {
              limit: Int
              offset: Int
            }

            input PersonRelationInput {
              movies: [PersonMoviesCreateFieldInput!]
            }

            type PersonRelationshipCreatedEvent {
              createdRelationship: PersonConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input PersonRelationshipCreatedSubscriptionWhere {
              AND: [PersonRelationshipCreatedSubscriptionWhere!]
              NOT: PersonRelationshipCreatedSubscriptionWhere
              OR: [PersonRelationshipCreatedSubscriptionWhere!]
              createdRelationship: PersonRelationshipsSubscriptionWhere
            }

            type PersonRelationshipDeletedEvent {
              deletedRelationship: PersonConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input PersonRelationshipDeletedSubscriptionWhere {
              AND: [PersonRelationshipDeletedSubscriptionWhere!]
              NOT: PersonRelationshipDeletedSubscriptionWhere
              OR: [PersonRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: PersonRelationshipsSubscriptionWhere
            }

            input PersonRelationshipsSubscriptionWhere {
              movies: PersonMoviesRelationshipSubscriptionWhere
            }

            input PersonUpdateInput {
              movies: [PersonMoviesUpdateFieldInput!]
            }

            type PersonUpdatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: PersonMoviesAggregateInput
              moviesConnection: PersonMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return People where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: PersonMoviesConnectionWhere
              moviesConnection_NOT: PersonMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: PersonMoviesConnectionWhere
              \\"\\"\\"Return People where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return People where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
            }

            type Query {
              actors(options: QueryOptions, where: ActorWhere): [Actor!]!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, where: PersonWhere): PeopleConnection!
              stars(options: StarOptions, where: StarWhere): [Star!]!
              starsAggregate(where: StarWhere): StarAggregateSelection!
              starsConnection(after: String, first: Int, where: StarWhere): StarsConnection!
            }

            \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
            input QueryOptions {
              limit: Int
              offset: Int
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type Star {
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): StarMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [StarMoviesConnectionSort!], where: StarMoviesConnectionWhere): StarMoviesConnection!
            }

            type StarAggregateSelection {
              count: Int!
            }

            input StarConnectInput {
              movies: [StarMoviesConnectFieldInput!]
            }

            input StarConnectWhere {
              node: StarWhere!
            }

            input StarCreateInput {
              movies: StarMoviesFieldInput
            }

            input StarDeleteInput {
              movies: [StarMoviesDeleteFieldInput!]
            }

            input StarDisconnectInput {
              movies: [StarMoviesDisconnectFieldInput!]
            }

            type StarEdge {
              cursor: String!
              node: Star!
            }

            type StarMovieMoviesAggregationSelection {
              count: Int!
              node: StarMovieMoviesNodeAggregateSelection
            }

            type StarMovieMoviesNodeAggregateSelection {
              actorCount: IntAggregateSelection!
              averageRating: FloatAggregateSelection!
              id: IDAggregateSelection!
            }

            input StarMoviesAggregateInput {
              AND: [StarMoviesAggregateInput!]
              NOT: StarMoviesAggregateInput
              OR: [StarMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: StarMoviesNodeAggregationWhereInput
            }

            input StarMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type StarMoviesConnection {
              edges: [StarMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input StarMoviesConnectionSort {
              node: MovieSort
            }

            input StarMoviesConnectionWhere {
              AND: [StarMoviesConnectionWhere!]
              NOT: StarMoviesConnectionWhere
              OR: [StarMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input StarMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input StarMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: StarMoviesConnectionWhere
            }

            input StarMoviesFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
            }

            input StarMoviesNodeAggregationWhereInput {
              AND: [StarMoviesNodeAggregationWhereInput!]
              NOT: StarMoviesNodeAggregationWhereInput
              OR: [StarMoviesNodeAggregationWhereInput!]
              actorCount_AVERAGE_EQUAL: Float
              actorCount_AVERAGE_GT: Float
              actorCount_AVERAGE_GTE: Float
              actorCount_AVERAGE_LT: Float
              actorCount_AVERAGE_LTE: Float
              actorCount_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              actorCount_MAX_EQUAL: Int
              actorCount_MAX_GT: Int
              actorCount_MAX_GTE: Int
              actorCount_MAX_LT: Int
              actorCount_MAX_LTE: Int
              actorCount_MIN_EQUAL: Int
              actorCount_MIN_GT: Int
              actorCount_MIN_GTE: Int
              actorCount_MIN_LT: Int
              actorCount_MIN_LTE: Int
              actorCount_SUM_EQUAL: Int
              actorCount_SUM_GT: Int
              actorCount_SUM_GTE: Int
              actorCount_SUM_LT: Int
              actorCount_SUM_LTE: Int
              averageRating_AVERAGE_EQUAL: Float
              averageRating_AVERAGE_GT: Float
              averageRating_AVERAGE_GTE: Float
              averageRating_AVERAGE_LT: Float
              averageRating_AVERAGE_LTE: Float
              averageRating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              averageRating_MAX_EQUAL: Float
              averageRating_MAX_GT: Float
              averageRating_MAX_GTE: Float
              averageRating_MAX_LT: Float
              averageRating_MAX_LTE: Float
              averageRating_MIN_EQUAL: Float
              averageRating_MIN_GT: Float
              averageRating_MIN_GTE: Float
              averageRating_MIN_LT: Float
              averageRating_MIN_LTE: Float
              averageRating_SUM_EQUAL: Float
              averageRating_SUM_GT: Float
              averageRating_SUM_GTE: Float
              averageRating_SUM_LT: Float
              averageRating_SUM_LTE: Float
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type StarMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input StarMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input StarMoviesUpdateFieldInput {
              connect: [StarMoviesConnectFieldInput!]
              create: [StarMoviesCreateFieldInput!]
              delete: [StarMoviesDeleteFieldInput!]
              disconnect: [StarMoviesDisconnectFieldInput!]
              update: StarMoviesUpdateConnectionInput
              where: StarMoviesConnectionWhere
            }

            input StarOptions {
              limit: Int
              offset: Int
            }

            input StarRelationInput {
              movies: [StarMoviesCreateFieldInput!]
            }

            input StarUpdateInput {
              movies: [StarMoviesUpdateFieldInput!]
            }

            input StarWhere {
              AND: [StarWhere!]
              NOT: StarWhere
              OR: [StarWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: StarMoviesAggregateInput
              moviesConnection: StarMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Stars where all of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where none of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: StarMoviesConnectionWhere
              moviesConnection_NOT: StarMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Stars where one of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: StarMoviesConnectionWhere
              \\"\\"\\"
              Return Stars where some of the related StarMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: StarMoviesConnectionWhere
              \\"\\"\\"Return Stars where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Stars where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Stars where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Stars where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
            }

            type StarsConnection {
              edges: [StarEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Subscription {
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
              movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              personCreated: PersonCreatedEvent!
              personDeleted: PersonDeletedEvent!
              personRelationshipCreated(where: PersonRelationshipCreatedSubscriptionWhere): PersonRelationshipCreatedEvent!
              personRelationshipDeleted(where: PersonRelationshipDeletedSubscriptionWhere): PersonRelationshipDeletedEvent!
              personUpdated: PersonUpdatedEvent!
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
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }

            type UpdateStarsMutationResponse {
              info: UpdateInfo!
              stars: [Star!]!
            }"
        `);
    });

    test("Type with relationship to a subscriptions excluded type + Interface type", async () => {
        const typeDefs = gql`
            type Movie implements Production @subscription(events: []) {
                title: String!
                id: ID @unique
                director: Creature! @relationship(type: "DIRECTED", direction: IN)
            }

            type Series implements Production {
                title: String!
                episode: Int!
                id: ID @unique
                director: Creature! @relationship(type: "DIRECTED", direction: IN)
            }

            interface Production {
                id: ID
                director: Creature! @declareRelationship
            }

            type Person implements Creature {
                movies: Production! @relationship(type: "DIRECTED", direction: OUT)
            }

            interface Creature {
                movies: Production! @declareRelationship
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
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

            type CreatePeopleMutationResponse {
              info: CreateInfo!
              people: [Person!]!
            }

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            interface Creature {
              movies(options: ProductionOptions, where: ProductionWhere): Production!
              moviesConnection(after: String, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type CreatureAggregateSelection {
              count: Int!
            }

            input CreatureConnectInput {
              movies: CreatureMoviesConnectFieldInput
            }

            input CreatureConnectWhere {
              node: CreatureWhere!
            }

            input CreatureCreateInput {
              Person: PersonCreateInput
            }

            input CreatureDeleteInput {
              movies: CreatureMoviesDeleteFieldInput
            }

            input CreatureDisconnectInput {
              movies: CreatureMoviesDisconnectFieldInput
            }

            type CreatureEdge {
              cursor: String!
              node: Creature!
            }

            enum CreatureImplementation {
              Person
            }

            input CreatureMoviesAggregateInput {
              AND: [CreatureMoviesAggregateInput!]
              NOT: CreatureMoviesAggregateInput
              OR: [CreatureMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: CreatureMoviesNodeAggregationWhereInput
            }

            input CreatureMoviesConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            type CreatureMoviesConnection {
              edges: [CreatureMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input CreatureMoviesConnectionSort {
              node: ProductionSort
            }

            input CreatureMoviesConnectionWhere {
              AND: [CreatureMoviesConnectionWhere!]
              NOT: CreatureMoviesConnectionWhere
              OR: [CreatureMoviesConnectionWhere!]
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input CreatureMoviesCreateFieldInput {
              node: ProductionCreateInput!
            }

            input CreatureMoviesDeleteFieldInput {
              delete: ProductionDeleteInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureMoviesDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureMoviesNodeAggregationWhereInput {
              AND: [CreatureMoviesNodeAggregationWhereInput!]
              NOT: CreatureMoviesNodeAggregationWhereInput
              OR: [CreatureMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type CreatureMoviesRelationship {
              cursor: String!
              node: Production!
            }

            input CreatureMoviesUpdateConnectionInput {
              node: ProductionUpdateInput
            }

            input CreatureMoviesUpdateFieldInput {
              connect: CreatureMoviesConnectFieldInput
              create: CreatureMoviesCreateFieldInput
              delete: CreatureMoviesDeleteFieldInput
              disconnect: CreatureMoviesDisconnectFieldInput
              update: CreatureMoviesUpdateConnectionInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureOptions {
              limit: Int
              offset: Int
            }

            input CreatureUpdateInput {
              movies: CreatureMoviesUpdateFieldInput
            }

            input CreatureWhere {
              AND: [CreatureWhere!]
              NOT: CreatureWhere
              OR: [CreatureWhere!]
              movies: ProductionWhere
              moviesAggregate: CreatureMoviesAggregateInput
              moviesConnection: CreatureMoviesConnectionWhere
              moviesConnection_NOT: CreatureMoviesConnectionWhere
              movies_NOT: ProductionWhere
              typename_IN: [CreatureImplementation!]
            }

            type CreaturesConnection {
              edges: [CreatureEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              director(directed: Boolean = true, options: CreatureOptions, where: CreatureWhere): Creature!
              directorAggregate(directed: Boolean = true, where: CreatureWhere): MovieCreatureDirectorAggregationSelection
              directorConnection(after: String, directed: Boolean = true, first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              director: MovieDirectorConnectFieldInput
            }

            input MovieCreateInput {
              director: MovieDirectorFieldInput
              id: ID
              title: String!
            }

            type MovieCreatureDirectorAggregationSelection {
              count: Int!
            }

            input MovieDeleteInput {
              director: MovieDirectorDeleteFieldInput
            }

            input MovieDirectorAggregateInput {
              AND: [MovieDirectorAggregateInput!]
              NOT: MovieDirectorAggregateInput
              OR: [MovieDirectorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
            }

            input MovieDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            input MovieDirectorCreateFieldInput {
              node: CreatureCreateInput!
            }

            input MovieDirectorDeleteFieldInput {
              delete: CreatureDeleteInput
              where: ProductionDirectorConnectionWhere
            }

            input MovieDirectorDisconnectFieldInput {
              disconnect: CreatureDisconnectInput
              where: ProductionDirectorConnectionWhere
            }

            input MovieDirectorFieldInput {
              connect: MovieDirectorConnectFieldInput
              create: MovieDirectorCreateFieldInput
            }

            input MovieDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input MovieDirectorUpdateFieldInput {
              connect: MovieDirectorConnectFieldInput
              create: MovieDirectorCreateFieldInput
              delete: MovieDirectorDeleteFieldInput
              disconnect: MovieDirectorDisconnectFieldInput
              update: MovieDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            input MovieDisconnectInput {
              director: MovieDirectorDisconnectFieldInput
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
              director: MovieDirectorCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              director: MovieDirectorUpdateFieldInput
              id: ID
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              director: CreatureWhere
              directorAggregate: MovieDirectorAggregateInput
              directorConnection: ProductionDirectorConnectionWhere
              directorConnection_NOT: ProductionDirectorConnectionWhere
              director_NOT: CreatureWhere
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
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(connect: PersonConnectInput, create: PersonRelationInput, delete: PersonDeleteInput, disconnect: PersonDisconnectInput, update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateSeries(connect: SeriesConnectInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person implements Creature {
              movies(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): Production!
              moviesAggregate(directed: Boolean = true, where: ProductionWhere): PersonProductionMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type PersonAggregateSelection {
              count: Int!
            }

            input PersonConnectInput {
              movies: PersonMoviesConnectFieldInput
            }

            type PersonConnectedRelationships {
              movies: PersonMoviesConnectedRelationship
            }

            input PersonCreateInput {
              movies: PersonMoviesFieldInput
            }

            type PersonCreatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonDeleteInput {
              movies: PersonMoviesDeleteFieldInput
            }

            type PersonDeletedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonDisconnectInput {
              movies: PersonMoviesDisconnectFieldInput
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            type PersonMoviesConnectedRelationship {
              node: ProductionEventPayload!
            }

            input PersonMoviesCreateFieldInput {
              node: ProductionCreateInput!
            }

            input PersonMoviesDeleteFieldInput {
              delete: ProductionDeleteInput
              where: CreatureMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: CreatureMoviesConnectionWhere
            }

            input PersonMoviesFieldInput {
              connect: PersonMoviesConnectFieldInput
              create: PersonMoviesCreateFieldInput
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            input PersonMoviesRelationshipSubscriptionWhere {
              node: ProductionSubscriptionWhere
            }

            input PersonMoviesUpdateConnectionInput {
              node: ProductionUpdateInput
            }

            input PersonMoviesUpdateFieldInput {
              connect: PersonMoviesConnectFieldInput
              create: PersonMoviesCreateFieldInput
              delete: PersonMoviesDeleteFieldInput
              disconnect: PersonMoviesDisconnectFieldInput
              update: PersonMoviesUpdateConnectionInput
              where: CreatureMoviesConnectionWhere
            }

            input PersonOptions {
              limit: Int
              offset: Int
            }

            type PersonProductionMoviesAggregationSelection {
              count: Int!
              node: PersonProductionMoviesNodeAggregateSelection
            }

            type PersonProductionMoviesNodeAggregateSelection {
              id: IDAggregateSelection!
            }

            input PersonRelationInput {
              movies: PersonMoviesCreateFieldInput
            }

            type PersonRelationshipCreatedEvent {
              createdRelationship: PersonConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input PersonRelationshipCreatedSubscriptionWhere {
              AND: [PersonRelationshipCreatedSubscriptionWhere!]
              NOT: PersonRelationshipCreatedSubscriptionWhere
              OR: [PersonRelationshipCreatedSubscriptionWhere!]
              createdRelationship: PersonRelationshipsSubscriptionWhere
            }

            type PersonRelationshipDeletedEvent {
              deletedRelationship: PersonConnectedRelationships!
              event: EventType!
              timestamp: Float!
            }

            input PersonRelationshipDeletedSubscriptionWhere {
              AND: [PersonRelationshipDeletedSubscriptionWhere!]
              NOT: PersonRelationshipDeletedSubscriptionWhere
              OR: [PersonRelationshipDeletedSubscriptionWhere!]
              deletedRelationship: PersonRelationshipsSubscriptionWhere
            }

            input PersonRelationshipsSubscriptionWhere {
              movies: PersonMoviesRelationshipSubscriptionWhere
            }

            input PersonUpdateInput {
              movies: PersonMoviesUpdateFieldInput
            }

            type PersonUpdatedEvent {
              event: EventType!
              timestamp: Float!
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              movies: ProductionWhere
              moviesAggregate: PersonMoviesAggregateInput
              moviesConnection: CreatureMoviesConnectionWhere
              moviesConnection_NOT: CreatureMoviesConnectionWhere
              movies_NOT: ProductionWhere
            }

            interface Production {
              director(options: CreatureOptions, where: CreatureWhere): Creature!
              directorConnection(after: String, first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
            }

            type ProductionAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input ProductionConnectInput {
              director: ProductionDirectorConnectFieldInput
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              director: ProductionDirectorDeleteFieldInput
            }

            input ProductionDirectorAggregateInput {
              AND: [ProductionDirectorAggregateInput!]
              NOT: ProductionDirectorAggregateInput
              OR: [ProductionDirectorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
            }

            input ProductionDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            type ProductionDirectorConnection {
              edges: [ProductionDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionDirectorConnectionWhere {
              AND: [ProductionDirectorConnectionWhere!]
              NOT: ProductionDirectorConnectionWhere
              OR: [ProductionDirectorConnectionWhere!]
              node: CreatureWhere
              node_NOT: CreatureWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ProductionDirectorCreateFieldInput {
              node: CreatureCreateInput!
            }

            input ProductionDirectorDeleteFieldInput {
              delete: CreatureDeleteInput
              where: ProductionDirectorConnectionWhere
            }

            input ProductionDirectorDisconnectFieldInput {
              disconnect: CreatureDisconnectInput
              where: ProductionDirectorConnectionWhere
            }

            type ProductionDirectorRelationship {
              cursor: String!
              node: Creature!
            }

            input ProductionDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input ProductionDirectorUpdateFieldInput {
              connect: ProductionDirectorConnectFieldInput
              create: ProductionDirectorCreateFieldInput
              delete: ProductionDirectorDeleteFieldInput
              disconnect: ProductionDirectorDisconnectFieldInput
              update: ProductionDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            input ProductionDisconnectInput {
              director: ProductionDirectorDisconnectFieldInput
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            interface ProductionEventPayload {
              id: ID
            }

            enum ProductionImplementation {
              Movie
              Series
            }

            input ProductionOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ProductionSort objects to sort Productions by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ProductionSort]
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              id: SortDirection
            }

            input ProductionSubscriptionWhere {
              AND: [ProductionSubscriptionWhere!]
              NOT: ProductionSubscriptionWhere
              OR: [ProductionSubscriptionWhere!]
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
              typename_IN: [ProductionImplementation!]
            }

            input ProductionUpdateInput {
              director: ProductionDirectorUpdateFieldInput
              id: ID
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              director: CreatureWhere
              directorAggregate: ProductionDirectorAggregateInput
              directorConnection: ProductionDirectorConnectionWhere
              directorConnection_NOT: ProductionDirectorConnectionWhere
              director_NOT: CreatureWhere
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
              typename_IN: [ProductionImplementation!]
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              creatures(options: CreatureOptions, where: CreatureWhere): [Creature!]!
              creaturesAggregate(where: CreatureWhere): CreatureAggregateSelection!
              creaturesConnection(after: String, first: Int, where: CreatureWhere): CreaturesConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, where: PersonWhere): PeopleConnection!
              productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              director(directed: Boolean = true, options: CreatureOptions, where: CreatureWhere): Creature!
              directorAggregate(directed: Boolean = true, where: CreatureWhere): SeriesCreatureDirectorAggregationSelection
              directorConnection(after: String, directed: Boolean = true, first: Int, where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              episode: Int!
              id: ID
              title: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              episode: IntAggregateSelection!
              id: IDAggregateSelection!
              title: StringAggregateSelection!
            }

            input SeriesConnectInput {
              director: SeriesDirectorConnectFieldInput
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              director: SeriesDirectorFieldInput
              episode: Int!
              id: ID
              title: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type SeriesCreatureDirectorAggregationSelection {
              count: Int!
            }

            input SeriesDeleteInput {
              director: SeriesDirectorDeleteFieldInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDirectorAggregateInput {
              AND: [SeriesDirectorAggregateInput!]
              NOT: SeriesDirectorAggregateInput
              OR: [SeriesDirectorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
            }

            input SeriesDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            input SeriesDirectorCreateFieldInput {
              node: CreatureCreateInput!
            }

            input SeriesDirectorDeleteFieldInput {
              delete: CreatureDeleteInput
              where: ProductionDirectorConnectionWhere
            }

            input SeriesDirectorDisconnectFieldInput {
              disconnect: CreatureDisconnectInput
              where: ProductionDirectorConnectionWhere
            }

            input SeriesDirectorFieldInput {
              connect: SeriesDirectorConnectFieldInput
              create: SeriesDirectorCreateFieldInput
            }

            input SeriesDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input SeriesDirectorUpdateFieldInput {
              connect: SeriesDirectorConnectFieldInput
              create: SeriesDirectorCreateFieldInput
              delete: SeriesDirectorDeleteFieldInput
              disconnect: SeriesDirectorDisconnectFieldInput
              update: SeriesDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            input SeriesDisconnectInput {
              director: SeriesDirectorDisconnectFieldInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload implements ProductionEventPayload {
              episode: Int!
              id: ID
              title: String!
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            input SeriesRelationInput {
              director: SeriesDirectorCreateFieldInput
            }

            type SeriesRelationshipCreatedEvent {
              event: EventType!
              relationshipFieldName: String!
              series: SeriesEventPayload!
              timestamp: Float!
            }

            input SeriesRelationshipCreatedSubscriptionWhere {
              AND: [SeriesRelationshipCreatedSubscriptionWhere!]
              NOT: SeriesRelationshipCreatedSubscriptionWhere
              OR: [SeriesRelationshipCreatedSubscriptionWhere!]
              series: SeriesSubscriptionWhere
            }

            type SeriesRelationshipDeletedEvent {
              event: EventType!
              relationshipFieldName: String!
              series: SeriesEventPayload!
              timestamp: Float!
            }

            input SeriesRelationshipDeletedSubscriptionWhere {
              AND: [SeriesRelationshipDeletedSubscriptionWhere!]
              NOT: SeriesRelationshipDeletedSubscriptionWhere
              OR: [SeriesRelationshipDeletedSubscriptionWhere!]
              series: SeriesSubscriptionWhere
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episode: SortDirection
              id: SortDirection
              title: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              episode: Int
              episode_GT: Int
              episode_GTE: Int
              episode_IN: [Int!]
              episode_LT: Int
              episode_LTE: Int
              episode_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episode_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            input SeriesUpdateInput {
              director: SeriesDirectorUpdateFieldInput
              episode: Int
              episode_DECREMENT: Int
              episode_INCREMENT: Int
              id: ID
              title: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              director: CreatureWhere
              directorAggregate: SeriesDirectorAggregateInput
              directorConnection: ProductionDirectorConnectionWhere
              directorConnection_NOT: ProductionDirectorConnectionWhere
              director_NOT: CreatureWhere
              episode: Int
              episode_GT: Int
              episode_GTE: Int
              episode_IN: [Int!]
              episode_LT: Int
              episode_LTE: Int
              episode_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episode_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              personCreated: PersonCreatedEvent!
              personDeleted: PersonDeletedEvent!
              personRelationshipCreated(where: PersonRelationshipCreatedSubscriptionWhere): PersonRelationshipCreatedEvent!
              personRelationshipDeleted(where: PersonRelationshipDeletedSubscriptionWhere): PersonRelationshipDeletedEvent!
              personUpdated: PersonUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesRelationshipCreated(where: SeriesRelationshipCreatedSubscriptionWhere): SeriesRelationshipCreatedEvent!
              seriesRelationshipDeleted(where: SeriesRelationshipDeletedSubscriptionWhere): SeriesRelationshipDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
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
            }

            type UpdatePeopleMutationResponse {
              info: UpdateInfo!
              people: [Person!]!
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });
});
