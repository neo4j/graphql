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

import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { lexicographicSortSchema } from "graphql";
import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";

describe("@filterable directive", () => {
    let plugin: TestSubscriptionsPlugin;

    beforeAll(() => {
        plugin = new TestSubscriptionsPlugin();
    });

    describe("on SCALAR", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String @filterable
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                input ActorRelationInput {
                  movies: [ActorMoviesCreateFieldInput!]
                }

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  createdRelationship: ActorRelationshipsSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  deletedRelationship: ActorRelationshipsSubscriptionWhere
                }

                input ActorRelationshipsSubscriptionWhere {
                  movies: ActorMoviesRelationshipSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                  title: SortDirection
                }

                input MovieSubscriptionWhere {
                  AND: [MovieSubscriptionWhere!]
                  NOT: MovieSubscriptionWhere
                  OR: [MovieSubscriptionWhere!]
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

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
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

        test("enable value and aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String @filterable(byValue: true, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                input ActorRelationInput {
                  movies: [ActorMoviesCreateFieldInput!]
                }

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  createdRelationship: ActorRelationshipsSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  deletedRelationship: ActorRelationshipsSubscriptionWhere
                }

                input ActorRelationshipsSubscriptionWhere {
                  movies: ActorMoviesRelationshipSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                  title: SortDirection
                }

                input MovieSubscriptionWhere {
                  AND: [MovieSubscriptionWhere!]
                  NOT: MovieSubscriptionWhere
                  OR: [MovieSubscriptionWhere!]
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

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
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

        test("disable only value filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String @filterable(byValue: false, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                }

                input MovieRelationshipsSubscriptionWhere {
                  actors: MovieActorsRelationshipSubscriptionWhere
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                  actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                  movieCreated: MovieCreatedEvent!
                  movieDeleted: MovieDeletedEvent!
                  movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                  movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                  movieUpdated: MovieUpdatedEvent!
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

        test("enable only aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String @filterable(byValue: false, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                }

                input MovieRelationshipsSubscriptionWhere {
                  actors: MovieActorsRelationshipSubscriptionWhere
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                  actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                  movieCreated: MovieCreatedEvent!
                  movieDeleted: MovieDeletedEvent!
                  movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                  movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                  movieUpdated: MovieUpdatedEvent!
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
    describe("on RELATIONSHIP FIELD", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                input ActorRelationInput {
                  movies: [ActorMoviesCreateFieldInput!]
                }

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  createdRelationship: ActorRelationshipsSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  deletedRelationship: ActorRelationshipsSubscriptionWhere
                }

                input ActorRelationshipsSubscriptionWhere {
                  movies: ActorMoviesRelationshipSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
                }

                input MovieActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                  title: SortDirection
                }

                input MovieSubscriptionWhere {
                  AND: [MovieSubscriptionWhere!]
                  NOT: MovieSubscriptionWhere
                  OR: [MovieSubscriptionWhere!]
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

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
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

        test("enable value and aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                input ActorRelationInput {
                  movies: [ActorMoviesCreateFieldInput!]
                }

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  createdRelationship: ActorRelationshipsSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  deletedRelationship: ActorRelationshipsSubscriptionWhere
                }

                input ActorRelationshipsSubscriptionWhere {
                  movies: ActorMoviesRelationshipSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                  title: SortDirection
                }

                input MovieSubscriptionWhere {
                  AND: [MovieSubscriptionWhere!]
                  NOT: MovieSubscriptionWhere
                  OR: [MovieSubscriptionWhere!]
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

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
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

        test("enable only aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: false, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                input ActorRelationInput {
                  movies: [ActorMoviesCreateFieldInput!]
                }

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  createdRelationship: ActorRelationshipsSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  deletedRelationship: ActorRelationshipsSubscriptionWhere
                }

                input ActorRelationshipsSubscriptionWhere {
                  movies: ActorMoviesRelationshipSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                  title: SortDirection
                }

                input MovieSubscriptionWhere {
                  AND: [MovieSubscriptionWhere!]
                  NOT: MovieSubscriptionWhere
                  OR: [MovieSubscriptionWhere!]
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

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
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

        test("enable only value filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
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
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
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

                type ActorMovieMoviesAggregationSelection {
                  count: Int!
                  node: ActorMovieMoviesNodeAggregateSelection
                }

                type ActorMovieMoviesNodeAggregateSelection {
                  title: StringAggregateSelectionNullable!
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
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  \\"\\"\\"
                  Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [ActorSort!]
                }

                input ActorRelationInput {
                  movies: [ActorMoviesCreateFieldInput!]
                }

                type ActorRelationshipCreatedEvent {
                  actor: ActorEventPayload!
                  createdRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipCreatedSubscriptionWhere {
                  AND: [ActorRelationshipCreatedSubscriptionWhere!]
                  NOT: ActorRelationshipCreatedSubscriptionWhere
                  OR: [ActorRelationshipCreatedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  createdRelationship: ActorRelationshipsSubscriptionWhere
                }

                type ActorRelationshipDeletedEvent {
                  actor: ActorEventPayload!
                  deletedRelationship: ActorConnectedRelationships!
                  event: EventType!
                  relationshipFieldName: String!
                  timestamp: Float!
                }

                input ActorRelationshipDeletedSubscriptionWhere {
                  AND: [ActorRelationshipDeletedSubscriptionWhere!]
                  NOT: ActorRelationshipDeletedSubscriptionWhere
                  OR: [ActorRelationshipDeletedSubscriptionWhere!]
                  actor: ActorSubscriptionWhere
                  deletedRelationship: ActorRelationshipsSubscriptionWhere
                }

                input ActorRelationshipsSubscriptionWhere {
                  movies: ActorMoviesRelationshipSubscriptionWhere
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
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
                }

                input ActorUpdateInput {
                  movies: [ActorMoviesUpdateFieldInput!]
                  password: String
                  username: String
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

                enum EventType {
                  CREATE
                  CREATE_RELATIONSHIP
                  DELETE
                  DELETE_RELATIONSHIP
                  UPDATE
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
                  password: StringAggregateSelectionNonNullable!
                  username: StringAggregateSelectionNonNullable!
                }

                input MovieActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
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
                  count: Int!
                  title: StringAggregateSelectionNullable!
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
                  title: SortDirection
                }

                input MovieSubscriptionWhere {
                  AND: [MovieSubscriptionWhere!]
                  NOT: MovieSubscriptionWhere
                  OR: [MovieSubscriptionWhere!]
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

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
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

                type Subscription {
                  actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                  actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                  actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                  actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
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
});
